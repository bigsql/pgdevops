angular.module('bigSQL.components').controller('hostGraphModalController', ['$scope', '$uibModalInstance', 'PubSubService', 'UpdateComponentsService', 'MachineInfo', '$http', '$window', '$interval', '$rootScope', 'bamAjaxCall', function ($scope, $uibModalInstance, PubSubService, UpdateComponentsService, MachineInfo, $http, $window, $interval, $rootScope, bamAjaxCall) {

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    $scope.chartName = $uibModalInstance.chartName;
    $scope.data = $uibModalInstance.data;
    $scope.hostName = $uibModalInstance.hostName;
    if (!$scope.hostName) {
        $scope.hostName = $uibModalInstance.host;
    }

    var chart = $uibModalInstance.chart;
    chart.chart['showLegend'] = true;
    $scope.chart = chart;

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };
    
}]);
