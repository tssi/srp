"use strict";
define(['app','api'], function (app) {
    app.register.controller('LedgerController',['$scope','$rootScope','$uibModal','api', function ($scope,$rootScope,$uibModal,api) {
		$scope.list=function(){
			$rootScope.__MODULE_NAME = 'Ledger';
			//Initialize ledger and get ledgers.js
			$scope.initLedgers=function(){
				api.GET('ledgers',function success(response){
					console.log(response.data);
					$scope.Ledgers=response.data;	
				});
			};
			$scope.initLedgers();
			//Set for Ng-show
			$scope.hasInfo = false;
			$scope.hasNoInfo = true;
			//Open ledger Information
			$scope.openLedgerInfo=function(ledger){
				$scope.Ledger = ledger;
				$scope.hasInfo = true;
				$scope.hasNoInfo = false;
			};
			//Remove Transaction Info
			$scope.removeTransactionInfo=function(){
				$scope.hasInfo = false;
				$scope.hasNoInfo = true;
				$scope.Ledger = null;
			};
			//Filter ledger
			$scope.filterLedger=function(ledger){
				var searchBox = $scope.searchLedger;
				var keyword = new RegExp(searchBox,'i');	
				var test = keyword.test(ledger.details) || keyword.test(ledger.account.account_name);
				return !searchBox || test;
			};
			//Clear search box
			$scope.clearSearch = function(){
				$scope.searchLedger = null;
			};
			//Open modal
			$scope.openModal=function(){
				var modalInstance = $uibModal.open({
					animation: true,
					templateUrl: 'myModalContent.html',
					controller: 'ModalInstanceController',
				});
				modalInstance.result.then(function (selectedItem) {
				  $scope.selected = selectedItem;
				}, function (source) {
					//Re initialize ledger when confirmed
					if(source==='confirm')
						$scope.initLedgers();
				});
			};
		};
    }]);
	app.register.controller('ModalInstanceController',['$scope','$uibModalInstance','api', function ($scope, $uibModalInstance, api){
		//Gets the data entered in modal and push it to ledgers.js
		$scope.confirmLedger = function(){
			 $scope.Ledgers={
						  account: {
									account_no:34567,
									account_name:$scope.accountName,
									account_type:"student"
									},
						  type: $scope.type,
						  date: $scope.date,
						  ref_no: $scope.refNo,
						  details: $scope.details,
						  amount: $scope.amount
						 };
			api.POST('ledgers',$scope.Ledgers,function success(response){
				$uibModalInstance.dismiss('confirm');
			});
		};
		//Close modal
		$scope.cancelLedger = function(){
			$uibModalInstance.dismiss('cancel');
		};
		//Change if it is debit or credit
		$scope.setType=function(value){
			$scope.type=value;
		};
	}]);
});


