"use strict";
define(['app','transact','api','atomic/bomb'],function(app,TRNX){
	const TRNX_LIST = TRNX.__LIST;
	const NEXT_SY = false;
	app.register.controller('CashierController',['$scope','$rootScope','$filter','api','aModal','Atomic',
	function($scope,$rootScope,$filter,api,aModal,atomic){
		const $selfScope =  $scope;
		$scope = this;

		$scope.init = function(){
			$scope.ActiveSY = $rootScope._APP.ACTIVE_SY;
			atomic.ready(function(){
				var sys = atomic.SchoolYears;
				var sy = atomic.ActiveSY;
				if(NEXT_SY){
					var asy = sy +1;
					var nsy ={};
						nsy.id =  asy;
						nsy.label = asy + '-'+ (asy+1);
						nsy.code =  (asy+''.substring(2));
					sys.push(nsy);
				}

				$scope.SchoolYears = $filter('orderBy')(sys,'-id');
				$scope.ActiveSY = sy;
				
			});
			$scope.Headers = ['Description',{class:'col-md-4',label:'Amount'}];
			$scope.Props = ['description','disp_amount'];

			$scope.PSHeaders = ['Due Date', 'Amount','Status'];
			$scope.PSProps = ['disp_date','disp_amount','status'];
			$scope.Paysched = [];
			$scope.StudFields = ['id','full_name','enroll_status','student_type','department_id','year_level_id','section'];
			$scope.TransacDetails=[];
			$scope.TotalAmount = 5000;
			$scope.SeriesNo = 'OR 12345';
			$scope.TransacDate = new Date();
		}
		
		$selfScope.$watchGroup(['CAC.ActiveStudent','CAC.ActiveSY'],function(entity){
			var stud = entity[0];
			var sy = entity[1];
			if(!stud||!sy) return;
			$selfScope.$broadcast('StudentSelected',{student:stud,sy:sy});
		});

		$selfScope.$on('UpdatePaysched',function(evt,args){
			$scope.Paysched = args.paysched;
		});
		$selfScope.$on('UpdateTransacDetails',function(evt,args){
			let details = args.details;
			let totalAmt = 0;
			$scope.TransacDetails = details;
			details.map(function(item,index){
				totalAmt+=item.amount;
			});
			$scope.TotalAmount = totalAmt;
			$scope.TotalDispAmount = TRNX.util.formatMoney(totalAmt);

		});

		$scope.openPaymentModal = function(){
			$selfScope.$broadcast('OpenPayModal',{total_amount:$scope.TotalAmount});
		}
	}]);

	app.register.controller('CashierTransactionsController',['$scope','$rootScope','$filter','api','Atomic',
	function($scope,$rootScope,$filter,api,atomic){
		const $selfScope =  $scope;
		$scope = this;
		$scope.init = function(){
			TRNX.runDefault();
			$scope.TransacList = TRNX.getList();
			TRNX.link(api);
		};
		$scope.addTrnx = function(item){
			item.isActive = !item.isActive; 
			let activeTrnx = $filter('filter')($scope.TransacList,{isActive:true});
			$selfScope.$emit('UpdateTransacDetails',{details:activeTrnx});
		}
		$selfScope.$on('StudentSelected',function(evt,args){
			var STU =  args.student;
			var sy = args.sy;
			var sid = STU.id;
			var type =  STU.enroll_status;
			var asy = atomic.ActiveSY;

			TRNX.runDefault();
			$selfScope.$emit('UpdatePaysched',{paysched:[]});
			
			if(!sid) return;
			
			var loadNextSY = NEXT_SY && sy> asy;
			function updateTrnx(response){
				var account =  response.data.data[0];
				

				$scope.TransacList = TRNX.getList();
				var sched =  TRNX.getSched();
				$selfScope.$emit('UpdatePaysched',{paysched:sched});
				
			}
			if(loadNextSY)
				return TRNX.getAssessment(sid,sy).then(updateTrnx);
			
			TRNX.getOldAccount(sid,sy).then(updateTrnx);
				
			

		});
	}]);
	

	app.register.controller('CashierModalController',['$scope','$rootScope','api','aModal',
	function($scope,$rootScope,api,aModal){
		const $selfScope =  $scope;
		$scope = this;
		$scope.init = function(){
			$scope.PayObj = {};
			$scope.DocTypes = [
					//{id:"OR", name:"Official Receipt"},
					{id:"AR", name:"Acknowledgment Receipt"},
				];
			$scope.PayTypes = [
					{id:"CASH",name:"Cash"},
					//{id:"CHCK",name:"Check"},
					//{id:"CARD",name:"Card"}
				];
		}
		$selfScope.$on('OpenPayModal',function(evt,args){
			aModal.open('CashierPaymentModal');
			$scope.PayObj.series_no = 'AR1230';
			$scope.PayObj.doc_type = 'AR';
			$scope.PayObj.pay_type = 'CASH';
			$scope.PayObj.transac_date = new Date();
			$scope.PayObj.pay_due = args.total_amount
			$scope.PayObj.pay_amount = args.total_amount;
			
		});
		$selfScope.$on('StudentSelected',function(evt,args){
			$scope.PayObj.student = args.student.name;
			$scope.PayObj.section = args.student.section;
			
		});
		$scope.closeModal = function(){
			aModal.close('CashierPaymentModal');
		}
		$scope.confirmPayment = function(){}
	
		
	}]);


});