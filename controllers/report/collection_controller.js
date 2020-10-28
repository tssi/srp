"use strict";
define(['app','api','atomic/bomb'],function(app){
	app.register.controller('CollectionController',['$scope','$rootScope','api','$filter',
	function($scope,$rootScope,api,$filter){
		const $selfScope =  $scope;
		$scope = this;
		$scope.init = function(){
			$rootScope.__MODULE_NAME = 'Collection Reports';
			$scope.Options = [{'id':'daily','desc':'Daily'},{'id':'month','desc':'Monthly'}]
			$scope.ActiveOpt = {'id':'daily','desc':'Daily'};
			$scope.Props = ['month','details','collection','balance'];
			//$scope.DProps = ['student','guardians_string','address'];
			$scope.Headers = ['Month','Details','Collection',{label:'Balance',class:'amount total peso'}];
			$scope.DHeaders = ['Date','Month','Details','Collection','Balance'];
			$scope.Months = [
				{id:9,'month':'Sep',},
				{id:10,'month':'Oct'},
				{id:11,'month':'Nov'},
				{id:12,'month':'Dec'},
				{id:1,'month':'Jan'},
				{id:2,'month':'Feb'},
				{id:3,'month':'Mar'},
				{id:4,'month':'Apr'},
				{id:5,'month':'May'},
				{id:6,'month':'Jun'},
				{id:7,'month':'Jul'},
				{id:8,'month':'Aug'},
			];
			$scope.ActiveMonth = {id:9,'month':'Sep'};
			$scope.index = 0;
		}
		$selfScope.$watch("CC.Active",function(active){
			if(!active) return false;
			console.log(active);
			$scope.ActiveSY =  active.sy;
			if($scope.date_to)
				getCollections();
		});
		$scope.setActOption = function(opt){
			$scope.date_from='';
			$scope.date_to='';
			$scope.Collections ='';
			$scope.ActiveOpt = opt;
			if(opt.id=='month')
				getLedgerMonths();
		}
		$scope.SetActiveMonth = function(mo){
			$scope.ActiveMonth = mo;
		}
		
		
		$scope.LoadReport = function(){
			$scope.Loading = 1;
			getCollections();
		}
		
		$scope.ChangeDate = function(){
			$scope.Loaded = 0;
		}
		
		$scope.Clear = function(){
			$scope.date_from='';
			$scope.date_to='';
			$scope.Collections = '';
			$scope.Chart = {labels:['No Data'],data:[100]};
		}
		
		$scope.setFrom = function(index){
			var indexno =  $scope.MonthsFilter.indexOf(index);
			$scope.FilteredMonths = [];
			if(indexno==$scope.MonthsFilter.length-1)
				$scope.FilteredMonths.push($scope.MonthsFilter[indexno]);
			else{
				for(var i=indexno;i<$scope.MonthsFilter.length;i++){
					if(i<$scope.MonthsFilter.length)
						$scope.FilteredMonths.push($scope.MonthsFilter[i]);
				}
			}
		}
		
		$scope.NavPage = function(where){
			if(where=='next')
				$scope.ActivePage++;
			else
				$scope.ActivePage--;
		}
		
		function formatDate(date){
			var d = new Date(date)
		}
		
		function getLedgerMonths(){
			var trnx = ['INIPY','SBQPY'];
			var data = {
				esp:2020,
				type:'-',
				transaction_type_id:trnx,
				limit:'less'
			}
			api.GET('Ledgers',data,function success(response){
				var Months = [];
				angular.forEach(response.data, function(led){
					var date = new Date(led.transac_date);
					var month = date.getMonth();
					month = month+1;
					var year = date.getFullYear();
					var selection = month+' '+year;
					if(Months.indexOf(selection)===-1){
						Months.push(selection);
					}
				});
				$scope.MonthsFilter = [];
				angular.forEach(Months, function(mo){
					var month = mo.split(' ');
					var desc = '';
					switch(parseInt(month[0])){
						case 1: desc = 'Jan'; break;
						case 2: desc = 'Feb'; break;
						case 3: desc = 'Mar'; break;
						case 4: desc = 'Apr'; break;
						case 5: desc = 'May'; break;
						case 6: desc = 'Jun'; break;
						case 7: desc = 'Jul'; break;
						case 8: desc = 'Aug'; break;
						case 9: desc = 'Sep'; break;
						case 10: desc = 'Oct'; break;
						case 11: desc = 'Nov'; break;
						case 12: desc = 'Dec'; break;
					}
					$scope.MonthsFilter.push({month:month[0],label:desc+' '+month[1],year:month[1]});
				});
			});
		}
		
		function getCollections(){
			$scope.Collections = {};
			var data = {
				type:$scope.ActiveOpt.id,
				esp:2020,
				from:$scope.date_from,
				to:$scope.date_to
			};
			if($scope.ActiveOpt.id=='daily'){
				data.from = $filter('date')(new Date(data.from),'yyyy-MM-dd');
				data.to = $filter('date')(new Date(data.to),'yyyy-MM-dd');
			}else{
				var today = new Date();
				var currMonth = today.getMonth()+1;
				if(currMonth==parseInt(data.to.month))
					$scope.Today = (new Date()).getUTCDate()+' '+data.to.label;
				data.from = data.from.year+'-'+data.from.month+'-01';
				data.to = data.to.year+'-'+data.to.month+'-31';
				
			}
			api.GET('collections',data, function success(response){
				var collection = response.data[0];
				var total_recvbl = collection.total_receivables-collection.total_subsidies;	
				collection['cfp'] = (collection.collection_forwarded/total_recvbl)*100;
				collection['bbp'] = (collection.beginning_balance/total_recvbl)*100;
				collection['ebp'] = (collection.ending_balance/total_recvbl)*100;
				
				var $CFP = collection['cfp'];
				var $BBP = collection['bbp'];
				var $EBP = collection['ebp'];
				var $COL = $BBP - $EBP;
				var $REM = $BBP -  $COL;

					$CFP = $filter('number')($CFP, 2);
					$COL = $filter('number')($COL, 2);
					$REM = $filter('number')($REM, 2);

				$scope.Loaded = 1;

				$scope.Chart = {labels:['Collection Forwarded','Collected','Remaining Balance'],data:[$CFP,$COL,$REM]};
				if($scope.ActiveOpt.id=='daily'){
					var i = 0;
					var ctr = 0;
					var collections = [];
					angular.forEach(collection.collections, function(col){
						if(!collections[i])
							collections[i]=[];
						collections[i][ctr] = col;
						if(ctr==9){
							i++;
							ctr = 0;
						}else
							ctr++;
					});
					$scope.ActivePage = 1;
					$scope.Modified = collections;
					collection.collections = collections;
				}
				$scope.Collections = collection;
				console.log($scope.Collections);
				$scope.Loading = 0;
			});
		}
		
		
	}]);

});