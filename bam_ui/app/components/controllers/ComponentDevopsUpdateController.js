angular.module('bigSQL.components').controller('ComponentDevopsUpdateController', ['$rootScope', '$scope', '$stateParams', 'PubSubService', '$state', '$uibModalInstance', 'MachineInfo', 'UpdateBamService','$window', 'pgcRestApiCall', function ($rootScope, $scope, $stateParams, PubSubService, $state, $uibModalInstance, MachineInfo, UpdateBamService,$window, pgcRestApiCall) {

    var subscriptions = [];
    var session;
    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
        session = val;
    });

    var infoData = pgcRestApiCall.getCmdData('info pgdevops');
        infoData.then(function(info) {
            var data = info[0];
            $scope.updateVersion = data.current_version;
            $scope.currentVersion = data.version;
        });

    function updateComponents(val) {

        session = val;
        $scope.component = {};

        $scope.redirect = function () {
            $uibModalInstance.dismiss('cancel');
            $window.location.reload(true);
            $rootScope.$emit("bamUpdated");
        };

        $scope.action = function (event) {

            session.call('com.bigsql.update', ['devops']).then(
                function (sub) {
                    $scope.bamUpdateIntiated = true;
                    $scope.updatingStatus = true;
                    $scope.$apply()
                }, function (err) {
                    throw new Error('failed to install comp', err);
                });
        }

    };


    updateComponents();


    $rootScope.$on('sessionCreated', function () {

        var bamUpdatePromise = UpdateBamService.getBamUpdateInfo();
        bamUpdatePromise.then(function (info) {
            if (info.is_current == 1) {
                $scope.bamUpdatedStatus = true;
            } else {
                $scope.bamNotUpdatedStatus = true;
            }
            $scope.updatingStatus = false;
        }, function () {
            throw new Error('failed to subscribe to topic updateComponents', err);
        });


    }, function (failObj) {
        throw new Error(failObj);
    });


    //need to destroy all the subscriptions on a template before exiting it
    $scope.$on('$destroy', function () {
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i]);
        }
    });

}]);