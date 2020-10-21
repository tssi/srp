"use strict";
define(['app', 'api'], function(app) {
    app.register.controller('CashierController', ['$log', '$scope', '$rootScope', '$uibModal', 'api', function($log, $scope, $rootScope, $uibModal, api) {
        $scope.index = function() {
            $rootScope.__MODULE_NAME = 'Cashiers';
            //Steps in Nav-pills
            $scope.Steps = [
                { id: 1, title: "Student", description: "Select Student" },
                { id: 2, title: "Transaction", description: "Select Transactions" },
                { id: 3, title: "Payment", description: "Select Payment Methods" },
                { id: 4, title: "Confirmation", description: "Confirmation" }
            ];
            //Initialize components
            $scope.initCashier = function() {
				$scope.Today = new Date();
				$scope.Disabled = 1;
                $scope.ActiveStep = 1;
                $scope.ActiveStudent = {};
				$scope.SelectedStudent = {};
                $scope.ActiveTransactions = [];
                $scope.SelectedTransactions = {};
                $scope.ActivePayments = [];
                $scope.SelectedPayments = {};
                $scope.SelectedPaymentDetails = {};
                $scope.PopoverDetails = {};
                $scope.TotalDue = 0;
                $scope.TotalPaid = 0;
                $scope.TotalChange = 0;
                $scope.CurrentChange = 0;
                $scope.hasInfo = false;
                $scope.hasStudentInfo = false;
                $scope.hasTransactionInfo = false;
                $scope.hasPaymentInfo = false;
                $scope.CashierSaving = false;
                $scope.FocusPayment = {};
                $scope.FocusTransaction = {};
				$scope.PopoverDetails.is_open = false;
                $scope.$watch('hasStudentInfo', updateHasInfo);
                $scope.$watch('hasTransactionInfo', updateHasInfo);
                $scope.$watch('hasPaymentInfo', updateHasInfo);
                $scope.$watch('ActiveStudent', function() {
                    $scope.hasStudentInfo = $scope.ActiveStudent.id;
                });
                $scope.$watch('ActiveTransactions', function() {
                    $scope.hasTransactionInfo = $scope.ActiveTransactions.length;
                });
                $scope.$watch('ActivePayments', function() {
                    $scope.hasPaymentInfo = $scope.ActivePayments.length;
                });

                function updateHasInfo() {
                    $scope.hasInfo = $scope.hasStudentInfo || $scope.hasTransactionInfo || $scope.hasPaymentInfo;
                };
				getAll();
            };
            $scope.initCashier();
			
			$scope.SearchStudent = function(){
				$scope.Search = 1;
				$scope.Students = '';
				var data = {
					keyword:$scope.SearchWord,
					fields:['first_name','middle_name','last_name','id'],
					limit:'less'
				}
				var success = function(response){
					$scope.Students = response.data;
				}
				var error = function(response){
					
				}
				api.GET('accounts',data,success,error);
			}
			
			$scope.ClearSearch = function(){
				$scope.Search = 0;
				$scope.SearchWord = '';
				$scope.Students = '';
				api.GET('accounts', function success(response) {
					$scope.Students = response.data;
				});
			}
			
			$scope.PrintSoa = function(){
				var acct_id = $scope.ActiveStudent.id;
				document.getElementById('PrintSoa').value;
				var newURL = 'api/soa?account_id='+acct_id;
				window.open(newURL);
			}
            //Get BookletID
			function getAll(){
				api.GET('booklets', function success(response) {
					$scope.ActiveBooklet = response.data[0];
				}); 

				//Get students.js
				var data = {account_type:'student'}
				api.GET('accounts', function success(response) {
					$scope.Students = response.data;
				});
				//Get transaction_types.js
				api.GET('transaction_types', function success(response) {
					$scope.TransactionTypes = response.data;
				});
				//Get payment_methods.js
				api.GET('payment_methods', function success(response) {
					$scope.Payments = response.data;
				});
			}
            //Change the step for navigation
            $scope.nextStep = function() {
                if ($scope.ActiveStep === 1) {
                    //Pass value of student information
					$scope.Disabled = 1;
                    $scope.ActiveStudent = $scope.SelectedStudent;
                    var data = {};
                    data.pay = true;
                    data.account_no = $scope.ActiveStudent.id;
					console.log(data);
                    api.GET('transaction_types', data, function success(response) {
                        $scope.TransactionTypes = response.data;
                    });
					
                }
                if ($scope.ActiveStep === 2) {
					if($scope.TotalPaid>$scope.TotalDue)
						$scope.Disabled = 0;
					else
						$scope.Disabled = 1;
                    //Pass value of transaction information
                    $scope.TotalDue = 0;
                    for (var index in $scope.TransactionTypes) {
                        var transactionType = $scope.TransactionTypes[index];
                        var transaction = {
                            id: transactionType.id,
                            amount: transactionType.amount,
							name: transactionType.name
                        };
                        if ($scope.SelectedTransactions[transactionType.id]) {
                            $scope.TotalDue = $scope.TotalDue + transaction.amount;
                            $scope.ActiveTransactions.push(transaction);
                        };
                    };
					console.log($scope.TotalDue);
                }
                if ($scope.ActiveStep === 3) {
					
                    //Pass value of payment information
					if('CHCK' in $scope.SelectedPayments){
						if($scope.SelectedPayments['CHCK']){
							var yes = confirm("Check payment option chosen. Change will be credited to your account. Proceed payment?");
							if(yes)
								$scope.TotalChange = 0;
							else
								return false;
						}
					}
                    for (var index in $scope.Payments) {
                        var paymentMethod = $scope.Payments[index];
						var pid = paymentMethod.id;
						var amount = paymentMethod.amount;
                        var payment = {
                            id: pid,
                            amount: amount,
                        };
						if(payment.id=='CHCK'){
							payment.date = $scope.PopoverDetails.date;
							payment.bank = $scope.PopoverDetails.bank+' - '+$scope.PopoverDetails.ref_no;
						}
                        if ($scope.SelectedPayments[paymentMethod.id]) {
                            $scope.TotalPaid = $scope.TotalPaid + payment.amount;
                            $scope.ActivePayments.push(payment);
                        };
                    };
					
					
                    $scope.TotalChange = $scope.TotalPaid - $scope.TotalDue;
					if('CHCK' in $scope.SelectedPayments){
						if($scope.SelectedPayments['CHCK']){
							$scope.TotalChange = 0;
						}
					}
					
                };
                if ($scope.ActiveStep === 4) {
                    //Push the gathered info to payments.js
					if($scope.TotalPaid>$scope.TotalDue){
						angular.forEach($scope.ActivePayments,function(pay){
							if(pay.id=='CASH')
								pay.amount = pay.amount-$scope.TotalChange;
						});
					}
                    $scope.Payment = {
						student: $scope.ActiveStudent,
						booklet: $scope.ActiveBooklet,
                        payments: $scope.ActivePayments,
						transactions:$scope.ActiveTransactions,
                    };
                    $scope.CashierSaving = true;
                    api.POST('payments', $scope.Payment, function success(response) {
                        $scope.openModal();
                    });

                };
                if ($scope.ActiveStep < $scope.Steps.length) {
                    $scope.ActiveStep++;
                }

            };
            //Previous step for navigation
            $scope.prevStep = function() {
                if ($scope.ActiveStep > 1) {
                    $scope.ActiveStep--;
                };
            };
            //Make the navigation clickable
            $scope.updateStep = function(step) {
                $scope.ActiveStep = step.id;
            };
            //Take the value if it is true or false
            $scope.toggleSelectTransaction = function(id,index) {
				$scope.SelectedTransactions[id] = !$scope.SelectedTransactions[id];
				if(!$scope.SelectedTransactions[id])
					$scope.Disabled = 1;
				console.log($scope.TransactionTypes);
				angular.forEach($scope.SelectedTransactions, function(trans){
					if(trans==true)
						$scope.Disabled = 0;
				})
				if ($scope.SelectedTransactions[id]) {
					$scope.FocusTransaction[id] = true;
				}
			}
                //Set the selected student 
            $scope.setSelecetedStudent = function(student) {
				$scope.Disabled = 0;
                $scope.SelectedStudent = student;
            };
            //Take the value if it is true or false
            $scope.toggleSelectPayment = function(id) {
				$scope.SelectedPayments[id] = !$scope.SelectedPayments[id];
				if(!$scope.SelectedPayments[id]){
					angular.forEach($scope.Payments, function(pay){
						if(pay.id==id)
							pay.amount = 0;
					});
					$scope.CurrentChange = 0;
					$scope.Disabled = 1;
				}
				if ($scope.SelectedPayments[id]) {
					$scope.SelectedPaymentDetails[id] = {};
					$scope.FocusPayment[id] = true;
				}
				if('CHCK' in $scope.SelectedPayments){
					if($scope.SelectedPayments['CHCK']){
						$scope.Disabled=1;
					}
				}
			}
            
            
            //Filter transaction if selected
            $scope.filterIncludedTransactions = function(transaction) {
                return $scope.SelectedTransactions[transaction.id] && $scope.ActiveTransactions.length;
            };
            //Filter payments if selected
            $scope.filterIncludedPayments = function(payment) {
                return $scope.SelectedPayments[payment.id] && $scope.ActivePayments.length;
            };
            
            //Filter transaction
            $scope.filterTransaction = function(transaction) {
                var searchBox = $scope.searchTransaction;
                var keyword = new RegExp(searchBox, 'i');
                var test = keyword.test(transaction.name);
                return !searchBox || test;
            };
            //Clear search student
            
            //Clear search transaction
            $scope.clearSearchTransaction = function() {
                $scope.searchTransaction = null;
            };
            $scope.isEmpty = function(obj) {
                    for (var key in obj) {
                        if (obj.hasOwnProperty(key))
                            return false;
                    }
                    return true;
                }
                //Opening the modal
            $scope.displaySettings = function() {
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'bookletModal.html',
                    controller: 'BookletModalController',
                });
                modalInstance.opened.then(function() { $rootScope.__MODAL_OPEN = true; });

            };
            $scope.openModal = function() {
                var modalInstance = $uibModal.open({
                    animation: true,
                    size: 'sm',
                    templateUrl: 'successModal.html',
                    controller: 'SuccessModalController',
                });
                modalInstance.result.then(function() {

                }, function(source) {
                    $scope.initCashier();
                });
            }
            $scope.setActivePopover = function(payment) {
                $scope.ActivePaymentMethod = angular.copy(payment);
				console.log($scope.PopoverDetails);
				$scope.Popdone = 0;
            }
			$scope.closePop = function(e){
				angular.element(e.target).parent().parent().parent().parent().scope().$parent.isOpen = false;
			}
            $scope.$watch('ActivePaymentMethod', function(avp) {
                $scope.shouldOpen = {};
                if (typeof avp == "object")
                    if (avp.id) $scope.shouldOpen[avp.id] = true;
            });
            $scope.shouldOpen = function(payment_id) {
                return $scope.PopoverDetails.is_open && $scope.ActivePaymentMethod.id == payment_id;
            }
            $scope.savePopoverDetails = function(payment_id) {
                $scope.SelectedPaymentDetails[payment_id] = angular.copy($scope.PopoverDetails);
                $scope.PopoverDetails.is_open = false;
                $scope.ActivePaymentMethod = {};
				$scope.Popdone = 1;
				if($scope.CurrentChange>=0)
					$scope.Disabled = 0;
            }
            $scope.updateCurrentChange = function() {
                var cash = 0;
                var noncash = 0;
                for (var index in $scope.Payments) {
                    var payment = $scope.Payments[index];
					console.log(payment);
                    if (payment.id == 'CASH'){
						if(payment.amount)
							cash += payment.amount; 
					}
                    if (payment.id != 'CASH') { 
						if(payment.amount)
							noncash += payment.amount; 
					}
                }
                $scope.CurrentChange = (cash + noncash) - $scope.TotalDue;
				if($scope.SelectedPayments['CHCK']){
					if((cash+noncash)>=$scope.TotalDue&&$scope.Popdone)
						$scope.Disabled=0;
				}
				else{
					if((cash+noncash)>=$scope.TotalDue)
						$scope.Disabled = 0;
					else
						$scope.Disabled = 1;
				}
            }
        };
    }]);
    app.register.controller('BookletModalController', ['$scope', '$rootScope', '$uibModalInstance', 'api', function($scope, $rootScope, $uibModalInstance, api) {
        //Get the data entered and push it to booklets.js
        $scope.confirmBooklet = function() {
            $rootScope.__MODAL_OPEN = false;
            $uibModalInstance.dismiss('confirm');
        };
        //Close modal
        $scope.cancelBooklet = function() {
            $rootScope.__MODAL_OPEN = false;
            $uibModalInstance.dismiss('cancel');
        };
    }]);
    app.register.controller('SuccessModalController', ['$scope', '$rootScope', '$timeout', '$uibModalInstance', 'api', function($scope, $rootScope, $timeout, $uibModalInstance, api) {
        $rootScope.__MODAL_OPEN = true;
        $timeout(function() {
            $scope.ShowButton = true;
        }, 333);
        //Dismiss modal
        $scope.dismissModal = function() {
            $rootScope.__MODAL_OPEN = false;
            $uibModalInstance.dismiss('ok');
        };
    }]);
});