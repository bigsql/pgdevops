angular.module('bigSQL.components').controller('graphsTabController', ['$scope', '$stateParams', 'PubSubService', '$rootScope', '$interval','MachineInfo', function ($scope, $stateParams, PubSubService, $rootScope, $interval, MachineInfo) {
	var session, subscriptions=[], componentStatus, refreshRate;
    $scope.showGraphs = false;

    $scope.transctionsPerSecondChart = {
        chart: {
            type: 'lineChart',
            height: 150,
            margin : {
                top: 20,
                right: 40,
                bottom: 40,
                left: 55
            },
            x: function(d){ return d.x; },
            y: function(d){ return d.y; },
            noData:"Loading...",
            interactiveLayer : {
                tooltip: {
                    headerFormatter: function (d) { 
                        var point = new Date(d);
                        return d3.time.format('%Y/%m/%d %H:%M:%S')(point); 
                    },
                },
            },

            xAxis: {
                xScale: d3.time.scale(),
                    tickFormat: function(d) { 
                        var point = new Date(d);
                        return d3.time.format('%H:%M:%S')(point) 
                    },
                },
            yAxis: {
                tickFormat: function(d) { 
                    return d3.format(',')(d);
                }
            },
            forceY: [0,5],
            useInteractiveGuideline: true,
            legend: { margin : {
                top: 10, right: 0, left: 0, bottom: 0
            }}
        }
    };


    $scope.cpuChart = angular.copy($scope.transctionsPerSecondChart);
    $scope.cpuChart.chart['forceY'] = [0,100];
    $scope.cpuChart.chart.type = "stackedAreaChart";
    $scope.cpuChart.chart.showControls = false;

    $scope.rowsChart = angular.copy($scope.transctionsPerSecondChart);
    $scope.rowsChart.chart['forceY'] = [0,1000];

    $scope.connectionsChart = angular.copy($scope.transctionsPerSecondChart);
    $scope.connectionsChart.chart.type = "stackedAreaChart";
    $scope.connectionsChart.chart.showControls = false;

    $scope.diskIOChart = angular.copy($scope.transctionsPerSecondChart);
    $scope.transctionsPerSecondChart.chart['forceY'] = [0,50];

    $scope.commitRollbackData = [
        {
            values: [],
            key: 'Commit',
            color: '#FF5733'
        },
        {
            values: [],      
            key: 'Rollback', 
            color: '#006994'  
        }];

    $scope.cpuData = [{
            values: [],      
            key: 'CPU System %', 
            color: '#FF5733',
        },
        {
            values: [],      
            key: 'CPU User %', 
            color: '#006994' ,
        }];

    $scope.diskIOData = [{
        values: [],
        key: 'Read Bytes (MB)',
        color: '#FF5733'
    },{
        values: [],
        key: 'Write Bytes (MB)',
        color: '#006994'
    }];

    $scope.rowsData = [{
        values: [],
        key: 'Insert',
        color: '#006400'
    },{
        values: [],
        key: 'Update',
        color: '#FF5733'
    },{
        values: [],
        key: 'Delete',
        color: '#006994'
    },{
        values: [],
        key: 'Select',
        color: '#9932CC'
    }]

    $scope.connectionsData = [{
            values: [],      
            key: 'Active', 
            color: '#FF5733',
        },{
            values: [],
            key: 'Idle',
            color: '#006994',
        },{
            values: [],
            key: 'Idle Transactions',
            color: '#9932CC',
        }];

    function clear() {
        $scope.rowsData[0].values.splice(0, $scope.rowsData[0].values.length);
        $scope.rowsData[1].values.splice(0, $scope.rowsData[1].values.length);
        $scope.rowsData[2].values.splice(0, $scope.rowsData[2].values.length);
        $scope.rowsData[3].values.splice(0, $scope.rowsData[3].values.length);


        $scope.commitRollbackData[0].values.splice(0, $scope.commitRollbackData[0].values.length);
        $scope.commitRollbackData[1].values.splice(0, $scope.commitRollbackData[1].values.length);


        $scope.connectionsData[0].values.splice(0, $scope.connectionsData[0].values.length);
        $scope.connectionsData[1].values.splice(0, $scope.connectionsData[1].values.length);
        $scope.connectionsData[2].values.splice(0, $scope.connectionsData[2].values.length);

        $scope.cpuData[0].values.splice(0, $scope.cpuData[0].values.length);
        $scope.cpuData[1].values.splice(0, $scope.cpuData[1].values.length);

        $scope.diskIOData[0].values.splice(0, $scope.diskIOData[0].values.length);
        $scope.diskIOData[1].values.splice(0, $scope.diskIOData[1].values.length);
    }

    $rootScope.$on('sessionCreated', function () {
        var sessPromise = PubSubService.getSession();
        sessPromise.then(function (sessParam) {
            session = sessParam;
            $rootScope.$emit('topMenuEvent');
        });
    });

    $rootScope.$on('componentStatus', function (argument) {
    	componentStatus = arguments[1];
    })

    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
    	session = val;
    	session.call('com.bigsql.initial_dbstats',[$stateParams.component]);
	    session.call("com.bigsql.initial_graphs");

	    $scope.tabClick = function (argument) {
	        session.call('com.bigsql.live_graphs');
	        session.call('com.bigsql.live_dbstats', [$stateParams.component]);
	    }

	    session.subscribe("com.bigsql.initdbstats", function (data) {
        var graph_data = data[0];
        if(graph_data['component'] == $stateParams.component){
            $scope.commitRollbackData[0].values.length = 0;
            $scope.commitRollbackData[1].values.length = 0;
            $scope.rowsData[0].values.length = 0;
            $scope.rowsData[1].values.length = 0;
            $scope.rowsData[2].values.length = 0;
            $scope.rowsData[3].values.length = 0;
            $scope.connectionsData[0].values.length = 0;
            $scope.connectionsData[1].values.length = 0;
            $scope.connectionsData[2].values.length = 0;
	        for (var i=0;i<graph_data.stats.length;i=i+1){
	            var timeData = Math.round( (new Date( graph_data.stats[i]['time'] + ' UTC')).getTime() );
	            $scope.commitRollbackData[0].values.push({ x: timeData,  y: graph_data.stats[i]['xact_commit']});
	            $scope.commitRollbackData[1].values.push({ x: timeData,  y: graph_data.stats[i]['xact_rollback']});
	            $scope.connectionsData[0].values.push({ x: timeData, y: graph_data.stats[i]['connections']['active']});
                $scope.connectionsData[1].values.push({ x: timeData, y: graph_data.stats[i]['connections']['idle']});
	            $scope.connectionsData[2].values.push({x: timeData, y: graph_data.stats[i]['connections']['idle in transaction']});
                $scope.rowsData[0].values.push({x:timeData, y:graph_data.stats[i]['tup_inserted']});
	            $scope.rowsData[1].values.push({x:timeData, y:graph_data.stats[i]['tup_updated']});
	            $scope.rowsData[2].values.push({x:timeData, y:graph_data.stats[i]['tup_deleted']});
	            $scope.rowsData[3].values.push({x:timeData, y:graph_data.stats[i]['tup_fetched']});
	        }
            $scope.connectionsChart.chart['forceY'] = [0, graph_data.stats[1]['connections']['max']];
	        $scope.$apply();
	    }
	    }).then(function (subscription) {
	        subscriptions.push(subscription);
	    });

	    session.subscribe('com.bigsql.dbstats', function (data) {
	    	if(data[0].component == $stateParams.component){
		        if($scope.commitRollbackData[0].values.length > 60){
		            $scope.commitRollbackData[0].values.shift();
		            $scope.commitRollbackData[1].values.shift();
		            $scope.rowsData[0].values.shift();
		            $scope.rowsData[1].values.shift();
		            $scope.rowsData[2].values.shift();
		            $scope.rowsData[3].values.shift();
                    $scope.connectionsData[0].values.shift();
                    $scope.connectionsData[1].values.shift();
                    $scope.connectionsData[2].values.shift();         
		        }
		        var timeVal = Math.round( (new Date(data[0].stats['time'] + ' UTC')).getTime())
		        $scope.commitRollbackData[0].values.push({ x: timeVal,  y: data[0].stats['xact_commit']});
		        $scope.commitRollbackData[1].values.push({ x: timeVal,  y: data[0].stats['xact_rollback']});
		        $scope.connectionsData[0].values.push({ x: timeVal, y: data[0].stats['connections']['active']});
		        $scope.connectionsData[1].values.push({x: timeVal, y: data[0].stats['connections']['idle']});
                $scope.connectionsData[2].values.push({x : timeVal, y: data[0].stats['connections']['idle in transaction']});
                $scope.rowsData[0].values.push({x: timeVal, y: data[0].stats['tup_inserted']});
		        $scope.rowsData[1].values.push({x: timeVal, y: data[0].stats['tup_updated']});
		        $scope.rowsData[2].values.push({x: timeVal, y: data[0].stats['tup_deleted']});
		        $scope.rowsData[3].values.push({x: timeVal, y: data[0].stats['tup_fetched']});
                $scope.$apply();
	    	}

	    });


	    function callStatus(argument) {
		    session.call('com.bigsql.live_graphs');
	        if($scope.commitRollbackData.length <= 2){
	            $scope.transctionsPerSecondChart.chart.noData = "No Data Available."
	        }
	        if($scope.connectionsData.length <= 3){
	            $scope.connectionsChart.chart.noData = "No Data Available."
	        }
	        if($scope.rowsData.length <= 4){
	            $scope.rowsChart.chart.noData = "No Data Available."
	        }
	        if(componentStatus == undefined){
	        }else if (componentStatus.state == "Running"){
	            session.call("com.bigsql.live_dbstats",[$stateParams.component]);
                session.call('com.bigsql.activity',[$stateParams.component]);
	        }
    	};

	    refreshRate = $interval(callStatus, 5000);

	    $rootScope.$on('refreshRateVal', function () {
	    	$interval.cancel(refreshRate);
	    	if(arguments[1] == "" || arguments[1] == undefined){
	    		refreshRate = $interval(callStatus, 5000);
	    	} else if (arguments[1] == '0'){
                $interval.cancel(refreshRate);
            } else {
		    	refreshRate = $interval(callStatus, arguments[1]);    		
	    	}
	    });

        session.subscribe("com.bigsql.initgraphs", function (data) {
	        var graph_data = data[0];
            $scope.cpuData[0].values.length = 0;
            $scope.cpuData[1].values.length = 0;
            $scope.diskIOData[0].values.length = 0;
            $scope.diskIOData[1].values.length = 0;
	        for (var i=0;i<graph_data.length;i=i+1){
	            var timeVal = Math.round( (new Date( graph_data[i]['time'] + ' UTC')).getTime() );
	            $scope.cpuData[0].values.push({x: timeVal, y: graph_data[i]['cpu_per']['system']});
	            $scope.cpuData[1].values.push({x: timeVal, y: graph_data[i]['cpu_per']['user']});
	            $scope.diskIOData[0].values.push({x: timeVal, y: graph_data[i]['io']['read_bytes']});
	            $scope.diskIOData[1].values.push({x: timeVal, y: graph_data[i]['io']['write_bytes']});
	        }
	        if($scope.cpuData.length <= 2){
	            $scope.cpuChart.chart.noData = "No Data Available."
	        }
	        if($scope.diskIOData.length <= 2){
	            $scope.diskIOChart.chart.noData = "No Data Available."
	        }
	       	$scope.$apply();
	    }).then(function (subscription) {
	        subscriptions.push(subscription);
	    });

	    session.subscribe("com.bigsql.graphs", function (data) {
	        if($scope.cpuData[0].values.length > 60){
	            $scope.cpuData[0].values.shift();
	            $scope.cpuData[1].values.shift(); 
	            $scope.diskIOData[0].values.shift();
	            $scope.diskIOData[1].values.shift();    
	        }
	        var timeVal = Math.round( (new Date(data[0]['time'] + ' UTC')).getTime() )
	        $scope.cpuData[0].values.push({x: timeVal, y: data[0]['cpu_per']['system']});
	        $scope.cpuData[1].values.push({x: timeVal, y: data[0]['cpu_per']['user']});
	        $scope.diskIOData[0].values.push({x:timeVal,y:data[0]['io']['read_bytes']});
            $scope.diskIOData[1].values.push({x:timeVal,y:data[0]['io']['write_bytes']});
	        $scope.showGraphs = true;
            $scope.$apply();
	    }).then(function (subscription) {
	        subscriptions.push(subscription);
	    });

        // Handle page visibility change events
        function handleVisibilityChange() {
            if (document.visibilityState == "hidden") {
                $interval.cancel(refreshRate);
                clear();
            } else if (document.visibilityState == "visible") {
                clear();
                session.call('com.bigsql.initial_dbstats', [$stateParams.component]);
                session.call("com.bigsql.initial_graphs");
                refreshRate = $interval(callStatus, 5000);
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange, false);
	});

	//need to destroy all the subscriptions on a template before exiting it
    $scope.$on('$destroy', function () {
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i]);
        }
        clear();
        $interval.cancel(refreshRate);
    });

}]);