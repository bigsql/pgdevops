angular.module('bigSQL.common').directive('fileSelector', function () {

    return {
        scope: {
            desc: '@',
            modelname:'@'
        },
        restrict: 'E',
        templateUrl: '../app/common/partials/fileSelector.html',
        controller: ['$scope', '$http', '$window', '$uibModal', 'htmlMessages','$sce', function serverInfoDetailsController($scope, $http, $window, $uibModal, htmlMessages, $sce) {


        }]
    }
});