angular.module('bigSQL.components').controller('profilerController', ['$scope', '$uibModal', 'PubSubService', '$state', 'UpdateComponentsService', '$filter', '$rootScope', '$timeout', '$window', '$http', '$location', 'bamAjaxCall', 'pgcRestApiCall', '$cookies', 'userInfoService', 'htmlMessages', function ($scope, $uibModal, PubSubService, $state, UpdateComponentsService, $filter, $rootScope, $timeout, $window, $http, $location, bamAjaxCall, pgcRestApiCall, $cookies, userInfoService, htmlMessages) {

    $scope.alerts = [];
    $scope.successAlerts = [];
    $scope.extensionAlerts = [];

    var subscriptions = [];
    $scope.components = {};

    var session;
    $scope.updateSettings;
    $scope.loading = true;
    $scope.retry = false;
    $scope.disableShowInstalled = false;
    $scope.component;
    $scope.enableBtns = false;
    $scope.disableAbout = false;
    $scope.refreshingFields = false;

    $rootScope.$on('sessionCreated', function () {
        var sessPromise = PubSubService.getSession();
        sessPromise.then(function (sessParam) {
            session = sessParam;
        });
    });

    var infoData = bamAjaxCall.getCmdData('getrecentreports/profiler');
    infoData.then(function (data) {
        var files_list = data.data;
        if(files_list.length > 0){
            $scope.report_file = files_list[0].file_link.replace('reports/','');
            $scope.report_url = files_list[0].file_link;
        }
    });   

    function getInstanceInfo(comp) {
    
        var instanceInfo = pgcRestApiCall.getCmdData('status '+ comp);
        instanceInfo.then(function (argument) {
            $scope.pgPort = argument.port;
        })
    }

    function checkplProfilerStatus(argument) {
        var compStatus = pgcRestApiCall.getCmdData('info '+ $scope.component);
            compStatus.then(function (data) {
                if (data[0].is_installed == 0) {
                    $scope.disableDatabases = true;
                    if (!$scope.devRole) {
                        $scope.alerts.push({
                            msg:  $scope.component + ' is not Installed yet. ',
                            type: 'danger',
                            pgComp: false,
                            devRole: false
                        });
                    }else{
                        $scope.alerts.push({
                            msg: htmlMessages.getMessage('plprofiler-dev-role') ,
                            type: 'danger',
                            devRole: true
                        });
                    }
                }else{
                    $scope.disableDatabases = false;
                    $scope.enableBtns = true;
                    session.call('com.bigsql.db_list', [$scope.selectComp]);
                }
            });
    }

    $scope.onSelectChange = function (argument) {
        $scope.extensionAlerts.splice(0,1);
        $scope.successAlerts.splice(0,1);
        localStorage.setItem('selectedCluster', argument);
        $scope.alerts.splice(0, 1);
        $scope.selectDatabase = '';
        if(argument){
            $scope.component = 'plprofiler3-'+argument;
            checkplProfilerStatus();
            getInstanceInfo(argument);
        }
    }

    $scope.onDatabaseChange = function (argument) {
        $scope.extensionAlerts.splice(0,1);
        if (argument) {
            localStorage.setItem('selectedDatabase', JSON.stringify({'database': argument, 'component': $scope.selectComp}));   
            session.call('com.bigsql.checkExtension', [
                argument, $scope.selectComp, 'plprofiler'
            ]);
            session.call('com.bigsql.plprofiler', [
                $scope.hostName, '',
                $scope.pgPort, argument,
                '', $scope.pgQuery,
                $scope.pgTitle, $scope.pgDesc,
                "check", $scope.selectComp
            ]);
        }
    }

    $scope.createExtension = function (argument) {
        $scope.extensionAlerts.splice(0,1);
        session.call('com.bigsql.createExtension', [
                $scope.selectDatabase, $scope.selectComp, 'plprofiler'
            ]);
    }

    $rootScope.$on('refreshPage',function (argument) {
        $window.location.reload();
    } );

    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
        session = val;
        $scope.devRole = false;
        var checkUserRole = userInfoService.getUserRole();
        checkUserRole.then(function (data) {
          if(data.data.code == 1){
            $scope.devRole = true;
          }
          session.call('com.bigsql.checkLogdir');
        });


        session.subscribe("com.bigsql.onCheckLogdir", function (components) {
            var selectedCluster = localStorage.getItem('selectedCluster');
            $scope.components = JSON.parse(components[0]);
            if($scope.components.length == 1){
                $scope.selectComp = $scope.components[0].component;
                $scope.onSelectChange($scope.selectComp);
                $scope.component = 'plprofiler3-'+ $scope.selectComp;
                // session.call('com.bigsql.db_list', [$scope.selectComp]);
                getInstanceInfo($scope.selectComp);
                // localStorage.setItem('runningPostgres');
            }else if($scope.components.length > 1 && selectedCluster){
                $scope.selectComp = selectedCluster;
                $scope.onSelectChange(selectedCluster);
            }else if($scope.components.length <= 0){
                $scope.disableAbout = true;
                if (!$scope.devRole) {
                    $scope.alerts.push({
                        msg:  "No Postgres component Installed/ Initialized.",
                        type: 'danger',
                        pgComp: true,
                        devRole: false
                    });
                }else{
                    $scope.alerts.push({
                        msg:  htmlMessages.getMessage('postgres-notinstalled-dev-role'),
                        type: 'danger',
                        pgComp: true,
                        devRole: true
                    });
                }
            }
            $scope.refreshingFields = false;
            $scope.$apply();
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        session.subscribe("com.bigsql.onCheckExtension", function (data) {
            if (!data[0].status) {
                $scope.extensionAlerts.push({
                        msg:  'plprofiler extension is not enabled on ' + $scope.selectDatabase + ' database. Do you want to enable?',
                        type: 'warning',
                        showBtns : true,
                    });
                $scope.$apply();
            }
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        session.subscribe("com.bigsql.onCreateExtension", function (data) {
            if (data[0].status) {
                $scope.extensionAlerts.push({
                        msg:  'Successfully created plprofiler extension.',
                        type: 'success',
                        showBtns: false,
                    });
                $scope.$apply();
            }
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        session.subscribe('com.bigsql.ondblist', function (data) {
            try{
                var selectedDatabase = JSON.parse(localStorage.getItem('selectedDatabase'));
            }catch(e){
                var selectedDatabase = '';
            }
            if (data[0].error) {
                $scope.successAlerts.push({
                    msg: data[0].error,
                    type: 'danger',
                });
            }
            for (var i = data.length - 1; i >= 0; i--) {
                if ($scope.selectComp == data[i].component) {
                    $scope.databases = data[i].list;
                    if (selectedDatabase.database && data[i].component == selectedDatabase.component) {
                        for (var i = $scope.databases.length - 1; i >= 0; i--) {
                            if (selectedDatabase.database == $scope.databases[i].datname) {
                                $scope.onDatabaseChange(selectedDatabase.database);
                                $scope.selectDatabase = selectedDatabase.database;
                            }
                        }
                    }
                }
            }
            $scope.$apply();
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        session.subscribe("com.bigsql.profilerReports", function (data) {
            $scope.generatingReportSpinner=false;
            $scope.errorMsg = '';
            var result=data[0];
            if(data[0].action == 'check'){
                $scope.status = data[0];
            }
            if (result.error == 0) {

                if(result.action == "profile_query" || result.action == "generate"){
                    $scope.report_file = result.report_file;
                    $scope.report_url = "/reports/" + result.report_file;
                    $scope.successAlerts.push({
                        msg:  'Your report has been generated, please see below.',
                        type: 'success',
                        pgComp: false,
                        devRole : false
                    });
                }
                else{
                    // $scope.errorMsg = result.msg;

                }
            } else {
                // $scope.errorMsg = result.msg;
            }
            $scope.$apply();

        }).then(function (subscription) {
            subscriptions.push(subscription);
        });
    });

    $scope.refreshFields = function (argument) {
        $scope.refreshingFields = true;
        $timeout( refreshFields, 1000);
    }

    function refreshFields(argument) {
        session.call('com.bigsql.checkLogdir');
    }
    $scope.hostName = 'localhost';

    $scope.generateReport = function () {
        $scope.report_file = "";
        $scope.report_url = "";

        $scope.generatingReportSpinner=true;


        session.call('com.bigsql.plprofiler', [
            $scope.hostName, $scope.pgUser,
            $scope.pgPort, $scope.pgDB,
            $scope.pgPass, $scope.pgQuery,
            $scope.enableProfiler, $scope.enableProfiler,
            $scope.pgTitle, $scope.pgDesc
        ]);

    };

    $scope.openRecentReports = function (argument) {
        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/recentReports.html',
            controller: 'recentReportsController',
            windowClass: 'switch-modal-window'
        });
        modalInstance.reportsType="profiler";
        modalInstance.comp = $scope.selectComp;
    };

    $scope.queryProfiler = function (hostName, pgUser, pgPass, pgDB, pgPort) {
        $scope.alerts.splice(0, 1);
        $scope.extensionAlerts.splice(0,1);
        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/statementProfilingModal.html',
            controller: 'statementProfilingController',
        });
        modalInstance.hostName = hostName;
        modalInstance.pgUser = '';
        modalInstance.pgPass = '';
        modalInstance.pgDB = $scope.selectDatabase;
        modalInstance.pgPort = pgPort;
        modalInstance.comp = $scope.selectComp;
    };

    $scope.globalProfiling = function (hostName, pgUser, pgPass, pgDB, pgPort) {
        $scope.alerts.splice(0, 1);
        $scope.extensionAlerts.splice(0,1);
        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/globalProfilingModal.html',
            controller: 'globalProfilingController',
        });
        modalInstance.hostName = hostName;
        modalInstance.pgUser = '';
        modalInstance.pgPass = '';
        modalInstance.pgDB = $scope.selectDatabase;
        modalInstance.pgPort = pgPort;
        modalInstance.comp = $scope.selectComp;
    };

    $scope.openDetailsModal = function (comp) {
        if(!$scope.disableAbout){
            $scope.alerts.splice(0, 1);
            $scope.extensionAlerts.splice(0,1);
            var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/details.html',
                // windowClass: 'comp-details-modal',
                size: 'lg',
                controller: 'ComponentDetailsController',
                keyboard  : false,
                backdrop  : 'static',
            });
            modalInstance.component = $scope.component;
            modalInstance.isExtension = true;
        }
    };

    $scope.closeAlert = function (index) {
        $scope.successAlerts.splice(index, 1);
        $scope.alerts.splice(index, 1);
        $scope.extensionAlerts.splice(index,1);
    };

    $scope.clearCookies = function(argument){
        $cookies.remove('remote_host');
        $cookies.remove('openedExtensions');
    };

    //need to destroy all the subscriptions on a template before exiting it
    $scope.$on('$destroy', function () {
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i])
        }
    });
}]);

