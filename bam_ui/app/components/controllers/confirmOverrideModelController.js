angular.module('bigSQL.components').controller('confirmOverrideModalController', ['$scope','$rootScope', '$uibModalInstance','MachineInfo', 'PubSubService', '$window', '$http', function ($scope, $rootScope, $uibModalInstance, MachineInfo, PubSubService, $window, $http) {
    $scope.confirmButton = true;
	var session;
    var subscriptions = [];
    var dependentCount = 0;
    $scope.component = {};
    $scope.alerts = [];
    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
        session = val;
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
                } else if (data.state == 'unpack') {
                    session.call('com.bigsql.infoComponent', [$stateParams.component]);
                    $scope.component.status = 'NotInitialized';
                    $scope.openInitPopup($stateParams.component);
                } else if (data.state == 'update'){
                    callInfo();
                    statusRefreshRate = $interval(function(){ callStatus(); }, 5000);
                    $rootScope.$emit('updatesCheck');
                }else if (data.state == 'install'){
                    $scope.component.status = 'Installed';
                    delete $scope.component.installationStart;
                    delete $scope.component.installationRunning;
                    delete $scope.component.installation;
                    $scope.component.installationStatus = data.state;
                    $scope.modelBody = "Installed Successfuly";
                    $uibModalInstance.dismiss('cancel');
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

    $scope.modelBody = $uibModalInstance.modelBody;
    $scope.modalTitle = $uibModalInstance.modalTitle;
    $scope.acceptMethod = $uibModalInstance.acceptMethod;
    $scope.successText = $uibModalInstance.successText;
    $scope.failText = $uibModalInstance.failText;
    $scope.sshHost = $uibModalInstance.sshHost;
    $scope.requiredComponent = $uibModalInstance.component;

    $scope.acceptOverride = function(){
        if($scope.acceptMethod == "initComponentInstall"){
            $scope.installComponentBackground($scope.requiredComponent,$scope.sshHost);
        }else{
            $rootScope.$emit($scope.acceptMethod);
            $scope.cancel();
        }
    }
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    $scope.installComponentBackground = function(component_name,host_name){
        var sessionKey = "com.bigsql.install";
        $scope.confirmButton = false;
        if(host_name == 'localhost' || host_name == '' || !host_name){
           session.call(sessionKey, [component_name]);
        }else {
            session.call(sessionKey, [component_name, false, host_name]);
        }
    };

}]);