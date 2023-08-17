"use strict";
define(['app','adjust-memo','api','atomic/bomb'],function(app,AM){
	const DATE_FORMAT = 'dd MMM yyyy';
	const ADJUST_TYPES = {};
	app.register.controller('AdjustMemoController',['$scope','$rootScope','$filter','api','Atomic',
	function($scope,$rootScope,$filter,api,atomic){
		const $selfScope =  $scope;
		$scope = this;
		console.log($filter('date'));

		$scope.init = function(){
			loadUIComps();
		}
		$scope.computeAdjust = function(){
			let amt = $scope.AdjustAmount;
			let type = $scope.AdjustType;
			let trnx = {ref_no:'LSDxxxx',id:'TMP_LE'};
			computeLedgerEntry(amt,type,trnx);
						
		}
		$selfScope.$watchGroup(['AMC.ActiveStudent'],function(entity){
			let STU = $scope.ActiveStudent;
			if(!STU) return;

			let SID = STU.id;
			let ESP = $scope.ActiveSY;
			loadStudentAccount(SID);
			loadLedgerEntry(SID, ESP);
			loadPayschedule(SID,ESP);
		});
		$selfScope.$watchGroup(['AMC.LERunBalance','AMC.PSRunBalance'],function(entity){
			if(entity[0]!=undefined) $scope.LERunBalanceDisp = $filter('currency')(entity[0]);
			if(entity[1]!=undefined) $scope.PSRunBalanceDisp = $filter('currency')(entity[1]);
		});
		function loadUIComps(){
			// Atomic Ready 
			atomic.ready(function(){
				var sys = atomic.SchoolYears;
				var sy = atomic.ActiveSY;
				$scope.SchoolYears = $filter('orderBy')(sys,'-id');
				$scope.ActiveSY = sy;
			});

			// Adjusting Transactions
			$scope.AMTypes = AM.UI.TYPES;
			AM.UI.TYPES.map((type)=>{
				ADJUST_TYPES[type.id] = type;
			});

			// Ledger Entries
			$scope.LEHdrs = AM.UI.LEDGER.Headers;
			$scope.LEProps = AM.UI.LEDGER.Properties;
			$scope.LEData = [
					{date:'17 Aug 2023',ref_no:'OR123', description:'Initial Payment',fee:5000,payment:0,balance:0}
					];
			// Payment Schedule
			$scope.PSHdrs = AM.UI.PAYMENT_SCHED.Headers;
			$scope.PSProps = AM.UI.PAYMENT_SCHED.Properties;
			$scope.PSData = [
				{due_date:'17 Aug 2023',due_amount:5000, paid_amount:5000,balance:0, status:'PAID'}
				];

		}

		function loadStudentAccount(student_id){
			let filter = {id:student_id};
			let success = function(response){
				var account = response.data[0];
				$scope.OutBalance = $filter('currency')(account.outstanding_balance);
				$scope.PayTotal = $filter('currency')(account.payment_total);
			};
			let error = function(response){
				console.log(response);
			};
			api.GET('accounts',filter,success,error);
		}
		function loadLedgerEntry(student_id,sy){
			let filter= {account_id:student_id,esp:sy};
			let success = function(response){
			let entries = $filter('orderBy')(response.data,'transac_date');
				entries = $filter('orderBy')(entries,'ref_no');
			$scope.LEData = [];
			let runBalance = 0;
				entries.map((entry)=>{
					let amt = entry.amount;
					if(!amt) return;

					let obj ={};
						obj.id =  entry.id;
						obj.date = $filter('date')(new Date(entry.transac_date),DATE_FORMAT);
						obj.ref_no = entry.ref_no;
						obj.description = entry.details;
						if(entry.type=='+'){
							obj.fee = $filter('currency')(amt);
							runBalance+= amt;
						}else if(entry.type=='-'){
							obj.payment = $filter('currency')(amt);
							runBalance-= amt;
						}
						obj.balance = $filter('currency')(runBalance);
					$scope.LEData.push(obj);
				});	
				$scope.LERunBalance = runBalance;

			};
			let error = function(response){
				console.log(response);
			};
			api.GET('ledgers',filter,success,error);
		}

		function loadPayschedule(student_id){
			let filter = {account_id:student_id};
			let success = function(response){
				let schedule = $filter('orderBy')(response.data,'order');
				let runBalance = 0;
				$scope.PSData = [];
				schedule.map((sched)=>{
					let due_amt = sched.due_amount;
					let paid_amt = sched.paid_amount;
					let trnx_type = sched.transaction_type_id;
					let balance = due_amt - paid_amt;
						runBalance+=balance;
					let obj = {};
						obj.due_date =trnx_type=='INIPY'?'Upon Enrollment':$filter('date')(sched.due_date,DATE_FORMAT);
						obj.due_amount =$filter('currency')(due_amt);
						obj.paid_amount =$filter('currency')(paid_amt);
						obj.balance = $filter('currency')(balance);
						if(sched.status!='NONE')
							obj.status = sched.status;
					$scope.PSData.push(obj);
				});
				$scope.PSRunBalance = runBalance;
			};
			let error = function(response){
				console.log(response);
			};
			api.GET('account_schedules',filter,success,error);
		}
		function computeLedgerEntry(amount,type,trnx){
			let atObj = ADJUST_TYPES[type];
			let initBal = $scope.LERunBalance;
			let newBal = initBal -  amount;
			let entryObj = {
				id:trnx.id,
				date: $filter('date')(new Date(),DATE_FORMAT),
				ref_no: trnx.ref_no,
				description: atObj.name,
				fee:null,
				payment:$filter('currency')(amount),
				balance:$filter('currency')(newBal)
			};
			$scope.LEData.push(entryObj);
			$scope.LEActiveItem = $scope.LEData[$scope.LEData.length-1];
			$scope.LERunBalance = newBal;
		}
	}]);
});