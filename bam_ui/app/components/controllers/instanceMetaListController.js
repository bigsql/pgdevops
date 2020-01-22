angular.module('bigSQL.components').controller('instanceMetaListController', ['$scope', 'PubSubService', 'UpdateComponentsService', 'MachineInfo', '$sce', '$timeout', '$interval', '$rootScope', 'bamAjaxCall', function ($scope, PubSubService, UpdateComponentsService, MachineInfo, $sce, $timeout, $interval, $rootScope, bamAjaxCall) {

    $scope.metaListData = $rootScope.instanceMetaList[0];


}]);