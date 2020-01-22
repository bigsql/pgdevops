angular.module('bigSQL.components').controller('dbGraphsController', ['$scope', '$stateParams', 'PubSubService', '$rootScope', '$interval','MachineInfo', 'bamAjaxCall', '$timeout', '$uibModal', function ($scope, $stateParams, PubSubService, $rootScope, $interval, MachineInfo, bamAjaxCall, $timeout, $uibModal) {
	var session, subscriptions=[], componentStatus, refreshRate;
    $scope.showGraphs = false;
    var cancelGraphsTimeout;
    $scope.connecting = false;
    $scope.polling_inteval = 5000;

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


    $scope.rowsChart = angular.copy($scope.transctionsPerSecondChart);
    $scope.rowsChart.chart['forceY'] = [0,1000];

    $scope.connectionsChart = angular.copy($scope.transctionsPerSecondChart);
    $scope.connectionsChart.chart.showControls = false;

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

    }

    if($scope.commitRollbackData.length <= 2){
        $scope.transctionsPerSecondChart.chart.noData = "Not Connected."
    }

    if($scope.connectionsData.length <= 3){
        $scope.connectionsChart.chart.noData = "Not Connected."
    }

    if($scope.rowsData.length <= 4){
        $scope.rowsChart.chart.noData = "Not Connected."
    }

    var previous_data = {};
    var stats = function (sid,gid){
    var connect_api_url = "/pgstats/stats/";
        var data = {
             sid:sid,
             gid:gid
            };
            var statusData = bamAjaxCall.getData(connect_api_url, data);
            statusData.then(function (argument) {
                    if (argument.state=="error"){
                        $timeout.cancel(cancelGraphsTimeout);
                        $scope.connect_err=argument.msg;
                        $scope.need_pwd=true;
                        $scope.version=false;
                    } else{
                        $scope.connect_err=false;
                        $scope.need_pwd=false;

                        if (!previous_data.hasOwnProperty(sid)){
                            previous_data[sid]={};
                        }

                        previous_data[sid]["commit"]=argument.xact_commit;
                        previous_data[sid]["rollback"]=argument.xact_rollback;


                        var timeData = Math.round( (new Date( argument.time + ' UTC')).getTime() );


                        if ($scope.connectionsData[0].values.length>30){
                            $scope.connectionsData[0].values.shift();
                            $scope.connectionsData[1].values.shift();
                            $scope.connectionsData[2].values.shift();
                        }

                        if ($scope.commitRollbackData[0].values.length>30){
                            $scope.commitRollbackData[0].values.shift();
                            $scope.commitRollbackData[1].values.shift();
                        }

                        if ($scope.rowsData[0].values.length>30) {
                            $scope.rowsData[0].values.shift();
                            $scope.rowsData[1].values.shift();
                            $scope.rowsData[2].values.shift();
                            $scope.rowsData[3].values.shift();
                        }
                        
                        $scope.connectionsData[0].values.push({ x: timeData, y: argument.connections.active});
                        $scope.connectionsData[1].values.push({x: timeData, y: argument.connections.idle});
                        $scope.connectionsData[2].values.push({x : timeData, y: argument.connections.idle_in_transaction});
                
                        $scope.rowsData[0].values.push({x:timeData, y:argument.tup_inserted});
                        $scope.rowsData[1].values.push({x:timeData, y:argument.tup_updated});
                        $scope.rowsData[2].values.push({x:timeData, y:argument.tup_deleted});
                        $scope.rowsData[3].values.push({x:timeData, y:argument.tup_fetched});

                        if (!previous_data.hasOwnProperty(sid)){
                            previous_data[sid]={};
                        }

                        if (previous_data[sid].hasOwnProperty("commit")){

                            var diff_ms = timeData-previous_data[sid]['timeData'];
                            var diff=Math.floor(diff_ms/1000);

                            var commit = Math.floor((argument.xact_commit-previous_data[sid]["commit"])/diff);
                            var rollback = Math.floor((argument.xact_rollback-previous_data[sid]["rollback"])/diff);

                            $scope.commitRollbackData[0].values.push({ x: timeData, y: commit});
                            $scope.commitRollbackData[1].values.push({ x: timeData, y: rollback});

                        }
                        previous_data[sid]['timeData']=timeData;
                        previous_data[sid]["commit"]=argument.xact_commit;
                        previous_data[sid]["rollback"]=argument.xact_rollback;
                        cancelGraphsTimeout = $timeout(function() {stats(sid, gid)}, $scope.polling_inteval);
                    }
            });

    };

    $scope.closeAllConnections = function(argument) {
        $timeout.cancel(cancelGraphsTimeout);
        $scope.connection.savePwd =false;
        $scope.connect_err = false;
        var statusData = bamAjaxCall.getData("/pgstats/disconnectall/");
        statusData.then(function (argument) {
            for (var i = $scope.pgListRes.length - 1; i >= 0; i--) {
                if($scope.pgListRes[i].isOpen == true){
                    $scope.connect_pg($scope.pgListRes[i].sid, $scope.pgListRes[i].gid, '');
                }
            }
        })
    }

    $scope.closeAllServers = function(){
        for (var i = $scope.pgListRes.length - 1; i >= 0; i--) {
            $scope.pgListRes[i].isOpen = false;
        }
        $scope.closeAllConnections();
        $timeout.cancel(cancelGraphsTimeout);
    }

    $scope.connect_pg = function(sid,gid, pwd, savePwd, update){
        var connect_api_url = "/pgstats/connect/";
        $scope.connecting = true;
        var data = {
             sid:sid,
             gid:gid,
             save:savePwd,
             update:update
            };
            if (pwd){
             data.pwd=pwd;
            };
            var statusData = bamAjaxCall.postData(connect_api_url, data);
            statusData.then(function (argument) {
                    $scope.connecting = false;
                    $timeout.cancel(cancelGraphsTimeout);
                    $rootScope.$emit('connectionData', argument);
                    clear();
                    if (argument.state=="error"){
                        $scope.connect_err=argument.msg;
                        var modalInstance = $uibModal.open({
                            templateUrl: '../app/components/partials/passwordModal.html',
                            controller: 'passwordModalController'
                        });
                        modalInstance.sid = sid;
                        modalInstance.gid = gid;
                        modalInstance.error = argument.msg;
                        $scope.need_pwd=true;
                        $scope.version=false;
                    } else{
                        $scope.version=argument.version;
                        $scope.connect_err=false;
                        $scope.need_pwd=false;
                        $rootScope.$emit('updateVersion', argument.version.replace("PostgreSQL ", ""));

                        $timeout(function() {stats(sid, gid)}, $scope.polling_inteval);
                    }
            });
    };    

    $rootScope.$on('clearDBGraphs', function (argument) {
        clear();
    })

    if(!$rootScope.$$listenerCount['getDBstatus']){
        $rootScope.$on('getDBstatus', function (event, sid, gid, pwd, savePwd, update) {
            $scope.connect_pg(sid, gid, pwd, savePwd, update);
        })
    }

    $rootScope.$on('changeRefInterval', function (event, argument, sid, gid) {
         $timeout.cancel(cancelGraphsTimeout);
         if (argument != '0') {
         $scope.polling_inteval = argument;
         cancelGraphsTimeout = $timeout(function() {stats(sid, gid)}, $scope.polling_inteval);
         }
    })

    $rootScope.$on('cancelPGStatusCall', function (argument) {
        $scope.closeAllServers();
    })

    $rootScope.$on('stopGraphCalls', function (argument) {
       $timeout.cancel(cancelGraphsTimeout); 
    })

    // Handle page visibility change events
    function handleVisibilityChange() {
        if (document.visibilityState == "hidden") {
            $timeout.cancel(cancelGraphsTimeout);
            clear();
        } else if (document.visibilityState == "visible") {
            clear();
            refreshRate = $interval(callStatus, 5000);
        }
    }

    

	//need to destroy all the subscriptions on a template before exiting it
    $scope.$on('$destroy', function () {
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i]);
        }
        clear();
        $timeout.cancel(cancelGraphsTimeout);
    });

}]);