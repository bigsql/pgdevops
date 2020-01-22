angular.module('bigSQL.menus').component('devOpsUpdate', {
    bindings: {},
    controller: function ($rootScope, $scope, PubSubService, MachineInfo, $uibModal, UpdateComponentsService, UpdateBamService, pgcRestApiCall) {

        var subscriptions = [];

        var session;

        /**Below function is for displaying update badger on every page.
         **/
        var infoData = pgcRestApiCall.getCmdData('info devops');
        infoData.then(function(info) {
            var data = info[0];
            if ( data.component == "devops" && data.is_current == 0 && data.current_version ) {
                $scope.bamUpdate = true;
            } else {
                $scope.bamUpdate = false;
            }
        });

        $scope.open = function () {

            var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/devOpsUpdate.html',
                windowClass: 'bam-update-modal modal',
                controller: 'ComponentDevopsUpdateController',
            });
        };

        /**
         Unsubscribe to all the apis on the template and scope destroy
         **/
        $scope.$on('$destroy', function () {
            for (var i = 0; i < subscriptions.length; i++) {
                session.unsubscribe(subscriptions[i]);
            }
        });


    },
    templateUrl: "../app/menus/partials/bamHeaderUpdate.html"
});