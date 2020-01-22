angular.module('bigSQL.components').controller('HostsController', ['$scope', '$uibModal', 'PubSubService', '$state', 'UpdateComponentsService', '$filter', '$rootScope', '$timeout', '$window', '$http', '$location', 'bamAjaxCall', 'pgcRestApiCall', '$interval', '$cookies', '$cookieStore', 'htmlMessages', '$sce', function ($scope, $uibModal, PubSubService, $state, UpdateComponentsService, $filter, $rootScope, $timeout, $window, $http, $location, bamAjaxCall, pgcRestApiCall, $interval, $cookies, $cookieStore, htmlMessages, $sce ) {

    $scope.alerts = [];

    var subscriptions = [];
    $scope.components = {};
    $scope.hostState = {active : true};

    var currentComponent = {};
    var parentComponent = {};
    var dependentCount = 0;
    var depList = [];
    var session;
    var pid;
    var stopStatusCall;
    var stopPGCall;
    var getListCmd = false;
    $scope.updateSettings;
    $scope.loading = true;
    $scope.retry = false;
    $scope.disableShowInstalled = false;
    var previousTopData = "";
    $scope.openedHostIndex = '';
    $scope.openedGroupIndex = '';
    $scope.addedNewHost = false;
    $scope.pgcNotActive = false;
    $scope.sshTimeout = 20000;
    $scope.need_pwd=true;
    $scope.connect_err = false;
    // $scope.groupOpen = true;
    // $scope.hostOpen = true;
    $scope.version=false;
    $scope.actionBtnOpen = false;
    $scope.connection = {savePwd:false};
    $scope.pgListRes = [];
    var OpenCredentialHost = $cookies.get('OpenCredentialHost');

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

    var host_info ;

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

    $scope.cpuChart = {
        chart: {
            type: 'lineChart',
            height: 150,
            margin: {
                top: 20,
                right: 40,
                bottom: 40,
                left: 55
            },
            x: function (d) {
                return d.x;
            },
            y: function (d) {
                return d.y;
            },
            noData: "Loading...",
            interactiveLayer: {
                tooltip: {
                    headerFormatter: function (d) {
                        var point = new Date(d);
                        return d3.time.format('%Y/%m/%d %H:%M:%S')(point);
                    },
                    gravity : 'n',
                },
            },
            xAxis: {
                xScale: d3.time.scale(),
                tickFormat: function (d) {
                    var point = new Date(d);
                    return d3.time.format('%H:%M:%S')(point)
                },
            },
            yAxis: {
                tickFormat: function (d) {
                    return d3.format(',')(d);
                }
            },
            showLegend: false,
            forceY: [0, 100],
            useInteractiveGuideline: true,
            duration: 500
        }
    };
    $scope.ioChart = angular.copy($scope.cpuChart);
    $scope.networkChart = angular.copy($scope.cpuChart);

    $scope.cpuChart.chart.type = "stackedAreaChart";
    $scope.cpuChart.chart.showControls = false;


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
    }]

    $scope.cpuData = [{
        values: [],
        key: 'CPU System %',
        color: '#006994',
        area: true
    }, {
        values: [],
        key: 'CPU User %',
        color: '#FF5733',
        area: true
    }
    ];


    $scope.diskIO = [{
        values: [],
        key: 'Read Bytes (kB)',
        color: '#FF5733'
    }, {
        values: [],
        key: 'Write Bytes (kB)',
        color: '#006994'
    }];

    $scope.NetworkIO = [{
        values: [],
        key: 'Sent Bytes (kB)',
        color: '#FF5733'
    }, {
        values: [],
        key: 'Received Bytes (kB)',
        color: '#006994'
    }];

    var getLabList = pgcRestApiCall.getCmdData('lablist');
    $scope.multiHostlab = false;
    $scope.awsRdsFeature = false;
    getLabList.then(function (argument) {
        for (var i = argument.length - 1; i >= 0; i--) {
            if(argument[i].lab == "multi-host-mgr"){
                $scope.multiHostlabName = argument[i].disp_name;
            }else if(argument[i].lab == "aws"){
                $scope.awsRdslabName = argument[i].disp_name;
            }

            if(argument[i].lab == "multi-host-mgr" && argument[i].enabled == "on"){
                $scope.multiHostlab = true;
            }else if(argument[i].lab == "aws" && argument[i].enabled == "on"){
                $scope.awsRdsFeature = true;   
            }
        }
    })

    $scope.createNewRds = function(){
        if ($scope.awsRdsFeature) {
            var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/createNewRds.html',
                controller: 'createNewRdsController',
                keyboard  : false,
                windowClass : 'rds-modal',
                backdrop  : 'static',
            });
        }else{
            var getMessage = $sce.trustAsHtml(htmlMessages.getMessage('labNotEnabled').replace('{{lab}}', $scope.awsRdslabName));

                $scope.alerts.push({
                    msg: getMessage,
                    type: 'warning'
                });
        }
    }

    $rootScope.$on('RdsCreated', function (argument, data) {
        $scope.alerts.push({
                    msg: $sce.trustAsHtml(data),
                    type: 'success'
                });
    })

    $scope.discoverRds = function (settingName, value, disp_name) {
        if ($scope.awsRdsFeature) {
            var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/rdsModal.html',
                controller: 'rdsModalController',
                keyboard  : false,
                backdrop  : 'static',
                windowClass : 'rds-modal',
                size : 'lg'
            });
            modalInstance.lab = settingName;
            modalInstance.disp_name = disp_name;
            modalInstance.instance = 'db';
        }else{
            var getMessage = $sce.trustAsHtml(htmlMessages.getMessage('labNotEnabled').replace('{{lab}}', $scope.awsRdslabName));

                $scope.alerts.push({
                    msg: getMessage,
                    type: 'warning'
                });
        }
    }

    $scope.openPostgresConnGroup = function (argument) {
        $scope.showpgList = !argument;
        if ($scope.showpgList) {
            getPgList();            
        }
    }

    var sessionPromise = PubSubService.getSession();

    function getPgList(argument) {
        var sessionPromise = PubSubService.getSession();
        sessionPromise.then(function (val) {
        session = val;
            $rootScope.$emit("stopGraphCalls");
            session.call('com.bigsql.pgList', [$scope.userInfo.email]);
        });
    }

    $rootScope.$on('refreshPgList', function (event) {
        getPgList();
    })

    $scope.navToDetails = function (argument) {
        $rootScope.connection_comp = argument;
        $interval.cancel(stopStatusCall);
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i])
        }
        $rootScope.$emit('stopGraphCalls');
        $cookies.put('openConnection', argument);
        $window.location.href = '#/connection-details';
        $window.location.reload();
    }

    $scope.changeStatus = function (arg, value) {
        for (var i = $scope.pgListRes.length - 1; i >= 0; i--) {
            if($scope.pgListRes[i].server_name == arg){
                $scope.pgListRes[i].isOpen = !value;
            }
        }
    }

    sessionPromise.then(function (val) {
        session = val;

        var userInfoData = bamAjaxCall.getCmdData('userinfo');
        userInfoData.then(function(data) {
            $scope.userInfo = data;
            session.call('com.bigsql.pgList', [$scope.userInfo.email]);
        });

        session.call('com.bigsql.getSetting', ['SSH_TIMEOUT']);

        session.subscribe('com.bigsql.onGetSetting', function (data) {
            if (data[0]) {
                $scope.sshTimeout = data[0];
            }
            $timeout(function () {
                if ($scope.loading) {
                    $scope.pgcNotActive = true;
                    $scope.loading = false;
                    $scope.pgcNotActiveMsg = htmlMessages.getMessage('pgc-not-active');
                };
            }, $scope.sshTimeout);
        })

        session.subscribe("com.bigsql.onPgList", function (data) {
            var data = JSON.parse(data);
            $scope.pgListRes = data;
            for (var i = $scope.pgListRes.length - 1; i >= 0; i--) {
                $scope.pgListRes[i]['isOpen'] = false;
            }
            if (data.length > 0 && !OpenCredentialHost) {
                $scope.showpgList = true;
            }else{
                $scope.showpgList = false;
            }
            if($cookies.get('previousOpendPG')){
                var cookieVal = $cookies.get('previousOpendPG');
                for (var i = $scope.pgListRes.length - 1; i >= 0; i--) {
                    if($scope.pgListRes[i].sid == cookieVal){
                        $scope.pgListRes[i].isOpen = true;
                    }
                }
            }
            getGroupsList();
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        // session.call('com.bigsql.getBetaFeatureSetting', ['hostManager']);

        // session.subscribe("com.bigsql.onGetBeataFeatureSetting", function (settings) {
        //     if(settings[0].setting == 'hostManager'){
        //         if(settings[0].value == '0' || !settings[0].value){
        //             $scope.betaFeature = false;
        //         }else{
        //             $scope.betaFeature = true;
        //         }
        //     }
        //    $scope.$apply();
        // }).then(function (subscription) {
        //     subscriptions.push(subscription);
        // });
    });

    var getCurrentComponent = function (name, host) {
        for (var i = 0; i < $scope.hostsList.length; i++) {
            if($scope.hostsList[i].host == host){
                for (var j = 0; j < $scope.hostsList[i].comps.length; j++) {
                    if ($scope.hostsList[i].comps[j].component == name) {
                        currentComponent = $scope.hostsList[i].comps[j];
                        return currentComponent;
                    }
                }
            }
        }
    };

    function changePostgresOrder(data) {
        var comps = data;
        var pgComps = [];
        var nonPgComps = [];

        for (var i = 0; i < comps.length; i++) {
            if (comps[i]['category_desc'] == 'PostgreSQL') {
                pgComps.push(comps[i]);
            } else {
                nonPgComps.push(comps[i]);
            }
            ;
        }
        return pgComps.reverse().concat(nonPgComps);
    }

    $scope.updateComps =  function (p_idx, idx) {
        var remote_host = $scope.groupsList[p_idx].hosts[idx].host;
        var status_url = 'status --host "' + remote_host + '"';

        if (remote_host == "localhost") {
            status_url = 'status';
            remote_host = "";
        } else {
            remote_host = $scope.groupsList[p_idx].hosts[idx].name;
            status_url = 'status --host "' + remote_host + '"';
        }

        var statusData = pgcRestApiCall.getCmdData(status_url);
        statusData.then(function(data) {
                if ( data.length > 0 && data[0].state == 'error') {
                    $scope.hostState.active = false;
                    $scope.errorMsg = data[0].msg;
                    $interval.cancel(stopStatusCall);
                }else{
                    data = $(data).filter(function(i,n){ return n.component != 'pgdevops' });
                    if (!$scope.actionBtnOpen) {
                        $scope.groupsList[p_idx].hosts[idx].comps = data;                        
                    }
                    if ($scope.groupsList[p_idx].hosts[idx].comps.length == 0) {
                        $scope.groupsList[p_idx].hosts[idx].showMsg = true;
                    } else {
                        $scope.groupsList[p_idx].hosts[idx].showMsg = false;
                    }
                }
            });
    }

    $scope.getGraphValues = function (remote_host) {
        if (remote_host == "localhost" || remote_host == "") {
            var infoData = pgcRestApiCall.getCmdData('top');
        } else {
            var infoData = pgcRestApiCall.getCmdData('top --host ' + remote_host);
        }
        if (previousTopData == "") {
            var timeVal = new Date(Date.now());
            $scope.cpuData[0].values.push({x: timeVal, y: 0});
            $scope.cpuData[1].values.push({x: timeVal, y: 0});

            $scope.diskIO[0].values.push({x: timeVal, y: 0});
            $scope.diskIO[1].values.push({x: timeVal, y: 0});

            $scope.NetworkIO[0].values.push({x: timeVal, y: 0});
            $scope.NetworkIO[1].values.push({x: timeVal, y: 0});
        }
        infoData.then(function (data) {

            if (previousTopData != "") {
                var diff = data[0].current_timestamp - previousTopData.current_timestamp;
                var kb_read_diff = data[0].kb_read - previousTopData.kb_read;
                var kb_write_diff = data[0].kb_write - previousTopData.kb_write;
                var kb_sent_diff = data[0].kb_sent - previousTopData.kb_sent;
                var kb_recv_diff = data[0].kb_recv - previousTopData.kb_recv;

                var read_bytes = Math.round(kb_read_diff / diff);

                var write_bytes = Math.round(kb_write_diff / diff);

                var kb_sent = Math.round(kb_sent_diff / diff);
                var kb_recv = Math.round(kb_recv_diff / diff);

                if ($scope.cpuData[0].values.length > 20) {
                    $scope.cpuData[0].values.shift();
                    $scope.cpuData[1].values.shift();
                    $scope.diskIO[0].values.shift();
                    $scope.diskIO[1].values.shift();
                    $scope.NetworkIO[0].values.shift();
                    $scope.NetworkIO[1].values.shift();
                }

                var timeVal = new Date(data[0].current_timestamp*1000) ;
                var offset = new Date().getTimezoneOffset();
                timeVal.setMinutes(timeVal.getMinutes() - offset);
                if (read_bytes >= 0 ) {
                    $scope.cpuData[0].values.push({x: timeVal, y: parseFloat(data[0].cpu_system)});
                    $scope.cpuData[1].values.push({x: timeVal, y: parseFloat(data[0].cpu_user)});

                    $scope.diskIO[0].values.push({x: timeVal, y: read_bytes});
                    $scope.diskIO[1].values.push({x: timeVal, y: write_bytes});

                    $scope.NetworkIO[0].values.push({x: timeVal, y: kb_sent});
                    $scope.NetworkIO[1].values.push({x: timeVal, y: kb_recv});
                }
            }
            previousTopData = data[0];
        });

    }

    function clear() {
        previousTopData = '';
        $scope.cpuData[0].values.splice(0, $scope.cpuData[0].values.length);
        $scope.cpuData[1].values.splice(0, $scope.cpuData[1].values.length);
        
        $scope.NetworkIO[0].values.splice(0, $scope.NetworkIO[0].values.length);
        $scope.NetworkIO[1].values.splice(0, $scope.NetworkIO[1].values.length);
        
        $scope.diskIO[0].values.splice(0, $scope.diskIO[0].values.length);
        $scope.diskIO[1].values.splice(0, $scope.diskIO[1].values.length);
    }

    // $scope.loadGroup = function (index) {

        // if ($scope.groupsList[index]['state'] == undefined || $scope.groupsList[index]['state'] == false) {
        //     $scope.groupsList[index]['state'] = true;
        // } else{
        //     $scope.groupsList[index]['state'] = false;
        // }
    // }


    $scope.loadHost = function (p_idx, idx, refresh) {
        // if ($scope.groupsList[p_idx].hosts[idx]['state'] == undefined || $scope.groupsList[p_idx].hosts[idx]['state'] == false) {
        //     $scope.groupsList[p_idx].hosts[idx]['state'] = true;
        // } else{
        //     $scope.groupsList[p_idx].hosts[idx]['state'] = false;   
        // }
        $interval.cancel(stopPGCall);
        $interval.cancel(stopStatusCall);
        $scope.openedHostIndex = idx;
        $scope.openedGroupIndex = p_idx;
        $scope.hostsList = $scope.groupsList[p_idx].hosts;
        previousTopData = '';
        $scope.hostsList[idx].comps = '';
        $scope.hostStatus = true;
        $scope.hostState.active = true;
        $scope.retry = false;
        var isOpened = false;
        if (typeof $scope.hostsList[idx].open == "undefined") {
            isOpened = true;

        } else if ($scope.hostsList[idx].open) {
            isOpened = false;

        } else {
            isOpened = true;
        }
        if (refresh) {
            isOpened = refresh;
        }
        if($scope.cpuData[0].values.length > 0){
            clear();
        }

        if (isOpened) {
            var remote_host = $scope.hostsList[idx].host;
            var status_url = 'status --host "' + remote_host + '"';


            if (remote_host == "localhost") {
                status_url = 'status';
                remote_host = "";
            } else {
                remote_host = $scope.hostsList[idx].name;
                status_url = 'status --host "' + remote_host + '"';
            }

            var statusData = pgcRestApiCall.getCmdData(status_url);
            statusData.then(function(data) {
                if ( data.length > 0 && data[0].state == 'error') {
                    $scope.hostState.active = false;
                    $scope.errorMsg = data[0].msg;
                }else{
                    $scope.hostStatus = false;
                    data = $(data).filter(function(i,n){ return n.component != 'pgdevops' });
                    if(data.length <= 0){
                        $scope.groupsList[p_idx].hosts[idx].comps = data;
                        $scope.groupsList[p_idx].hosts[idx].showMsg = true;
                    }else if(data == "error" || data[0].state == 'error' && $scope.hostsList[idx].state == true){
                        $interval.cancel(stopPGCall);
                        stopPGCall = $interval(function (argument) {
                            $scope.loadHost(p_idx, idx, true);
                        } , 3000);
                        $scope.retry = true;
                    }else{
                        $scope.groupsList[p_idx].hosts[idx].comps = data;
                        $scope.groupsList[p_idx].hosts[idx].showMsg = false;
                    }
                }
            });
            $interval.cancel(stopStatusCall);

            var timeVal = new Date(Date.now());
            $scope.cpuData[0].values.push({x: timeVal, y: 0});
            $scope.cpuData[1].values.push({x: timeVal, y: 0});

            $scope.diskIO[0].values.push({x: timeVal, y: 0});
            $scope.diskIO[1].values.push({x: timeVal, y: 0});

            $scope.NetworkIO[0].values.push({x: timeVal, y: 0});
            $scope.NetworkIO[1].values.push({x: timeVal, y: 0});

            stopStatusCall = $interval(function (){
                if ($scope.groupsList[p_idx].hosts[idx].comps) {
                    $scope.updateComps(p_idx, idx);
                    $scope.getGraphValues(remote_host);
                }
            }, 5000);
        }
    };

    $scope.UpdateManager = function (idx) {
        var remote_host = $scope.hostsList[idx].host;
        if (remote_host == "localhost") {
            remote_host = "";
        } else {
            remote_host = $scope.hostsList[idx].name;
        }
        $cookies.put('remote_host', remote_host);
        $rootScope.remote_host = remote_host;
        $location.path('/components/view');


    };

    $scope.openInitPopup = function (comp) {
        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/pgInitialize.html',
            controller: 'pgInitializeController',
        });
        modalInstance.component = comp;
        modalInstance.dataDir = '';
        modalInstance.autoStartButton = true;
        modalInstance.host = $scope.hostsList[$scope.openedHostIndex].name;
        modalInstance.host_name = $scope.hostsList[$scope.openedHostIndex].name;
    };

    $scope.changeHost = function (host) {
        $cookies.put('remote_host', host);
    }

    $scope.deleteHost = function (idx) {
        $interval.cancel(stopStatusCall);
        var hostToDelete = $scope.hostsList[idx].host;
        if($cookies.get('remote_host') == hostToDelete){
            $cookies.put('remote_host', 'localhost');
        } else {
            hostToDelete = $scope.hostsList[idx].name;
        }
        var sessionPromise = PubSubService.getSession();
        sessionPromise.then(function (val) {
            session = val;
            session.call('com.bigsql.deleteHost', [hostToDelete]);
            session.subscribe("com.bigsql.onDeleteHost", function (data) {
                $scope.loading = true;
                getGroupsList(false);
                $scope.showpgList = undefined;
            }).then(function (subscription) {
                subscriptions.push(subscription);
            });
        });
    }

    $scope.stopServerCall = function (argument) {
        $interval.cancel(stopStatusCall);
    }

    $scope.restartServerCall = function () {
        $scope.actionBtnOpen = true;
        setTimeout( function () {
            $scope.actionBtnOpen = false;
        } , 10000);
    }

    $scope.startServerCall = function (p_idx, idx) {
        var remote_host = $scope.hostsList[idx].host;
        if (remote_host == "localhost") {
            remote_host = "";
        } else {
            remote_host = $scope.hostsList[idx].name;
        }
        stopStatusCall = $interval(function (){
            if ($scope.groupsList[p_idx].hosts[idx].comps) {
                $scope.updateComps(p_idx, idx);
                $scope.getGraphValues(remote_host);
            }
        }, 5000);
    }

    $scope.deleteGroup = function (idx){
        $interval.cancel(stopStatusCall);
        var groupToDelete = $scope.groupsList[idx].group;
        var sessionPromise = PubSubService.getSession();
        sessionPromise.then(function (val) {
            session = val;
            session.call('com.bigsql.deleteGroup', [groupToDelete]);
            $scope.loading = true;
            session.subscribe("com.bigsql.onDeleteGroup", function (data) {
                getGroupsList(false);
                $scope.showpgList = undefined;
            }).then(function (subscription) {
                subscriptions.push(subscription);
            });
        });
    }

    function hostsInfo(){
        $scope.hostsInfoData = [];
        for (var i = $scope.hostsList.length - 1; i >= 0; i--) {
            $scope.loadHostsInfo(i);
        }
    }

    $rootScope.$on('showAddedHost', function (argument) {
        $scope.loadHost(0, $scope.groupsList[0].hosts.length - 1 , true);
    });

    $rootScope.$on('showSelected', function (argument) {
        $scope.showpgList = false;
        $scope.loadHost(0, 1, true);
    });

    function getGroupsList(checkStorage) {
        $http.get($window.location.origin + '/api/pgc/register GROUP --list ?q='+ Math.floor(Date.now() / 1000).toString())
            .success(function (data) {
                if (data[0].state == 'error') {
                    $scope.loading = false;
                    $scope.errorData = data[0].msg;
                }else if ($scope.loading){
                    var storageData;
                    try{
                        storageData = JSON.parse(localStorage.getItem('groupsListCookie'));
                    }catch(err){
                        storageData = '';
                    }
                    if(storageData && checkStorage && data.length == storageData.length && data[0].hosts.length == storageData[0].hosts.length){
                        $scope.groupsList = storageData;
                        for (var i = $scope.groupsList.length - 1; i >= 0; i--) {
                            if ($scope.groupsList[i].state == true) {
                                for (var j = $scope.groupsList[i].hosts.length - 1; j >= 0; j--) {
                                    if($scope.groupsList[i].hosts[j].state == true){
                                        $scope.loadHost(i, j, false);
                                    }
                                }
                            };
                        }   
                    } else{
                        localStorage.clear();
                        $scope.groupsList = data;
                        for (var i = $scope.groupsList.length - 1; i >= 0; i--) {
                            $scope.groupsList[i].state = true;
                        } 
                        if (OpenCredentialHost) {
                            for (var i = $scope.groupsList[0].hosts.length - 1; i >= 0; i--) {
                               if($scope.groupsList[0].hosts[i].name == OpenCredentialHost){
                                    $scope.loadHost(0, i, false);
                                    $cookies.put('OpenCredentialHost', '');
                                    $scope.groupsList[0].hosts[i]['state'] = true;
                                    break;
                               }
                            }
                        }else if($scope.addedNewHost){
                            var hostNumber = $scope.groupsList[0].hosts.length - 1;
                            $scope.loadHost(0, hostNumber, false);
                            $scope.groupsList[0].hosts[hostNumber]['state'] = true;
                        }else{
                            $scope.loadHost(0, 0, false);  
                            $scope.groupsList[0].hosts[0]['state'] = true;                      
                        }
                    }
                    $rootScope.$emit('hideUpdates');
                    $scope.nothingInstalled = false;
                    $scope.loading = false;
                }
            }).error(function (error) {
                // $timeout(wait, 5000);
                $scope.loading = false;
                $scope.retry = true;
            });
    };

    // getGroupsList(true);

    $rootScope.$on('addedHost', function () {
        $scope.loading = true;
        getGroupsList(false);
        $scope.showpgList = undefined;
        $scope.addedNewHost = true;
    });

    $scope.action = function ( event, host, name) {
        var showingSpinnerEvents = ['Initialize', 'Start', 'Stop', 'Restart'];
        if(showingSpinnerEvents.indexOf(event.target.innerText) >= 0 ){
            currentComponent = getCurrentComponent( event.currentTarget.getAttribute('value'), host);
            currentComponent.showingSpinner = true;
        }
        if (event.target.tagName == "A") {
            var sessionPromise = PubSubService.getSession();
                sessionPromise.then(function (val) {
                session = val;
                if(host == 'localhost'){
                    if(event.target.innerText.toLowerCase() != 'initialize'){
                        session.call(apis[event.target.innerText], [event.currentTarget.getAttribute('value')]); 
                    }
                }else{
                    if(event.target.innerText.toLowerCase() != 'initialize'){
                        session.call(apis[event.target.innerText], [event.currentTarget.getAttribute('value'), name]);
                    }
                }
            });
        }
        ;
    };

    $scope.installedComps = function (event) {
        session.call('com.bigsql.setBamConfig', ['showInstalled', $scope.showInstalled]);
    };


    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    function wait() {
        $window.location.reload();
    };

    $rootScope.$on('openEditConn', function (argument, sid) {
        var serverDetails = $($scope.pgListRes).filter(function(i,n){ return n.sid == sid })[0];
        $scope.openPGConnModal(serverDetails);
    })

    $rootScope.$on('comparePGVersion', function(argument, host) {
        var comparePGVersion = bamAjaxCall.getCmdData('compare_pg_versions/' + host);
        comparePGVersion.then(function (argument) {
            if (argument.result_code==1 || argument.result_code==2) {
                var modalInstance = $uibModal.open({
                    templateUrl: '../app/components/partials/RemotepgcVersionCheckModal.html',
                    windowClass: 'modal',
                    controller: 'RemotepgcVersionCheckModalController',
                    scope: $scope,
                    keyboard  : false,
                    backdrop  : 'static',
                });
                modalInstance.host = host;
                modalInstance.local_pg_ver = argument.local_pg_ver;
                modalInstance.remote_pg_ver = argument.remote_pg_ver;
                modalInstance.returnCode = argument.result_code;
            }
        })
    });

    $rootScope.$on('stopStatusGraphs', function (argument) {
        $interval.cancel(stopPGCall);
        $interval.cancel(stopStatusCall);
        clear();
    })

    $scope.openPGConnModal = function (argument) {
        if(argument){
            $cookies.put('previousOpendPG', argument.sid);
        }
        if ($scope.multiHostlab || argument) {
            var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/addPGConnectionModal.html',
                windowClass: 'modal',
                controller: 'addPGConnectionModalController',
                scope: $scope,
                keyboard  : false,
                backdrop  : 'static',
            });
            modalInstance.pgList = $scope.pgListRes;
            modalInstance.editConnData = argument;
        }else{
            var getMessage = $sce.trustAsHtml(htmlMessages.getMessage('labNotEnabled').replace('{{lab}}', $scope.multiHostlabName));

                $scope.alerts.push({
                    msg: getMessage,
                    type: 'warning'
                });
        }
    }

    $scope.open = function (p_idx, idx, cred_name) {
            if ($scope.multiHostlab) {
                $scope.editHost = '';
                if(idx >= 0){
                    $scope.editHost = $scope.groupsList[p_idx].hosts[idx];
                }

                var modalInstance = $uibModal.open({
                    templateUrl: '../app/components/partials/addHostModal.html',
                    windowClass: 'modal',
                    controller: 'addHostController',
                    scope: $scope,
                    keyboard  : false,
                    backdrop  : 'static',
                });
                modalInstance.cred_name = cred_name
            }else{
                var getMessage = $sce.trustAsHtml(htmlMessages.getMessage('labNotEnabled').replace('{{lab}}', $scope.multiHostlabName));

                $scope.alerts.push({
                    msg: getMessage,
                    type: 'warning'
                });
            }
        };

    $scope.deletePGConn = function (sid, gid) {
        var data = {
            sid:sid,
            gid:gid
        };
        var addToMetaData = $http.post($window.location.origin + '/api/delete_from_metadata', data);
            addToMetaData.then(function (argument) {
                getPgList();
                var type = "danger";
                if (argument.data.error == 0) {
                    type = "success";
                }
                $scope.alerts.push({
                    msg: $sce.trustAsHtml(argument.data.msg),
                    type: type
                });
            });
    }

    $scope.openGroupsModal = function (idx) {
            if($scope.multiHostlab){
                var modalInstance = $uibModal.open({
                    templateUrl: '../app/components/partials/addServerGroupsModal.html',
                    windowClass: 'modal',
                    controller: 'addServerGroupsController',
                    scope: $scope,
                });
                $scope.editGroup = '';
                if(idx){
                    $scope.editGroup = $scope.groupsList[idx];
                    $scope.editGroupIndex = idx;
                    for (var i = $scope.groupsList.length - 1; i >= 0; i--) {
                        if($scope.groupsList[i].group == $scope.editGroup.group){
                            modalInstance.groupServers = $scope.groupsList[i].hosts;
                        }
                    }
                }
            }else{
                var getMessage = $sce.trustAsHtml(htmlMessages.getMessage('labNotEnabled').replace('{{lab}}', $scope.multiHostlabName));

                $scope.alerts.push({
                    msg: getMessage,
                    type: 'warning'
                });
            }
        };

    $scope.showTop = function (idx) {
        var remote_host = $scope.hostsList[idx].host;
        if (remote_host == "localhost") {
            remote_host = "";
            $scope.top_host = "";

        } else {
            remote_host = $scope.hostsList[idx].host;

            $scope.top_host = remote_host;
            $scope.host_name = $scope.hostsList[idx].name;
        }

        $scope.host_info = $scope.hostsList[idx].hostInfo;


        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/topModal.html',
            windowClass: 'modal',
            size: 'lg',
            controller: 'topController',
            scope : $scope
        });
    };

    $scope.navTopgAdmin = function () {
        $window.location.href = '/admin';
    }

    $scope.openDetailsModal = function (comp) {
        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/details.html',
            // windowClass: 'comp-details-modal',
            size: 'lg',
            controller: 'ComponentDetailsController',
            keyboard  : false,
            backdrop  : 'static',
        });
        modalInstance.component = comp;
        modalInstance.isExtension = true;
    };

    $scope.openGraphModal = function (chartName) {
        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/hostGraphModal.html',
            windowClass: 'modal',
            size: 'lg',
            controller: 'hostGraphModalController',
            scope : $scope
        });
        if(chartName == 'CPU Load'){
            modalInstance.data = $scope.cpuData;
            modalInstance.chart = angular.copy($scope.cpuChart);
        } else if(chartName == 'Disk IO'){
            modalInstance.data = $scope.diskIO;
            modalInstance.chart = angular.copy($scope.ioChart);
        } else {
            modalInstance.data = $scope.NetworkIO;
            modalInstance.chart = angular.copy($scope.networkChart);
        }
        modalInstance.chartName = chartName;
        modalInstance.hostName = $scope.hostsList[$scope.openedHostIndex].name;
        modalInstance.host = $scope.hostsList[$scope.openedHostIndex].host;
    }

    $rootScope.$on('updateGroups', function (argument) {
        $scope.loading = true;
        getGroupsList(false);
        $scope.showpgList = undefined;
    })
    
    // Handle page visibility change events
    function handleVisibilityChange() {
        if (document.visibilityState == "hidden") {
            $interval.cancel(stopStatusCall);
            clear();
        } else if (document.visibilityState == "visible") {
            clear();
            $scope.loadHost($scope.openedGroupIndex, $scope.openedHostIndex, true);
        }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange, false);

    //need to destroy all the subscriptions on a template before exiting it
    $scope.$on('$destroy', function () {
        localStorage.clear();
        localStorage.setItem('groupsListCookie', JSON.stringify($scope.groupsList));
        $interval.cancel(stopStatusCall);
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i])
        }
    });
}]);

