angular.module('bigSQL.components').controller('ComponentsUpdateController', ['$scope', '$uibModalInstance', 'PubSubService', 'UpdateComponentsService', 'MachineInfo', '$window', 'pgcRestApiCall', '$rootScope', '$cookies', '$uibModal', '$sce', function ($scope, $uibModalInstance, PubSubService, UpdateComponentsService, MachineInfo, $window, pgcRestApiCall, $rootScope, $cookies, $uibModal, $sce) {

    var session;
    var subscriptions = [];
    $scope.components = {};

    var updateSelectedList = [];
    var currentComponent = {};
    var checkUpdates;
    $scope.currentHost = $cookies.get('remote_host');
    $scope.showText = "More";   
    $scope.alerts = [];
    $scope.updateAll = false;
    $scope.hideNewComponents = true;
    $scope.error = {show : false};

    function getList(argument) {
        argument = typeof argument !== 'undefined' ? argument : "";
        $scope.currentHost = argument;
        if (argument=="localhost" || argument == ''){
            var listData = pgcRestApiCall.getCmdData('list --relnotes');
        } else{
            var listData = pgcRestApiCall.getCmdData('list --relnotes --host "' + argument + '"');
        }
        $scope.loadingSpinner = true;
        $scope.body = false;
        listData.then(function(data) {
            data = $(data).filter(function(i,n){ return n.component != 'bam2' && n.component != 'pgdevops'  ;})
            $scope.loadingSpinner = false;
            $scope.body = true;
            $scope.body = true;
            $scope.noUpdates = true;

            $scope.allComponents = data;
            $scope.hideLatestInstalled = true;

            $scope.components = $(data).filter(function(i,n){ return n.updates>0 ;});
            $scope.totalUpdates = $scope.components.length;
            
            for (var i = 0; i < $scope.components.length; i++) {
                if($scope.components[i].is_current == 0 && $scope.components[i].current_version){
                    $scope.noUpdates = false;
                }
            }

            for (var i = 0; i < $scope.allComponents.length; i++) {
                if ($scope.allComponents[i].category_desc == "Extensions") {
                    $scope.allComponents[i].componentImage = $scope.allComponents[i].component.split('-')[0].replace(/[0-9]/g,'')                    
                }
                $scope.allComponents[i].rel_notes = $sce.trustAsHtml($scope.allComponents[i].rel_notes);
                $scope.allComponents[i].curr_release_date = new Date($scope.allComponents[i].curr_release_date.replace(/-/g,'/')).toString().split(' ',[4]).splice(1).join(' ');
                $scope.allComponents[i].curr_release_date = $scope.allComponents[i].curr_release_date.split(' ')[0] + ' ' + $scope.allComponents[i].curr_release_date.split(' ')[1].replace(/^0+/, '') + ', ' + $scope.allComponents[i].curr_release_date.split(' ')[2];
                if ($scope.allComponents[i].install_date) {
                    $scope.allComponents[i].install_date = new Date($scope.allComponents[i].install_date.replace(/-/g,'/')).toString().split(' ',[4]).splice(1).join(' ');
                    $scope.allComponents[i].install_date = $scope.allComponents[i].install_date.split(' ')[0] + ' ' + $scope.allComponents[i].install_date.split(' ')[1].replace(/^0+/, '') + ', ' + $scope.allComponents[i].install_date.split(' ')[2];
                }
                if($scope.allComponents[i].is_new == 1){
                    $scope.hideNewComponents = true;
                }
                if($scope.allComponents[i].is_updated == 1){
                    $scope.hideLatestInstalled = false;
                }
                if ($scope.noUpdates) {
                    $scope.uibStatus = {
                        newComponents : true,
                        installedComponents : true
                    }
                }else{
                    $scope.uibStatus = {
                        newComponents : false,
                        installedComponents : false
                    }
                }
            }
        });
    };

    var hostsList = pgcRestApiCall.getCmdData('hosts');

    hostsList.then(function (data) {
        if (data.length > 0 && data[0].status == "error") {
            $scope.hosts = [];
        } else {
            $scope.hosts = data;
        }
    });

    var remote_host = $cookies.get('remote_host');
    remote_host = typeof remote_host !== 'undefined' ? remote_host : "";
    if (remote_host == "" || remote_host == undefined) {
        $scope.selecthost = 'localhost';    
    } else {
        $scope.selecthost = remote_host;
    }

    if (UpdateComponentsService.get()) {
        $scope.selectedComp = UpdateComponentsService.get();
    }
    ;

    if (UpdateComponentsService.getCheckUpdates()) {
        checkUpdates = true;
    } else {
        checkUpdates = false;
    }
    
    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
        $scope.updateSettings = MachineInfo.getUpdationMode();
        session = val;
        if (!checkUpdates) {
            $scope.body = true;
            getList($scope.currentHost);
        } else {
            $scope.loadingSpinner = true;
            $scope.body = false;
            if ($scope.selecthost == 'localhost') {
                session.call('com.bigsql.updatesCheck');  
            } else {
                session.call('com.bigsql.updatesCheck', [remote_host]);
            }
        }

        session.subscribe("com.bigsql.onUpdatesCheck", function (argument) {
            var data = JSON.parse(argument[0]);
            if (data[0].state == 'error') {
                $scope.loadingSpinner = false;
                $scope.error.show = true;
                $scope.errorMsg = data[0].msg;
            }else if (data[0].status == 'completed'){
                $scope.error.show = false;
                $scope.loadingSpinner = false;
                $scope.body = true;
                getList($scope.currentHost);
            }
            $scope.$apply();
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        $scope.ok = function () {
            $uibModalInstance.close();
        };

        $scope.cancel = function () {
            $rootScope.$emit('refreshUpdateDate');
            $uibModalInstance.dismiss('cancel');
        };

        var getCurrentComponent = function (name) {
            for (var i = 0; i < $scope.components.length; i++) {
                if ($scope.components[i].component == name) {
                    currentComponent = $scope.components[i];
                    return currentComponent;
                }
            }
        };

        session.subscribe("com.bigsql.onInstall", function (installStream) {
            var data = JSON.parse(installStream[0])[0];
            if (data.status == "start") {
                currentComponent = getCurrentComponent(data.component);
                currentComponent.installationStart = data;
                currentComponent.installation = true;
            } else if (data.status == "wip") {
                currentComponent = getCurrentComponent(data.component);
                currentComponent.installationRunning = data;
                currentComponent.progress = data.pct;
            } else if (data.status == "complete" && data.state == "download") {
                currentComponent = getCurrentComponent(data.component);
                delete currentComponent.installationStart;
                delete currentComponent.installationRunning;
                delete currentComponent.installation;
            } else if (data.status == "complete" && data.state == "update" || data.status == "cancelled") {
                delete currentComponent.installationStart;
                delete currentComponent.installationRunning;
                delete currentComponent.installation;
                if (data.state == 'unpack' || data.state == 'update') {
                    // session.call('com.bigsql.infoComponent', [$scope.currentComponent])
                    $scope.alerts.push({
                            msg:  data.msg,
                            type: 'success'
                        });
                } 
                if (data.status == "cancelled") {
                        $scope.alerts.push({
                            msg:  data.msg,
                            type: 'danger'
                        });
                }
                angular.element(document.querySelector('#' + currentComponent.component)).remove();
                if ($scope.totalUpdates == 1 ) {
                    // session.call("com.bigsql.getBamConfig");
                    $uibModalInstance.dismiss('cancel');
                    $rootScope.$emit('updatesCheck');
                }
                // if($scope.updateAll){
                //     $scope.components.splice($scope.components.length-1, 1);
                // }
                if ($scope.updateAll && $scope.totalUpdates ==1) {
                    $rootScope.$emit('refreshUpdateDate');
                    $rootScope.$emit('refreshUpdates');
                }
                if (data.status != "cancelled") {
                    $scope.totalUpdates = $scope.totalUpdates - 1;
                }
            }
            if (data.state == "error") {
                delete currentComponent.installationStart;
                delete currentComponent.installationRunning;
                delete currentComponent.installation;
                $scope.alerts.push({
                    msg: data.msg,
                    type: 'danger'
                });
            }
            $scope.$apply();
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        $scope.compAction = function (action, compName) {
            var sessionKey = "com.bigsql." + action;
            if($scope.currentHost == 'localhost' || $scope.currentHost == ''){
                session.call(sessionKey, [compName]);
            }else {
                session.call(sessionKey, [compName, $scope.currentHost]);
                // var event_url =  'upgrade/' + compName + '/' + $scope.currentHost ;
                // var eventData = pgcRestApiCall.getCmdData(event_url);
                // eventData.then(function(data) {
                //     getList($scope.currentHost);
                // });
            }
        };

        // var selUpdatedComp = [];

        $scope.selectedUpdate = function (comp) {
            if (comp) {
                $scope.compAction('update', comp);
            }else{
                $scope.compAction('update', '');
                $scope.updateAll = true;
            }
        };

    });

    $scope.changeHeight = function (argument) {
       var myDiv = document.getElementById('relnotesId_'+argument);
       var text = document.getElementById('showText_'+argument);
       if(myDiv.style.height == '100px'){
            myDiv.style.height = '300px';
            text.innerHTML = "Less..."
       }else{
            myDiv.style.height = '100px';
            text.innerHTML = "More..."
       }
       // $scope.showText = "Less";
    }

    $scope.changeHeightInstalled = function (argument) {
       var myDiv = document.getElementById('installedRelnotes_'+argument);
       var text = document.getElementById('installedshowText_'+argument);
       if(myDiv.style.height == '100px'){
            myDiv.style.height = '300px';
            text.innerHTML = "Less..."
       }else{
            myDiv.style.height = '100px';
            text.innerHTML = "More..."
       }
       // $scope.showText = "Less";
    }

    $scope.changeHeightReleased = function (argument) {
       var myDiv = document.getElementById('releasedRelnotesId_'+argument);
       var text = document.getElementById('releasedShowText_'+argument);
       if(myDiv.style.height == '100px'){
            myDiv.style.height = '300px';
            text.innerHTML = "Less..."
       }else{
            myDiv.style.height = '100px';
            text.innerHTML = "More..."
       }
       // $scope.showText = "Less";
    }

    $scope.openDetailsModal = function (comp) {
        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/details.html',
            // windowClass: 'comp-details-modal',
            size : 'lg',
            controller: 'ComponentDetailsController',
            keyboard  : false,
            backdrop  : 'static',
        });
        modalInstance.component = comp;
        modalInstance.isExtension = true;
    };

    $scope.hostChange = function (host) {
        $scope.loadingSpinner = true;
        $scope.body = false;
        getList(host);
    };

    $scope.cancelInstallation = function (action) {
        session.call("com.bigsql.cancelInstall", [$scope.currentComponent]);
        getList($scope.currentHost);
    }

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };


    /**
     Unsubscribe to all the apis on the template and scope destroy
     **/
    $scope.$on('$destroy', function () {
        $rootScope.$emit('refreshUpdateDate');
        $rootScope.$emit('refreshUpdates');
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i]);
        }

    });

}]);
