angular.module('bigSQL.components').controller('badgerController', ['$scope', '$uibModal', 'PubSubService', '$state', 'UpdateComponentsService', '$filter', '$rootScope', '$timeout', '$window', '$http', '$location', 'bamAjaxCall', 'pgcRestApiCall', '$cookies', 'userInfoService', 'htmlMessages', function ($scope, $uibModal, PubSubService, $state, UpdateComponentsService, $filter, $rootScope, $timeout, $window, $http, $location, bamAjaxCall, pgcRestApiCall, $cookies, userInfoService, htmlMessages) {

    $scope.alerts = [];
    $scope.checkedFirst = false;

    var subscriptions = [];
    $scope.components = {};
    $scope.disableLog = true;
    $scope.generatingReportSpinner = false;
    $scope.autoSelectLogFile;
    $scope.selectedCurrentLogfile;
    $scope.refreshMsg= false;
    $scope.checked = false;
    $scope.showBgProcess = false;

    var session;
    $scope.updateSettings;
    $scope.loading = true;
    $scope.retry = false;
    $scope.disableShowInstalled = false;
    $scope.badgerInstalled = false;
    $scope.disableGenrate = true;

    $rootScope.$on('sessionCreated', function () {
        var sessPromise = PubSubService.getSession();
        sessPromise.then(function (sessParam) {
            session = sessParam;
        });
    });

    $scope.devRole = false;
    var checkUserRole = userInfoService.getUserRole();
    checkUserRole.then(function (data) {
      if(data.data.code == 1){
        $scope.devRole = true;
      }
    })

    $rootScope.$on('refreshPage',function (argument) {
        $window.location.reload();
    } );

    $rootScope.$on('refreshBadgerReports', function (argument) {
        getReports();
        $scope.disableGenrate = false;
        // $scope.showBgProcess = false;
    })

    $rootScope.$on('hidebgProcess', function (argument) {
        $scope.showBgProcess = false;
    })
    var infoCmd = pgcRestApiCall.getCmdData('info');
    infoCmd.then(function (data) {
        $scope.maxNumJobs = [];
        for (var i = 1 ; i <= data[0].cores; i++) {
            $scope.maxNumJobs.push(i.toString());
        }
        
        if(localStorage.getItem('pgJobsCookie')){
            $scope.pgJobs = localStorage.getItem('pgJobsCookie');
        }else{
            $scope.pgJobs = Math.round(data[0].cores/2).toString();            
        }
        if ($scope.maxNumJobs.length == 0) {
            $scope.maxNumJobs = ['1']
        }
    });

    var serverStatus = pgcRestApiCall.getCmdData('status');
        serverStatus.then(function (data) {
            var noPostgresRunning = false;
            for (var i = data.length - 1; i >= 0; i--) {
                if ((data[i].state == "Running" || data[i].state == "Stopped") && data[i].category == "1") {
                    noPostgresRunning = true;
                }
            }
            if(!noPostgresRunning){
                $scope.disableGenrate = true;
                var msg = "No Postgres component Installed/ Initialized.";
                if($scope.devRole){
                    msg = htmlMessages.getMessage('postgres-notinstalled-dev-role');
                }
                $scope.alerts.push({
                    msg:  msg,
                    type: 'danger',
                    pgComp: true,
                    devRole: $scope.devRole
                });
            }else{
                var compStatus = pgcRestApiCall.getCmdData('info pgbadger');
                compStatus.then(function (data) {
                    if (data[0].is_installed != 0) {
                        $scope.badgerInstalled = true;
                        $scope.disableGenrate = false;
                    }else{
                        $scope.disableGenrate = true;
                        var msg = 'pgBadger is not Installed. ';
                        if($scope.devRole){
                            msg = htmlMessages.getMessage('pgbadger-dev-role');
                        }
                        $scope.alerts.push({
                            msg:  msg,
                            type: 'danger',
                            pgComp: false,
                            devRole: $scope.devRole
                        });
                    }
                });
            }
        });    

    $scope.logFileChecked = function () {
        $scope.selectedLog = false;
        angular.forEach($scope.logfiles, function (item) {
            if(item.selected){
                $scope.selectedLog = true;
            }
        });
    }

    $scope.onSelectChange = function (comp) {
        $scope.pgNotRunning = false;
        if(comp){
            session.call('com.bigsql.get_log_files_list', [comp]);
            session.call('com.bigsql.infoComponent', [comp]);
            session.subscribe('com.bigsql.onInfoComponent', function (args) {
                var data = JSON.parse(args[0][0])[0]
                $scope.logDir = data.logdir;
                if (data.status == "Stopped") {
                    $scope.pgNotRunning = true;
                }else{
                    $scope.pgNotRunning = false;
                }
                $scope.$apply();
            });
            localStorage.setItem('selectedDB', comp);  
        }else{
            $scope.disableLog = true;
            $scope.logfiles = [];
            $scope.logDir = '';
            localStorage.setItem('selectedDB', '');
        }
        
    };

    function getReports(argument) {

        var infoData = bamAjaxCall.getCmdData('getrecentreports/badger');
        infoData.then(function (data) {
            var files_list = data.data;
            if(files_list.length == 0){
                $scope.showReports = false;
            }else{
                $scope.files_list=files_list; 
                $scope.showReports = true; 
                for (var i = $scope.files_list.length - 1; i >= 0; i--) {
                    $scope.files_list[i].selected = false;
                }              
            }
        });

    }

    getReports();

    function checkBGprocess(argument) {
        var getbgProcess = bamAjaxCall.getCmdData('bgprocess_list/pgBadger Report');
        getbgProcess.then(function (argument) {
            if (argument.process) {
                for (var i = argument.process.length - 1; i >= 0; i--) {
                    if (!argument.process[i].process_completed) {
                        $scope.showBgProcess = true;
                        $rootScope.$emit('backgroundProcessStarted', argument.process[i].process_log_id);
                        $scope.disableGenrate = true;
                    }
                }
            }
        })
    }

    checkBGprocess();

    $scope.refreshReports = function (argument) {
    getReports();

    }
    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
        session = val;
        
        session.call('com.bigsql.checkLogdir');

        session.subscribe("com.bigsql.onCheckLogdir", function (components) {
            $scope.components = JSON.parse(components[0]);
            var selectedDB = localStorage.getItem('selectedDB');
            if($scope.components.length == 1){
                $scope.selectComp = $scope.components[0].component;
                $scope.onSelectChange($scope.selectComp);
            }else if (selectedDB) {
                $scope.selectComp = selectedDB;
                $scope.onSelectChange(selectedDB);
            }
            $scope.$apply();
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        session.subscribe("com.bigsql.log_files_list", function (data) {
            $scope.logfiles = JSON.parse(data[0]);
            $scope.disableLog = false;
            for (var i = 0; i <= $scope.logfiles.length; i++) {
                $scope.logfiles[i]['selected'] = false;
                if(i==0){
                    $scope.logfiles[i]['selected'] = true;
                    $scope.selectedLog = true;  
                }
            }
            $scope.apply();

        });
    });

    $scope.openLoggingParam = function (argument) {
        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/loggingParam.html',
            controller: 'loggingParamController',
            windowClass: 'app-modal-window'
        });
        modalInstance.comp=$scope.selectComp;
    };

    $scope.openSwitchlog = function (argument) {
        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/switchLogfile.html',
            controller: 'switchLogfileController',
            windowClass: 'switch-modal-window'
        });
        modalInstance.comp=$scope.selectComp;
        modalInstance.currentLogfile = $scope.logfiles[0].file;
    };


    $scope.openGenerateModal = function (argument) {
        $scope.disableGenrate = true;
        $scope.report_file = "";
        $scope.report_url = "";
        var pgJobs;
        var selectedFiles = [];
        var totalSize = 0;
        var smallFiles = [];
        var selectLog = document.getElementsByName("selectLog");
        for (var i=0;i<selectLog.length; i++){
            if(selectLog[i].checked){
                var units = selectLog[i].value.split('; ')[1].split(' ')[1];
                totalSize += parseInt(selectLog[i].value.split('; ')[1].split(' ')[0]);
                if (units == 'B' || (units == 'KB' && totalSize<=2)) {
                    smallFiles.push(selectLog[i].value.split('; ')[0])
                } 
                selectedFiles.push(selectLog[i].value.split('; ')[0]);
            }
        }

        if ($scope.pgJobs) {
            pgJobs = $scope.pgJobs.toString();
        }else{
            pgJobs = '0';
        }
        localStorage.setItem('pgJobsCookie', pgJobs);
        var args={
                    "log_files": selectedFiles,
                    "db":       $scope.pgDB,
                    "jobs":   pgJobs,
                    "log_prefix": $scope.pgLogPrefix,
                    "title":$scope.pgTitle
            };

        if (smallFiles.length < 1) {
            var generateReports = $http.post($window.location.origin + '/api/generate_badger_reports', args);
            generateReports.then(function (argument) {
                $scope.generatingReportSpinner = false;
                if (argument.data.in_progress){
                    // getBGStatus(argument.data.process_log_id);
                    $scope.showBgProcess = true;
                    $rootScope.$emit('backgroundProcessStarted', argument.data.process_log_id);
                    $scope.disableGenrate = true;
                } else{
                    $scope.report_file = argument.data.report_file;
                    $scope.report_url = "/reports/" + argument.data.report_file;
                }
            });
        } else{
            $scope.disableGenrate = false;
            var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/generateBadgerReport.html',
                controller: 'generateBadgerReportController',
                windowClass: 'switch-modal-window',
                backdrop  : 'static',
                keyboard  : false
            });
            modalInstance.selectedFiles = selectedFiles;
            modalInstance.pgTitle = $scope.pgTitle;
            modalInstance.pgDB = $scope.pgDB;
            modalInstance.pgJobs = pgJobs;
            modalInstance.pgLogPrefix = $scope.pgLogPrefix;
            modalInstance.smallFiles = smallFiles;
        }
    };

    $scope.model = {
        selectedLabelList : []
    }
    $scope.options = {
        master : false
    }

    $scope.toggleAll = function() { 
        $scope.model = {
            selectedLabelList : []
        }
        if($scope.options.master){
            $scope.options.master = true;
            for(var i=0;i<$scope.files_list.length;i++){
                $scope.model.selectedLabelList.push($scope.files_list[i].file);       
            }
        }else{$scope.options.master = false;}
        angular.forEach($scope.files_list, function (item) {
                item.selected = $scope.options.master;
        });
    }
      
    $scope.optionToggled = function(){
        $scope.checked = false;
        var _name = this.option.file;
        if(this.option.selected){
            $scope.model.selectedLabelList.push(_name);
            if($scope.model.selectedLabelList.length == $scope.files_list.length ){$scope.options.master = true;}
        }else{
            $scope.options.master = false;
            var index = $scope.model.selectedLabelList.indexOf(_name);
            $scope.model.selectedLabelList.splice(index, 1);
        }
        if ($scope.model.selectedLabelList.length > 0) {
           $scope.checked = true; 
        }
    }

    $scope.deleteReports = function (files, selectAll) {
        var deleteFiles = [];
        if(selectAll){
            for (var i = files.length - 1; i >= 0; i--) {
                deleteFiles.push(files[i].file);
            }
        }else{
            for (var i = files.length - 1; i >= 0; i--) {
                if(files[i].selected){
                    deleteFiles.push(files[i].file);
                }
            }            
        }
        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/confirmDeletionModal.html',
            controller: 'confirmDeletionModalController',
        });
        modalInstance.deleteFiles = deleteFiles;
        modalInstance.comp = 'pgbadger';
    }

    $rootScope.$on('updateReports', function (argument) {
        getReports();
    })

    $scope.refreshLogfiles = function (comp) {
        $scope.refreshMsg = true;
        $timeout(function() {
            session.call('com.bigsql.get_log_files_list', [comp]);
            $scope.refreshMsg = false;
        }, 1000);
    }

    $rootScope.$on('switchLogfile', function (argument, fileName, comp) {
        $scope.autoSelectLogFile = fileName;
        session.call('com.bigsql.get_log_files_list', [comp]);
    });

    $rootScope.$on('updateReports', function (argument) {
        getReports();
    })

    $rootScope.$on('switchLogfileError', function (argument, error) {
        $scope.badgerError = error.status;
    });

    $scope.openDetailsModal = function (comp) {
        $scope.alerts.splice(0, 1);
        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/details.html',
            // windowClass: 'comp-details-modal',
            size : 'lg',
            controller: 'ComponentDetailsController',
            keyboard  : false,
            backdrop  : 'static',
        });
        modalInstance.component = 'pgbadger';
        modalInstance.isExtension = true;
    };

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
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

