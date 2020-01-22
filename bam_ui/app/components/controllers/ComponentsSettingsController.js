angular.module('bigSQL.components').controller('ComponentsSettingsController', ['$rootScope', '$scope', '$uibModal', 'PubSubService', 'MachineInfo', 'UpdateComponentsService', '$window', 'pgcRestApiCall', '$cookies', '$sce', 'htmlMessages', '$timeout', function ($rootScope, $scope, $uibModal, PubSubService, MachineInfo, UpdateComponentsService, $window, pgcRestApiCall, $cookies, $sce, htmlMessages, $timeout) {
    $scope.alerts = [];

    var session;
    var subscriptions = [];
    $scope.updateSettings;
    $scope.components = {};
    $scope.currentHost;
    $scope.showPgDgFeature = false;
    $scope.settingsOptions = [{name:'Weekly'},{name:'Daily'},{name:'Monthly'}]

    $scope.open = function (manual) {
        UpdateComponentsService.set('');
        if (manual == "manual") {
            UpdateComponentsService.setCheckUpdatesManual();
        } else {
            UpdateComponentsService.setCheckUpdatesAuto();
        }

        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/updateModal.html',
            windowClass: 'comp-details-modal',
            controller: 'ComponentsUpdateController',
        });
    };

    $scope.openFeedbackForm = function (lab, disp_name) {
        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/feedbackForm.html',
            controller: 'feedbackFormController',
        });
        modalInstance.lab = lab;
        modalInstance.disp_name = disp_name;
    };

    $scope.lastUpdateNone = htmlMessages.getMessage('last-update-none');
    $scope.notSupported = htmlMessages.getMessage('windows-not-supported');
    // var infoData = pgcRestApiCall.getCmdData('info')
    // infoData.then(function(data) {
    //     $scope.pgcInfo = data[0];
    //     if (data[0].last_update_utc) {
    //         $scope.lastUpdateStatus = new Date(data[0].last_update_utc.replace(/-/g, '/') + " UTC").toString().split(' ',[5]).splice(1).join(' ');
    //     }
    //     if (MachineInfo.getUpdationMode() == "manual") {
    //         $scope.settingType = 'manual';
    //     } else {
    //         $scope.settingType = 'auto';
    //         session.call('com.bigsql.get_host_settings');
    //     }

    // });

    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
        $rootScope.$emit('topMenuEvent');
        session = val;

        session.call('com.bigsql.getBetaFeatureSetting', ['hostManager']);
        session.call('com.bigsql.getBetaFeatureSetting', ['pgdg']);

        session.subscribe("com.bigsql.onGetBeataFeatureSetting", function (settings) {
            if(settings[0].setting == 'hostManager'){
                if (settings[0].value == '0' || !settings[0].value) {
                    $scope.hostManager = false; 
                }else{
                    $scope.hostManager = true;
                }
            }else if(settings[0].setting == 'pgdg'){
                if (settings[0].value == '0' || !settings[0].value) {
                    $scope.pgdg = false; 
                }else{
                    $scope.pgdg = true;
                }
            }
           $scope.$apply();
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        $scope.updateManualSettings = function () {
            session.call('com.bigsql.update_host_settings', ['localhost', "None", '']).then(
                function (subscription) {
                    session.call('com.bigsql.get_host_settings').then(
                        function (sub) {
                            MachineInfo.setUpdationMode(sub);
                            var data = "Update settings has been set to Manual";
                            $scope.alerts.push({
                                msg: data
                            });
                            $scope.$apply();
                        });
                });
        };

        $scope.onAutomaticOptionSelection = function (value) {
            session.call('com.bigsql.update_host_settings', ['localhost', $scope.automaticSettings.name, '']).then(
                function (subscription) {
                    session.call('com.bigsql.get_host_settings').then(
                        function (sub) {
                            MachineInfo.setUpdationMode(sub);
                            var data = "Update settings has been set to " + sub.interval + ", next update is on " + sub.next_update_utc;
                            $scope.alerts.push({
                                msg: data
                            });
                            $scope.$apply();
                        });
                });
        };

        $scope.closeAlert = function (index) {
            $scope.alerts.splice(index, 1);
        };

        $scope.changeBetaFeature = function (name, setting) {
            var value, msg, type;
            if(setting){
                value = '1';
                msg = name + " feature is enabled.";
                type = 'success';
            }else{
                value = '0';
                msg = name + " feature is disabled.";
                type = 'warning';
            }
            session.call('com.bigsql.setBetaFeatureSetting', [name, value]);
            $scope.alerts.push({
                msg : msg,
                type : type
            });
        }

    });

    function getInfo(argument) {
        $scope.loading = true;
        argument = typeof argument !== 'undefined' ? argument : "";
        $scope.currentHost = argument;
        if (argument=="" || argument == 'localhost'){
            var infoData = pgcRestApiCall.getCmdData('info');
            var checkpgdgSupport = pgcRestApiCall.getCmdData('info');
        } else{
            var infoData = pgcRestApiCall.getCmdData('info --host "' + argument + '"');
            var checkpgdgSupport = pgcRestApiCall.getCmdData('info --host "'+  argument + '"');
        }
        var getLablist = pgcRestApiCall.getCmdData('lablist');

        infoData.then(function(data) {
            if(data == "error"){
                $timeout(wait, 5000);
                $scope.loading = false;
            }else if (data[0].state == 'error') {
                $scope.loading = false;
                $scope.pgcNotAvailable = true;
                $scope.errorData = data[0];
            } else {
                $scope.pgcNotAvailable = false;
                $scope.loading = false;
                $scope.pgcInfo = data[0];
                if (data[0].last_update_utc) {
                    var l_date = new Date(data[0].last_update_utc.replace(/-/g, '/') + " UTC").toString().split(' ',[5]).splice(1).join(' ');
                    $scope.lastUpdateStatus = l_date.split(' ')[0] + ' ' + l_date.split(' ')[1].replace(/^0+/, '') + ', ' + l_date.split(' ')[2] + ' ' + l_date.split(' ')[3]
                }
                if (MachineInfo.getUpdationMode() == "manual") {
                    $scope.settingType = 'manual';
                } else {
                    $scope.settingType = 'auto';
                    session.call('com.bigsql.get_host_settings');
                }
            }
        });
       
        getLablist.then(function function_name(argument) {
            $scope.lablist = argument;
            for (var i = $scope.lablist.length - 1; i >= 0; i--) {
                $scope.lablist[i]['markdownDesc'] = $sce.trustAsHtml($scope.lablist[i].short_desc);
            }
        })
    };

    $scope.discoverRds = function (settingName, value, disp_name) {
        if (settingName == 'aws' && (value == 'on' || value=='')) {
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
        }
    }

    $scope.changeSetting = function (settingName, value, disp_name) {
        if ((settingName == 'aws' || settingName == 'azure') && value == "on" && $scope.pgcInfo.platform == 'win') {
            this.lab.enabled = "";
            $scope.alerts.push({
                msg: $scope.notSupported,
                type: 'warning'
            });
        }else{
            if (settingName == 'aws') {
                $rootScope.$emit('hideAwsNav', value);
            }else if(settingName == 'dumprest'){
                $rootScope.$emit('hideBackupRestoreNav', value);
            }else if(settingName == 'azure'){
                $rootScope.$emit('hideAzureNav', value);
            }else if(settingName == 'vmware'){
                $rootScope.$emit('hidevmWareNav', value);
            }
            if (value) {
                session.call('com.bigsql.setLabSetting', [settingName, value]);            
            }
        }
        setTimeout(function () {
            var refreshLablist = pgcRestApiCall.getCmdData('lablist');
            refreshLablist.then(function function_name(argument) {
                $scope.lablist = argument;
                for (var i = $scope.lablist.length - 1; i >= 0; i--) {
                    $scope.lablist[i]['markdownDesc'] = $sce.trustAsHtml($scope.lablist[i].short_desc);
                }
            });
        }, 2000);
    }

    $scope.openCredentialManager = function (argument) {
        var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/credentialManager.html',
                controller: 'credentialManagerController',
                keyboard  : false,
                backdrop  : 'static',
                // size : 'lg'
            });
    }

    $rootScope.$on('refreshUpdateDate', function (argument) {
       // $window.location.reload(); 
       getInfo();
    });

    getInfo($cookies.get('remote_host'));

     $rootScope.$on('refreshData', function (argument, host) {
        $scope.currentHost = host;
        getInfo(host);
    });

    $scope.refreshData=function(hostArgument){
        $scope.currentHost = hostArgument;
        getInfo(hostArgument);
    };

    function wait() {
            $window.location.reload();
        };

    $rootScope.$on('disableLab', function (argument, lab, val) {
        session.call('com.bigsql.setLabSetting', [lab, val]);
    })


    /**
     Unsubscribe to all the apis on the template and scope destroy
     **/
    $scope.$on('$destroy', function () {
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i]);
        }

    });

}]);