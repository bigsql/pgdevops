angular.module('bigSQL.components').controller('ComponentsStatusController', ['$scope', 'PubSubService', 'MachineInfo', '$interval', '$rootScope', '$window', 'bamAjaxCall','$uibModal', function ($scope, PubSubService, MachineInfo, $interval, $rootScope, $window, bamAjaxCall, $uibModal) {

    var subscriptions = [];
    $scope.comps = {};
    var session;
    var refreshRate;
    var currentComponent = {};
    var graphData = [0, 1, 2, 3, 4, 5, 6, 8, 9, 10];

    function callStatus(argument) {
        var statusData = bamAjaxCall.getCmdData('status');
        statusData.then(function(data) {
            $scope.comps = data;
            if($scope.comps.length == 0){
                $scope.showMsg = true;
            } else{
                $scope.showMsg = false;
            }
        });
    }

    function callInfo(argument) {
        var infoData = bamAjaxCall.getCmdData('info');
        infoData.then(function(data) {
            $scope.pgcInfo = data[0];
        });
    }

    function compAction(action, comp) {
        var sessionKey = "com.bigsql." + action;
        session.call(sessionKey, [comp]).then(function (argument) {
            callInfo();
        })
    }

    callStatus();
    callInfo();

    $interval(callStatus, 5000);

    $scope.alerts = [];
    $scope.init = false;
    $scope.statusColors = {
        "Stopped": "orange",
        "Not Initialized": "yellow",
        "Running": "green"
    };


    var apis = {
        "Stop": "com.bigsql.stop",
        "Restart": "com.bigsql.restart",
        "Initialize": "com.bigsql.init",
        "Start": "com.bigsql.start",
        "Remove": "com.bigsql.remove"
    };

    var getCurrentComponent = function (name) {
        for (var i = 0; i < $scope.comps.length; i++) {
            if ($scope.comps[i].component == name) {
                currentComponent = $scope.comps[i];
                return currentComponent;
            }
        }
    };
    
    $scope.cpuChart = {
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
            forceY: [0,100],
            useInteractiveGuideline: true,
            duration: 500
        }
    };
    $scope.ioChart = angular.copy($scope.cpuChart);
    $scope.cpuChart.chart.type = "stackedAreaChart";
    $scope.cpuChart.chart.showControls = false;

    $scope.cpuData = [{
            values: [],      
            key: 'CPU System %', 
            color: '#006994' ,
            area: true 
        },{
            values: [],      
            key: 'CPU User %', 
            color: '#FF5733',
            area: true
        }
        ];

    $scope.diskIO = [{
        values: [],
        key: 'Read Bytes (MB)',
        color: '#FF5733'
    },{
        values: [],
        key: 'Write Bytes (MB)',
        color: '#006994'
    }];

    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
        $rootScope.$emit('topMenuEvent');
        session = val;

        session.subscribe("com.bigsql.graphs", function (data) {
            if($scope.cpuData[0].values.length > 60){
                $scope.cpuData[0].values.shift();
                $scope.cpuData[1].values.shift();
                $scope.diskIO[0].values.shift();
                $scope.diskIO[1].values.shift();             
            }
            var timeVal = Math.round( (new Date(data[0]['time'] + ' UTC')).getTime() )
            $scope.cpuData[0].values.push({x:timeVal, y:data[0]['cpu_per']['system']});
            $scope.cpuData[1].values.push({x:timeVal, y:data[0]['cpu_per']['user']});
            $scope.diskIO[0].values.push({x:timeVal,y:data[0]['io']['read_bytes']});
            $scope.diskIO[1].values.push({x:timeVal,y:data[0]['io']['write_bytes']});
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        session.subscribe("com.bigsql.initgraphs", function (data) {
            var graph_data = data[0];
            $scope.cpuData[1].values.length = 0;
            $scope.cpuData[0].values.length = 0;
            $scope.diskIO[0].values.length = 0;
            $scope.diskIO[1].values.length = 0;
            for (var i=0;i<graph_data.length;i=i+1){
                var timeVal = Math.round( (new Date( graph_data[i]['time'] + ' UTC')).getTime() );
                $scope.cpuData[0].values.push({x:timeVal, y:graph_data[i]['cpu_per']['system']});
                $scope.cpuData[1].values.push({x:timeVal, y:graph_data[i]['cpu_per']['user']});
                $scope.diskIO[0].values.push({ x: timeVal,  y: graph_data[i]['io']['read_bytes']});
                $scope.diskIO[1].values.push({ x: timeVal,  y: graph_data[i]['io']['write_bytes']})
            }
            if( $scope.cpuData.length <= 2){
                $scope.cpuChart.chart.noData = "No Data Available."
            }
            if( $scope.diskIO.length <= 2){
                $scope.ioChart.chart.noData = "No Data Available."
            }

        }).then(function (subscription) {
            subscriptions.push(subscription);
             refreshRate = $interval(callGraphs,5000);
        });

        // session.call("com.bigsql.serverStatus");

        session.call("com.bigsql.initial_graphs");

        $rootScope.$on('initComp', function (event, comp) {
            currentComponent = getCurrentComponent(comp);
            currentComponent.showingSpinner = true;
        });

        session.subscribe('com.bigsql.onInit', function (data) {
            var res = JSON.parse(data[0])[0];
            if(res['status'] == 'error'){
                $scope.alerts.push({
                    msg: res['msg'],
                    type: "danger"
                });
            } else {
                $scope.alerts.push({
                    msg: res['msg']
                });
                currentComponent = getCurrentComponent(res['component']);
                compAction('start', res['component']);
            // currentComponent.showingSpinner = false;
            }
        }).then(function (sub) {
            subscriptions.push(sub);
        }); 

        $scope.closeAlert = function (index) {
            $scope.alerts.splice(index, 1);
        };

    });

    $scope.openInitPopup = function (comp) {
            var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/pgInitialize.html',
                controller: 'pgInitializeController',
            });
            modalInstance.component = comp;
        };

    $scope.action = function (event) {
        var showingSpinnerEvents = [ 'Start', 'Stop'];
        if(showingSpinnerEvents.indexOf(event.target.innerText) >= 0 ){
            currentComponent = getCurrentComponent(event.currentTarget.getAttribute('value'));
            currentComponent.showingSpinner = true;
        }
        if (event.target.tagName == "A" && event.target.attributes.action != undefined) {
            session.call(apis[event.target.innerText], [event.currentTarget.getAttribute('value')]);
        }
        ;
    };

    function handleVisibilityChange() {
      if (document.visibilityState == "hidden") {
        $interval.cancel(refreshRate);
      } else if(document.visibilityState == "visible"){
        session.call("com.bigsql.initial_graphs");
        refreshRate = $interval(callGraphs,5000);
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange, false);

    function callGraphs() {
        session.call('com.bigsql.live_graphs');
    }


    /**
     Unsubscribe to all the apis on the template and scope destroy
     **/
    $scope.$on('$destroy', function () {
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i]);
        };
        $interval.cancel(refreshRate);
    });


}]);