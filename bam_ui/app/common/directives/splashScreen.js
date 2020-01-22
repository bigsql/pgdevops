angular.module('bigSQL.common').directive('splashScreen', function () {

    return {
        scope: {
            desc: '@',
        },
        restrict: 'E',
        templateUrl: '../app/common/partials/splashScreen.html',
        controller: ['$scope', '$http', '$window', '$uibModal', 'htmlMessages','$sce', function serverInfoDetailsController($scope, $http, $window, $uibModal, htmlMessages, $sce) {

            if ($scope.desc) {
                $scope.text = $sce.trustAsHtml(htmlMessages.getMessage('pgDevOps-rds-init-msg'));
                document.getElementById("rdsSplash").style.width = "100%";
            }

            $scope.navToServerManager = function (argument) {
                document.getElementById("rdsSplash").style.height = "0%";
                var modalInstance = $uibModal.open({
                    templateUrl: '../app/components/partials/rdsModal.html',
                    controller: 'rdsModalController',
                    keyboard  : false,
                    backdrop  : 'static',
                    windowClass : 'rds-modal',
                    size : 'lg'
                });
                modalInstance.lab = 'aws';
                modalInstance.disp_name = 'Discover AWS Postgres RDS Instances';
                modalInstance.instance = 'db';
              }

            $scope.closeNav = function(argument){
                document.getElementById("rdsSplash").style.height = "0%";
            }
        }]
    }
});