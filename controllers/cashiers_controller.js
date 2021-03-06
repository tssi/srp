"use strict";
define(['app', 'api'], function(app) {
    app.register.controller('CashierController', ['$log', '$scope', '$rootScope', '$uibModal', 'api', function($log, $scope, $rootScope, $uibModal, api) {
        $scope.index = function() {
            $rootScope.__MODULE_NAME = 'Cashiers';

            $rootScope.$watch('_APP',function(app){
                if(app)
                    $scope.initCashier();
            });
            //Steps in Nav-pills
            $scope.Steps = [
                { id: 1, title: "Payor", description: "Select Payor" },
                { id: 2, title: "Transaction", description: "Select Transactions" },
                { id: 3, title: "Payment", description: "Select Payment Methods" },
                { id: 4, title: "Confirmation", description: "Confirmation" }
            ];
			
            //Initialize components
            $scope.initCashier = function() {
				$scope.SearchWord = '';
				$scope.CheckPayment = false;
				$scope.Consumed = 0;
				$scope.ActiveUser = $rootScope.__USER.user;
				console.log($scope.ActiveUser);
				$scope.Today = new Date();
                $scope.ActiveSY  = $rootScope._APP.ACTIVE_SY;
                $scope.ActiveSYShort = parseInt($scope.ActiveSY.toString().substr(2,2));
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

				$scope.RectTypes = ['OR','AR','A2O'];
				$scope.StudTypes = ['Old','New'];
				$scope.ActiveTyp = 'OR';
				$scope.ActiveStudTyp = 'Old';

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
				if($scope.ActiveUser.user_type=='cashr')
					getCashierId();
				else
					getAll();
				
            };
            
			function getCashierId(){
				var data = {user_id:$scope.ActiveUser.id}
				api.GET('cashiers',data, function success(response){
					$scope.cashier_id = response.data[0].id;
					getAll();
				});
			}
			$scope.SearchStudent = function(){
				$scope.Search = 1;
				$scope.Students = '';
				var filter = {
					keyword:$scope.SearchWord,
					fields:['first_name','middle_name','last_name','id'],
					limit:'less'
				}
				requestStudents(filter);
			}
			
			$scope.ClearSearch = function(){
				$scope.Search = 0;
				$scope.SearchWord = '';
				$scope.Students = '';
				requestStudents();
			}
			
			$scope.PrintSoa = function(){
				var acct_id = $scope.ActiveStudent.id;
				document.getElementById('PrintSoa').value;
				var newURL = 'api/soa?account_id='+acct_id;
				window.open(newURL);
			}
			
			$scope.setActiveTyp = function(typ){
				$scope.TransactionTypes = '';
				$scope.ActiveBooklet = '';
				getBooklet();
				if(typ!=='OR')
					getAr();
				else
					getOr();
				$scope.ActiveTyp = typ;
			}
			$scope.setActiveStudType = function(type){
				$scope.ActiveStudTyp = type;
				requestStudents();
			}
            //Get BookletID
			function getAll(){
				var filter = {status:'ACTIV'}
				api.GET('booklets',filter, function success(response) {
					$scope.ActiveBooklet = response.data[0];
					getAssigendBooks();
					//$scope.openDanger();
				}, function error(response){
					$scope.ActiveBooklet = {};
					$scope.openDanger();
				}); 

				//Get students.js
				requestStudents();
				
				//Get transaction_types.js
				//Get payment_methods.js
				api.GET('payment_methods', function success(response) {
					$scope.Payments = response.data;
				});
			}
			
			function requestStudents(filter){
				$scope.IsLoading = true;
				filter =filter||{};
				filter.account_type = $scope.ActiveStudTyp=='Old'?'student':'inquiry'; 
				console.log(filter);
				api.GET('accounts', filter,function success(response) {
					$scope.IsLoading = false;
					$scope.Students = response.data;
				}, function error(response){
					
				});
			}
			function getAssigendBooks(){
				var data = {
					status:'ASSGN',
					limit:'less'
				};
				if($scope.cashier_id)
					data.cashier_id = $scope.cashier_id;
				api.GET('booklets',data, function success(response){
					angular.forEach(response.data, function(book){
						book.label = book.series_start+' - '+book.series_end;
					});
					$scope.Booklets = response.data;
				},function error(response){
					$scope.Booklets = [$scope.ActiveBooklet];
				});
			}
			
			function getBooklet(typ){
				var data = {receipt_type:typ,status:'ACTIV'};
				api.GET('booklets',data, function success(response){
					$scope.ActiveBooklet = response.data[0];
				});
			}
			
			function getAr(){
				var data = {
					type:'AR'
				};
				api.GET('transaction_types',data, function success(response){
					var RFIndex=0;
					angular.forEach(response.data,function(res,ind){
						if(res.is_quantity)
							res.qty = 1;
						if(res.id=='RSRVE')
							RFIndex = ind;
					})
					var TrnxTypes = response.data;
					//Bubble to top RF for New students
					if($scope.ActiveStudTyp=='New'){
						var RFTrnx =  TrnxTypes[RFIndex];
						TrnxTypes.splice(RFIndex,1);
						TrnxTypes.unshift(RFTrnx);
					}
					$scope.TransactionTypes = TrnxTypes;
				});
			}
			function getOr(){
				var data = {
					account_no:$scope.ActiveStudent.id,
					pay:true,
				};
				api.GET('transaction_types',data, function success(response){
					$scope.TransactionTypes = response.data;
				});
			}
			
            //Change the step for navigation
            $scope.nextStep = function() {
                if ($scope.ActiveStep === 1) {
                    //Pass value of student information
					$scope.Disabled = 1;
                    $scope.ActiveStudent = $scope.SelectedStudent;
					if($scope.isPayeeConfirmed){
						if(!$scope.ActiveStudent.id)
							$scope.ActiveStudent = {'name':$scope.OtherPayeeName,'account_type':'others'};
						else
							$scope.ActiveStudent.name = $scope.ActiveStudent.account_details;
						$scope.OtherPayeeName = '';
					}
					
					if($scope.ActiveTyp=='OR')
						getOr();
					else
						getAr();
					
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
							name: transactionType.name,
							type: transactionType.type,
							is_quantity: transactionType.is_quantity,
							is_specify: transactionType.is_specify,
							qty: transactionType.qty
							
                        };
                        if ($scope.SelectedTransactions[transactionType.id]) {
							if(transactionType.is_quantity&&transactionType.is_specify){
								transaction.details = transactionType.desc+'_'+transactionType.qty+'x'+transaction.amount;	
								transaction.desc = transactionType.desc;
							}
							if(transactionType.is_quantity&&!transactionType.is_specify){
								transaction.details = transactionType.qty+'x'+transaction.amount;
							}
							if($scope.ActiveTyp!=='OR'){
								var amountDue =  transaction.amount;
								if(transactionType.qty)
									amountDue =  transaction.amount * transactionType.qty
								$scope.TotalDue = $scope.TotalDue + amountDue;
							}
							else{
								$scope.TotalDue = $scope.TotalDue + transaction.amount;
							}
                            $scope.ActiveTransactions.push(transaction);
                        };
                    };
					console.log($scope.ActiveTransactions);
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
						if(payment.id!='CASH'){
							payment.date = $scope.PopoverDetails.date;
							if($scope.PopoverDetails.bank)
								payment.bank = $scope.PopoverDetails.bank+' - '+$scope.PopoverDetails.ref_no;
							else
								payment.bank = $scope.PopoverDetails.ref_no;
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
							$scope.CheckPayment = true;
						}
					}
					console.log($scope.ActiveTransactions);
                };
                if ($scope.ActiveStep === 4) {
                    //Push the gathered info to payments.js
					if($scope.TotalPaid>$scope.TotalDue){
						angular.forEach($scope.ActivePayments,function(pay){
							if(pay.id=='CASH')
								pay.amount = pay.amount-$scope.TotalChange;
						});
					}
					
					
                    var cashierObj = {
                        esp:$scope.ActiveSY,
                        total_due:$scope.TotalDue,
                    }
                    $scope.Payment = {
						student: $scope.ActiveStudent,
						booklet: $scope.ActiveBooklet,
                        payments: $scope.ActivePayments,
						transactions:$scope.ActiveTransactions,
                        cashier:cashierObj,
                    };
					console.log($scope.Payment);
					if($scope.ActiveTyp=='A2O')
						$scope.Payment.type = {type:'A2O',};
                    $scope.TransactionId = null;
                    $scope.CashierSaving = true;
					//console.log($scope.Payment); return;
                    api.POST('payments', $scope.Payment, function success(response) {
                        $scope.TransactionId  = response.data.transaction_id;
						if(response.data.booklet)
							$scope.Consumed = true;
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
				if($scope.ActiveStep==2)
					$scope.ActiveTransactions = [];
				if($scope.ActiveStep==3){
					$scope.ActivePayments = [];
					$scope.TotalPaid = 0;
				}
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
				$scope.SelectedPayee='';
				$scope.Disabled = 0;
				if(!$scope.ActiveBooklet)
					$scope.Disabled = 1;
                $scope.SelectedStudent = student;
                $scope.ActiveTyp = $scope.ActiveStudTyp=='Old'?'OR':'A2O';
            };

            $scope.setSelecetedPayee = function(payee){
				$scope.SearchWord = '';
				$scope.SelectedStudent = '';
				$scope.Students = [];
				getOthers();
            	$scope.SelectedPayee=payee;
            	$scope.isPayeeConfirmed =false;
            	$scope.Disabled = 1;
            	$scope.OtherPayeeName = null;
            }
			
			function getOthers(){
				
				$scope.NoOthers = false;
				var data = {account_type:'others'};
				api.GET('accounts',data, function success(response){
					angular.forEach(response.data, function(acct){
						acct.name = acct.account_details;
						acct.sno = 'No sno'
						acct.year_level = 'No level'
					});
					$scope.Others = response.data;
					console.log($scope.Students);
				},function error(response){
					$scope.NoOthers = true;
				});
			}
			
            $scope.confirmPayee = function(acct){
				if(acct){
					$scope.SelectedStudent = acct;
					$scope.SelectedPayee = '';
				}
            	$scope.isPayeeConfirmed = true;
            	$scope.Disabled = 0;
            	$scope.ActiveTyp = 'A2O';
            }
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
            $scope.displaySettings = function(hideConf) {
				if($scope.ActiveBooklet)
					$scope.ActiveBooklet['label'] = $scope.ActiveBooklet.series_start+' - '+$scope.ActiveBooklet.series_end;
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'bookletModal.html',
                    controller: 'BookletModalController',
					resolve:{
						rectTypes:function(){
							return $scope.RectTypes;
						},
						actType:function(){
							return $scope.ActiveTyp;
						},
						book:function(){
							return $scope.ActiveBooklet;
						},
						booklets:function(){
							return $scope.Booklets;
						},
						activeSY:function(){
							return $scope.ActiveSY;
						},
						hideConf:function(){
							return hideConf;
						}
					}
                });
                modalInstance.opened.then(function() { $rootScope.__MODAL_OPEN = true; });
				var promise = modalInstance.result;
				var callback = function(book){
					if($scope.Consumed){
						$scope.initCashier();
					}else{
						$scope.ActiveTyp = book.type;
						console.log(book);
						if($scope.ActiveTyp=='OR')
							getOr();
						else
							getAr();
					}
					$scope.ActiveBooklet = book;
				};
				var fallback = function(){
					
				};
				promise.then(callback,fallback);
            };
            $scope.openModal = function() {
                var modalInstance = $uibModal.open({
                    animation: true,
                    size: 'sm',
                    templateUrl: 'successModal.html',
                    controller: 'SuccessModalController',
                    resolve:{
                        TransactionId:function(){
                            return $scope.TransactionId
                        },
						rectTyp:function(){
							return $scope.ActiveTyp
						}
                    }
                });
                modalInstance.result.then(function() {
					
                }, function(source) {
                    if($scope.Consumed){
						$scope.openDanger();
						$scope.ActiveBooklet = {};
					}else
						$scope.initCashier();
                });
			}
			$scope.openDanger = function() {
                var modalInstance = $uibModal.open({
                    animation: true,
                    size: 'sm',
                    templateUrl: 'dangerModal.html',
                    controller: 'DangerModal',
                    resolve:{
                        TransactionId:function(){
                            return $scope.TransactionId
                        }
                    }
                });
                modalInstance.result.then(function() {
					//$scope.displaySettings('hideConf');
                }, function(source) {
					$scope.displaySettings('hideConf');
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
				computeChange();
				console.log($scope.CurrentChange);
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
				if($scope.SelectedPayments['CHCK']||$scope.SelectedPayments['CHRG']){
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
			
			$scope.CountQty = function(qty,id){
				return;
				angular.forEach($scope.TransactionTypes, function(trnx){
					if(trnx.id==id)
						trnx.amount = qty*trnx.amount;
				});
				//$scope.TransactionTypes[id].amount = qty * $scope.TransactionTypes[id].amount;
			}
			
			function computeChange(){
				
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
			}
        };
    }]);
    app.register.controller('BookletModalController', ['$scope', '$rootScope', '$uibModalInstance', 'api','rectTypes','actType','book','booklets','activeSY','hideConf',
	function($scope, $rootScope, $uibModalInstance, api,rectTypes,actType,book,booklets,activeSY,hideConf) {
        //Get the data entered and push it to booklets.js
		$scope.Saving = 0;
		$scope.Disabled = 1;
		$scope.ActiveSY = activeSY;
		$scope.ActiveUser = $rootScope.__USER.user;
		$scope.InitialCtr = book.series_counter;
		$scope.RectTypes = rectTypes;
		$scope.ActiveTyp = actType;
		$scope.Booklets = booklets;
		if(book){
			$scope.ActiveBook = book;
			$scope.Booklets.push(book);
		}
		$scope.Actions = [
			{id:'byps','desc':'Bypass this time only','class':'glyphicon-random'},
			{id:'skip','desc':'Skip and update counter','class':'glyphicon-fast-forward'},
			
		];
		if(hideConf){
			$scope.HiddenAction = true;
			$scope.ActiveBook = {};
		}else{
			$scope.HiddenAction = false;
			if($scope.Booklets.length<=1)
				$scope.Booklets.push(book);
		}
		if(!$scope.Booklets.length)
			getBooklet();
		
		//$scope.ActiveMark = {id:'byps','desc':'Bypass this time only','class':'glyphicon-random'};
		
		
		$scope.setActiveType = function(typ){
			
			$scope.ActiveBook = '';
			$scope.ActiveTyp = typ;
			getBooklet();
		}
		
        $scope.confirmBooklet = function(book) {
			$scope.Saving = true;
			if($scope.ActiveTyp!=='AR')
				checkOr(book);
        };
		
		$scope.MarkReceipt = function(act){
			$scope.Disabled = 0;
			$scope.ActiveMark = act;
		}
		
        //Close modal
		
        $scope.cancelBooklet = function() {
            $rootScope.__MODAL_OPEN = false;
            $uibModalInstance.dismiss('cancel');
        };
		
		$scope.registerCounter = function(book){
			$scope.Disabled = 0;
			$scope.ActiveBook = book;
			$scope.InitialCtr = book.series_counter;
		}
		
		
		function getBooklet(){
			var data = {
				receipt_type:$scope.ActiveTyp,
				status:'ASSGN',
				limit:'less'
			}
			api.GET('booklets', data, function success(response){
				angular.forEach(response.data, function(book){
					book.label = book.series_start+' - '+book.series_end;
				});
				$scope.Booklets = response.data;
				$scope.ActiveBook = response.data[0];
				$scope.InitialCtr = $scope.ActiveBook.series_counter;
			});
		}
		
		
		
		function checkOr(book){
			var data = {
				ref_no: 'OR '+book.series_counter
			}
			api.GET('transactions',data, function success(response){
				$scope.Saving = false;
				alert('Receipt number already used.');
				return;
			}, function error(response){
				var yes = confirm('Save series counter?');
				if(yes){
					//var data = {series_counter:book.series_counter};
					if($scope.ActiveMark){
						if($scope.ActiveMark.id=='byps'){
							book.InitialCtr = $scope.InitialCtr;
							book.mark = 'bypass';
						}else
							book.mark = 'skip';
					}
					if(hideConf){
						$scope.ActiveBook.status = 'ACTIV';
						var data = {Booklet: $scope.ActiveBook,url_from:'config'}
						api.POST('booklets',data,function success(response){
							alert('booklet saved!');
						});
					}
					$scope.ActiveBook.type = $scope.ActiveTyp
					$uibModalInstance.close($scope.ActiveBook,);
					$rootScope.__MODAL_OPEN = false;
				
				}else{
					
					return false;
				}
			});
		}
		
    }]);
    app.register.controller('SuccessModalController', ['$scope', '$rootScope', '$timeout', '$uibModalInstance', 'api', 'TransactionId','rectTyp',
	function($scope, $rootScope, $timeout, $uibModalInstance, api,TransactionId,rectTyp) {
        $rootScope.__MODAL_OPEN = true;
        $timeout(function() {
            $scope.ShowButton = true;
        }, 333);
        $scope.TransactionId = TransactionId;
        //Dismiss modal
        $scope.dismissModal = function() {
            $rootScope.__MODAL_OPEN = false;
            document.getElementById('PrintReceipt').submit();
            $uibModalInstance.dismiss('ok');

        };
    }]);
	app.register.controller('DangerModal',['$scope','$rootScope','$timeout','$uibModalInstance','api',function($scope,$rootScope,$timeout,$uibModalInstance,api){
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