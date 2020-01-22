angular.module('bigSQL.components').controller('whatsNewController', ['$scope','$rootScope', '$uibModalInstance', 'PubSubService', '$sce', 'bamAjaxCall', function ($scope, $rootScope, $uibModalInstance, PubSubService, $sce, bamAjaxCall) {

	$scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    var whatNew = bamAjaxCall.getCmdData('utilRelnotes/' + $uibModalInstance.component )
    whatNew.then(function (data) {
    	var data = JSON.parse(data)
        $scope.whatsNewText = $sce.trustAsHtml(data[0].relnotes);
    });

}]);