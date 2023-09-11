"use strict";
define(['app','transact','api','atomic/bomb'],function(app,TRNX){
	const DATE_FORMAT = {display:'dd MMM yyyy',data:'yyyy-MM-dd'};
	app.register.controller('PaymentPlanController',['$scope','$rootScope','$filter','$timeout','api','Atomic',
	function($scope,$rootScope,$filter,$timeout,api,atomic){
		const $selfScope =  $scope;
		$scope = this;

		$scope.init = function(){
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
			$scope.TotalPayments = 0;
			$scope.PlanHeaders = [{label:"#",class:'col-md-1'},"Due Date", {label:"Due Amount",class:'text-right'}];
			$scope.PlanProps = ["pay_count","due_date_display", "due_amount_display"];
			$scope.PlanInputs = [{field:"pay_count", disabled:true},{field:'due_date',type:'date'},{field:'due_amount',type:'number'},{field:'paid_amount',type:'number'},{field:'status'}];
			$scope.PlanData = [];
		}

		$selfScope.$watch('PPC.ActiveStudent',function(entity){
			let STU = $scope.ActiveStudent;
			if(!STU) return;
			$scope.allowInput = true;
			if(!STU.id){
				resetPaymentPlan();
			}
		});
		$selfScope.$watchGroup(['PPC.ActiveStudent','PPC.TotalDue','PPC.Guarantor','PPC.PaymentTerms','PPC.PaymentStart'],function(entity){
			if(!$scope.ActiveStudent) return;
			$scope.allowCompute =  $scope.TotalDue && $scope.PaymentTerms && $scope.PaymentStart && $scope.Guarantor;
			// Compute default monthly due
			if(entity[1] && entity[3]){
				var totalDue = $scope.TotalDue;
				var totalPay = $scope.TotalPayments;
				var payTerms = $scope.PaymentTerms;
				var monthlyDue = Math.ceil((totalDue - totalPay) / payTerms);
				$scope.MonthlyDue = monthlyDue;
			}
		});
		$selfScope.$watch('PPC.PlanData',function(){
			$scope.allowApply = $scope.PlanData.length;
		});
		$scope.computePlan = function(){
			var totalDue = $scope.TotalDue;
			var totalPay = $scope.TotalPayments;
			var payTerms = $scope.PaymentTerms;
			var monthlyDue = $scope.MonthlyDue;
			var payStart = $scope.PaymentStart;
			var paysched = generatePaymentSchedule(totalDue,payTerms,totalPay,monthlyDue,payStart);
			$scope.PlanData = paysched;
			$scope.allowCompute = false;
			$scope.allowInput = false;

		}
		$scope.revertExtension = function(){
			$scope.allowCompute=true;
			$scope.allowInput=true;
			$scope.PlanData = [];
		}
		$scope.applyExtension = function(){
			let data = {
				account_id: $scope.ActiveStudent.id,
				payment_start:$filter('date')(new Date($scope.PaymentStart),DATE_FORMAT.data),
				total_due: $scope.TotalDue,
				terms:$scope.PaymentTerms,
				monthly_payments:$scope.MonthlyDue,
				guarantor:$scope.Guarantor,
				schedule:$scope.PlanData
			}
			var success = function(response){
				var data = response.data;
				printPaymentPlan(data);
			};
			var error = function(response){

			};
			api.POST('payment_plans',data,success,error);

		}

		function resetPaymentPlan(){
			$scope.TotalDue = undefined;
			$scope.PaymentStart = undefined;
			$scope.PaymentTerms= undefined;
			$scope.Guarantor= undefined;
			$scope.MonthlyDue= undefined;
			$scope.PlanData = [];
			$scope.PrintDetails = {};
		}
		function printPaymentPlan(details){
			$scope.PrintPaymentDetails = details;
			$timeout(function(){
				document.getElementById('PrintPaymentPlan').submit();			
			},200);
		}


		// Function to generate payment schedule array
		function generatePaymentSchedule(totalDue, payTerms, totalPay,monthlyDue,payStart) {
		  const paymentSchedule = [];
		  const startDate = new Date(payStart);
		  for (let i = 1; i <= payTerms; i++) {
		  	let dueDate = new Date(startDate);
    				dueDate.setMonth(startDate.getMonth() + (i-1));
    		let dueDateDisp = $filter('date')(new Date(dueDate),DATE_FORMAT.display);
    		let dueDateData = $filter('date')(new Date(dueDate),DATE_FORMAT.data);
    		let monthlyDueDisp =  $filter('currency')(monthlyDue);
		    const paymentEntry = {
		      pay_count: i,
		      due_date: dueDateData,
		      due_date_display: dueDateDisp,
		      due_amount: monthlyDue,
		      due_amount_display: monthlyDueDisp,
		      paid_amount: 0,
		      status: 'UNPAID'
		    };

		    paymentSchedule.push(paymentEntry);
		  }

		  // Adjust the last month's due amount
		  const lastMonthIndex = paymentSchedule.length - 1;
		  const adjustedLastMonthDue = totalDue - (monthlyDue * (payTerms - 1));
		  paymentSchedule[lastMonthIndex].due_amount = adjustedLastMonthDue;
		  paymentSchedule[lastMonthIndex].due_amount_display = $filter('currency')(adjustedLastMonthDue);

		  return paymentSchedule;
		}



	}]);
});