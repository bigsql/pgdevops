angular.module('bigSQL.components').controller('ComponentDetailsPg95Controller', ['$scope', '$stateParams', 'PubSubService', '$rootScope', '$interval', 'MachineInfo', '$window', 'pgcRestApiCall', '$uibModal', '$sce', '$cookies', '$http', 'userInfoService', function ($scope, $stateParams, PubSubService, $rootScope, $interval, MachineInfo, $window, pgcRestApiCall, $uibModal, $sce, $cookies, $http, userInfoService) {

    $scope.alerts = [];
    var subscriptions = [];
    var session = PubSubService.getSession();
    $scope.loading = true;

    var infoRefreshRate;
    var statusRefreshRate;
    var dependentCount = 0;
    $scope.currentHost;

    var componentStatus = 0;

    var activityTab = angular.element(document.querySelector('#activityTab'));

    function compAction(action) {
        if (action == 'init') {
            $scope.component.spinner = 'Initializing..';
        } else if (action == 'start') {
            $scope.component.spinner = 'Starting..';
        } else if (action == 'stop') {
            $scope.component.spinner = 'Stopping..';
        } else if (action == 'remove') {
            $scope.component.spinner = 'Removing..';
        } else if (action == 'restart') {
            $scope.component.spinner = 'Restarting..';
        }
        var sessionKey = "com.bigsql." + action;
        var currentHost = $cookies.get('remote_host');
        if(currentHost == 'localhost' || currentHost == ''){
            session.call(sessionKey, [$scope.component.component]).then(function (argument) {
                callInfo();
            })
        }else{
            session.call(sessionKey, [$scope.component.component, $cookies.get('remote_host')]).then(function (argument) {
                callInfo();
            })
        }
    }

    function callInfo(argument) {
        if (argument) {
            var remote_host = argument;
        }else{
            var remote_host = $cookies.get('remote_host');            
        }
        remote_host = typeof remote_host !== 'undefined' ? remote_host : "";
        $scope.currentHost = remote_host;
        if (remote_host == "" || remote_host == "localhost") {
            var checkStatus = pgcRestApiCall.getCmdData('status ' + $stateParams.component);    
        }else{
            var checkStatus = pgcRestApiCall.getCmdData('status ' + $stateParams.component + ' --host "' + remote_host + '"');
        }
        
        checkStatus.then(function (data) {

            var infoUrl = 'info/'
            if (data.state != 'Running') {
                $scope.releaseTabEvent();
            }
            if (remote_host == "" || remote_host == "localhost") {
                var infoData = pgcRestApiCall.getCmdData('info ' + $stateParams.component);
            } else {
                var infoData = pgcRestApiCall.getCmdData('info ' + $stateParams.component + ' --host "' + remote_host + '"');
            }

            infoData.then(function (data) {
                
                $scope.showErrormsg = false;
                // $scope.relnotes = $sce.trustAsHtml(data[0].rel_notes);
                if( typeof data !== 'string'){
                    if (data[0].state!='error') {
                        $scope.loading = false;
                        $scope.showErrormsg = false;
                        if (data[0]['autostart'] == "on") {
                            data[0]['autostart'] = true;
                        } else {
                            data[0]['autostart'] = false;
                        }
                        if (window.location.href.split('/').pop(-1) == data[0].component) {
                            $scope.component = data[0];
                            if ($scope.component.status != "Running") {
                                $scope.activeReleaseNotes = true;
                                $scope.activeOverview = false;
                                $scope.uibStatus = {
                                    tpsChartCollapsed: false,
                                    rpsChartCollapsed: false,
                                    diskChartCollapsed: true,
                                    cpuChartCollapsed: true,
                                    connectionsCollapsed: false
                                };
                            } else {
                                $scope.activeReleaseNotes = false;
                                $scope.activeOverview = true;
                                $scope.uibStatus = {
                                    tpsChartCollapsed: true,
                                    rpsChartCollapsed: true,
                                    diskChartCollapsed: false,
                                    cpuChartCollapsed: true,
                                    connectionsCollapsed: false
                                };
                            }
                        }
                    }else{
                        $scope.errorData = data[0];
                        $scope.showErrormsg = true;
                        $scope.loading = false;
                    }
                }
            });
        });
    };

    function callStatus(argument) {
        var remote_host = $cookies.get('remote_host');
        remote_host = typeof remote_host !== 'undefined' ? remote_host : "";

        if (remote_host == "" || remote_host == "localhost") {
            var statusData = pgcRestApiCall.getCmdData('status');
        } else {
            var statusData = pgcRestApiCall.getCmdData('status --host "' + remote_host + '"');
        }

        // var statusData = pgcRestApiCall.getCmdData('status');
        statusData.then(function (data) {
            componentStatus = getCurrentObject(data, $stateParams.component);
            $rootScope.$emit('componentStatus', componentStatus);
            if (componentStatus != undefined && componentStatus.state != $scope.component.status) {
                callInfo(remote_host);
            }
        });
    }

    // callInfo();
    callStatus();

    statusRefreshRate = $interval(function(){ callStatus(); }, 5000);

    $scope.statusColors = {
        "Stopped": "orange",
        "NotInitialized": "yellow",
        "Running": "green"
    };

    $scope.optionList = [
        {label: "Off", value: "0"},
        {label: "5", value: ""},
        {label: "10", value: "10000"},
        {label: "15", value: "15000"},
        {label: "30", value: "30000"}
    ]

    $scope.opt = {
        interval: ''
    }

    var getCurrentObject = function (list, name) {
        var currentObject;
        for (var i = 0; i < list.length; i++) {
            if (list[i].component == name) {
                currentObject = list[i];
                return currentObject;
            }
        }
    };

    $rootScope.$on('sessionCreated', function () {
        var sessPromise = PubSubService.getSession();
        sessPromise.then(function (sessParam) {
            session = sessParam;
            $rootScope.$emit('topMenuEvent');
        });
    });

    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
        session = val;
        infoRefreshRate = $interval(function(){ callInfo(); }, 60000);
        $scope.component = {};
        callInfo();

        $scope.changeOption = function (value) {
            $rootScope.$emit('refreshRateVal', $scope.opt.interval);
        };

        $scope.autostartChange = function (args) {
            var autoStartVal;
            if (args) {
                autoStartVal = 'on';
            } else {
                autoStartVal = 'off';
            }
            var currentHost = $cookies.get('remote_host');
            if(currentHost == 'localhost' || currentHost == ''){
                session.call('com.bigsql.autostart', [autoStartVal, $stateParams.component]).then(
                    function (sub) {
                        callInfo();
                    });
            }else{
                session.call('com.bigsql.autostart', [autoStartVal, $stateParams.component, currentHost]).then(
                    function (sub) {
                        // callInfo();
                    });   
            }
        }

        $scope.dataBaseTabEvent = function (args) {
            if ($scope.component.status == "Running") {
                session.call('com.bigsql.db_list', [$stateParams.component]);
            }
        };

        $scope.cancelInstallation = function (action) {
            session.call("com.bigsql.cancelInstall", [$scope.currentHost]);
        }

        $scope.openInitPopup = function (comp) {
            var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/pgInitialize.html',
                controller: 'pgInitializeController',
            });
            modalInstance.component = comp;
            modalInstance.autoStartButton = $scope.component.autostart;
            modalInstance.dataDir = '';
            modalInstance.host = $scope.currentHost;
        };

        session.subscribe('com.bigsql.ondblist', function (data) {
            if (data[0].component == $stateParams.component) {
                $scope.myData = data[0].list;
                $scope.gridOptions = {
                    data: 'myData', columnDefs: [{
                        field: "datname", displayName: "Database"
                    }, {
                        field: 'owner', displayName: "Owner"
                    }, {
                        field: 'size',
                        displayName: "Size (MB)",
                        cellClass: 'numberCell',
                        headerTooltip: 'This is the total disk space used by the database, which includes all the database objects like Tables and Indexes within that database',
                        sort: {direction: 'desc', priority: 0}
                    }], enableColumnMenus: false
                };
                $scope.$apply();
            }
        });

        $scope.configureTabEvent = function (args) {
            if ($scope.component.status == "Running") {
                session.call('com.bigsql.pg_settings', [$stateParams.component]);
            }
        };

        session.subscribe('com.bigsql.onPGsettings', function (data) {
            if (data[0].component == $stateParams.component) {
                $scope.settingsData = data[0].list;
                $scope.gridSettings = {
                    expandableRowTemplate: '<div ui-grid="row.entity.subGridOptions" style="height: 140px"></div>',
                };

                $scope.gridSettings.columnDefs = [
                    {field: "name", displayName: 'Category'}
                ];

                $scope.gridSettings.enableColumnMenus = false;

                data = data[0].list;
                for (var i = 0; i < data.length; i++) {
                    data[i].subGridOptions = {
                        columnDefs: [
                            {
                                field: "name",
                                displayName: "Parameter",
                                cellTemplate: '<div class="ui-grid-cell-contents" title="{{row.entity.short_desc}}"><a>{{ COL_FIELD }}</a></div>'
                            },
                            {field: "setting", displayName: "value"},
                            {field: "short_desc", visible: false}],
                        data: data[i].settings,
                        enableColumnMenus: false
                    }
                }
                $scope.gridSettings.data = data;

                $scope.$apply();
            }
        });

        $scope.showTuneData = false;
    
        $scope.showTuningSet = function (argument) {
            $scope.showTuneData = !$scope.showTuneData;
        }

        $scope.securityTabEvent = function (args) {
            session.call('com.bigsql.read_pg_hba_conf', [$stateParams.component]);
        };

        $scope.performanceTabEvent = function (args) {
            $scope.sshPgcInfo = '';
            if ($scope.currentHost == "" || $scope.currentHost == "localhost") {
                var sshHostInfo = pgcRestApiCall.getCmdData('info');
            }else{
                var sshHostInfo = pgcRestApiCall.getCmdData('info --host "'+$scope.currentHost + '"');  
            }
            sshHostInfo.then(function (argument) {
                    $scope.sshPgcInfo = argument[0];
                })
            var userInfo = userInfoService.getUserInfo();
            userInfo.then(function (data) {
                $scope.currentUserMail = data.email;
                session.call('com.bigsql.dbtune', [ $scope.currentUserMail, $stateParams.component])
            })
        };

        session.subscribe('com.bigsql.onDbTune', function (data) {
            var tuneData = JSON.parse(data);
            $scope.tuneResult = tuneData.tune_result;
        })

        session.subscribe('com.bigsql.onPGhba', function (data) {
            if (data[0].component == $stateParams.component) {
                $scope.securityTabContent = data[0].contents;
                $scope.$apply();
            }
        });

        session.subscribe('com.bigsql.onAutostart', function (data) {
            var res = JSON.parse(data[0])[0];
            if (res['status'] == "error") {
                $scope.alerts.push({
                    msg: res['msg'],
                    type: "danger"
                });
            } else if (res['status'] == "completed") {
                $scope.alerts.push({
                    msg: res['msg']
                });
            }
            $scope.$apply();
        }).then(function (sub) {
            subscriptions.push(sub);
        });

        var onRemove = function (response) {
            var data = JSON.parse(response[0])[0];
            if (data.status == "error") {
                var alertObj = {
                    msg: data.msg,
                    type: "danger"
                }
                $scope.alerts.push(alertObj);
                $scope.$apply();
            }
            if (data.status == "complete") {
                callInfo();
            }
        };

        session.subscribe('com.bigsql.onRemove', onRemove).then(
            function (sub) {
                subscriptions.push(sub);
            });


        session.subscribe('com.bigsql.onInit', function (data) {
            var res = JSON.parse(data[0])[0];
            if (res['status'] == 'error') {
                $scope.alerts.push({
                    msg: res['msg'],
                    type: "danger"
                });
            } else {
                $scope.alerts.push({
                    msg: res['msg']
                });
            }
            $scope.$apply();
        }).then(function (sub) {
            subscriptions.push(sub);
        });

        $scope.closeAlert = function (index) {
            $scope.alerts.splice(index, 1);
        };

        
        $scope.releaseTabEvent = function (argument) {
            if($scope.relnotes == undefined || $scope.relnotes == ''){
                var remote_host = $cookies.get('remote_host');
                remote_host = typeof remote_host !== 'undefined' ? remote_host : "";

                if (remote_host == "" || remote_host == "localhost") {
                    var relnotes = pgcRestApiCall.getCmdData('info --relnotes ' + $stateParams.component );
                } else{
                    var relnotes = pgcRestApiCall.getCmdData('info --relnotes ' + $stateParams.component + ' --host "' + remote_host + '"' );
                }             
                relnotes.then(function (data) {
                    $scope.relnotes = $sce.trustAsHtml(data[0].rel_notes);
                });
            }
        }

        session.subscribe('com.bigsql.onActivity', function (data) {
            if (data[0].component == $stateParams.component) {
                var parseData = data[0].activity;
                if (parseData === undefined || parseData.length == 0) {
                    $scope.activities = '';
                    $scope.noActivities = true;
                    activityTab.empty();
                } else {
                    $scope.noActivities = false;
                    $scope.activities = parseData;
                }
            }
        }).then(function (sub) {
            subscriptions.push(sub);
        });

        $scope.openWhatsNew = function () {
        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/whatsNew.html',
            controller: 'whatsNewController',
            size: 'lg',
        });
        modalInstance.component = $stateParams.component;
        modalInstance.version = $scope.component.version;
    }

        $scope.logdirSelect = function () {
            $interval.cancel(infoRefreshRate);
        }

        session.subscribe('com.bigsql.onInstall', function (response) {
            var data = JSON.parse(response[0])[0];
            $scope.component.installation = true;
            if (data.state == "deplist") {
                if (data.deps.length > 1) {
                    dependentCount = data.deps.length;
                    $scope.component.installationDependents = true;
                }
            }
            if (data.status == "start") {
                $scope.component.installationStart = data;
                $scope.component.installation = true;
            }
            if (data.status == "wip") {
                $scope.component.installationRunning = data;
                $scope.component.progress = data.pct;
            }

            if (data.status == "complete" || data.status == "cancelled") {

                if (data.status == "cancelled") {
                    $scope.alerts.push({
                        msg: data.msg,
                        type: 'danger'
                    });
                    delete $scope.component.installationStart;
                    delete $scope.component.installationRunning;
                    delete $scope.component.installation;
                } else if (data.state == 'unpack' || data.state == 'install') {
                    session.call('com.bigsql.infoComponent', [$stateParams.component]);
                    $scope.component.status = 'NotInitialized';
                    $scope.component.installation = false;
                    delete $scope.component.installationStart;
                    delete $scope.component.installationRunning;
                    delete $scope.component.installation;
                    if (data.state == 'unpack') { $scope.openInitPopup($stateParams.component); }
                } else if (data.state == 'update'){
                    callInfo();
                    statusRefreshRate = $interval(function(){ callStatus(); }, 5000);
                    $rootScope.$emit('updatesCheck');
                }

                if (dependentCount != 0) {
                    dependentCount = dependentCount - 1;
                    if (dependentCount == 0) {
                        delete $scope.component.installationDependents;
                    }
                }

            }
            if (data.state == "error") {
                $scope.alerts.push({
                    msg: data.msg,
                    type: 'danger'
                });
                delete $scope.component.installationStart;
                delete $scope.component.installationRunning;
                delete $scope.component.installation;
            }
            $scope.$apply();
        }).then(function (sub) {
            subscriptions.push(sub);
        });
    });

    $rootScope.$on('refreshData', function (argument, host) {
        $scope.loading = true;
        $scope.relnotes = '';
        $interval.cancel(infoRefreshRate);
        callInfo(host);
    });

    $scope.action = function (event) {
        if (event.target.tagName === "A" && event.target.attributes.action != undefined) {
            if (event.target.attributes.action.value == 'init') {
                $scope.component.spinner = 'Initializing..';
            } else if (event.target.attributes.action.value == 'start') {
                $scope.component.spinner = 'Starting..';
            } else if (event.target.attributes.action.value == 'stop') {
                $scope.component.spinner = 'Stopping..';
            } else if (event.target.attributes.action.value == 'remove') {
                $scope.component.spinner = 'Removing..';
            } else if (event.target.attributes.action.value == 'restart') {
                $scope.component.spinner = 'Restarting..';
            }else if (event.target.attributes.action.value == 'install') {
                $scope.component.installation = true;
            } else if(event.target.attributes.action.value == 'update'){
                $interval.cancel(infoRefreshRate);
                $interval.cancel(statusRefreshRate);
            }
            var sessionKey = "com.bigsql." + event.target.attributes.action.value;
            $scope.currentHost = $cookies.get('remote_host');
            if($scope.currentHost == 'localhost' || $scope.currentHost == '' || !$scope.currentHost){
                session.call(sessionKey, [$scope.component.component]);
            }else {
                if (event.target.attributes.action.value == 'install') {
                    $scope.component.installation = true;
                    session.call(sessionKey, [$scope.component.component, false, $scope.currentHost]);
                }else{
                    session.call(sessionKey, [$scope.component.component, $scope.currentHost]);
                }
            } 
            
        }
    };

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $rootScope.$on('initComp', function (event, comp) {
        $scope.component.spinner = 'Initializing..';
    });

    //need to destroy all the subscriptions on a template before exiting it
    $scope.$on('$destroy', function () {
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i]);
        }
        $interval.cancel(infoRefreshRate);
    });

}]);