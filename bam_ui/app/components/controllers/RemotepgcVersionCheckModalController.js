angular.module('bigSQL.components').controller('RemotepgcVersionCheckModalController', ['$scope', '$uibModalInstance', 'PubSubService', '$rootScope', '$uibModal', 'pgcRestApiCall', '$sce', 'htmlMessages', '$cookies', 'UpdateComponentsService', '$uibModalStack', function ($scope, $uibModalInstance, PubSubService, $rootScope, $uibModal, pgcRestApiCall, $sce, htmlMessages, $cookies, UpdateComponentsService, $uibModalStack) {

    $scope.host = $uibModalInstance.host;
    $scope.returnCode = $uibModalInstance.returnCode;
    $scope.local_pg_ver = $uibModalInstance.local_pg_ver;
    $scope.remote_pg_ver = $uibModalInstance.remote_pg_ver;
    var session;
    var subscriptions = [];
    $scope.updatingSpinner = false;
    $scope.errorMsg;
    $scope.success = false;

    $scope.modalTitle = $sce.trustAsHtml(htmlMessages.getMessage('update-pgc-host-msg').replace("{{host}}", $scope.host));
    $scope.updateSuccessMsg = $sce.trustAsHtml(htmlMessages.getMessage('update-pgc-host-completed'));

    if ($scope.returnCode) {
        $scope.modalMsg = $sce.trustAsHtml(htmlMessages.getMessage('remote-pgc-ver-compatible').replace("{{host}}", $scope.host).replace("{{remote_pgc_ver}}", $scope.remote_pg_ver).replace("{{local_pgc_ver}}", $scope.local_pg_ver));
    }

    function checkInfo(argument) {
        if ($scope.returnCode == 1){
            var infoData = pgcRestApiCall.getCmdData('info --host "' + $scope.host + '"');
        }else if($scope.returnCode == 2){
            var infoData = pgcRestApiCall.getCmdData('info');
        }
    }

    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
        session = val;

        session.subscribe("com.bigsql.onUpdatesCheck", function (argument) {
            var data = JSON.parse(argument[0]);
            if (data[0].state == 'error') {
                $scope.updatingSpinner = false;
                $scope.errorShow = true;
                $scope.errorMsg = data[0].msg;
            }else if (data[0].status == 'completed'){
                $scope.updatingSpinner = false;
                $scope.errorShow = false;
                $scope.modalMsg = $sce.trustAsHtml(htmlMessages.getMessage('update-pgc-host-completed'));
                $scope.success = true;
                checkInfo();
            }
            $scope.$apply();
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });
    });


    $scope.update = function (manual) {
        $rootScope.$emit('stopStatusGraphs');
        $scope.updatingSpinner = true;
        if ($scope.returnCode == 1){
            session.call('com.bigsql.updatesCheck', [$scope.host]);
        }else if($scope.returnCode == 2){
            session.call('com.bigsql.updatesCheck');
        }
    };

    $scope.cancel = function () {
        if($scope.success){
            $rootScope.$emit('addedHost');
        }
        $uibModalStack.dismissAll();
        $uibModalInstance.dismiss('cancel');
    };

}]);