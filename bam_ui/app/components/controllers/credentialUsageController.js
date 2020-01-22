angular.module('bigSQL.components').controller('credentialUsageController', ['$rootScope', '$scope', '$uibModal', 'PubSubService', 'MachineInfo', 'UpdateComponentsService', 'bamAjaxCall', '$window', '$cookies', '$sce', 'htmlMessages', '$timeout', '$uibModalInstance', function ($rootScope, $scope, $uibModal, PubSubService, MachineInfo, UpdateComponentsService, bamAjaxCall, $window, $cookies, $sce, htmlMessages, $timeout, $uibModalInstance) {

	$scope.alerts = [];

	$scope.name = $uibModalInstance.name;
	$scope.hosts = $uibModalInstance.host_list;
	$scope.cred_type = $uibModalInstance.cred_type;
	$scope.selectedCreds = $uibModalInstance.selectedCreds;

	$scope.closeAlert = function (index) {
	    $scope.alerts.splice(index, 1);
	};

	$scope.redirectToServers = function (host) {
		$uibModalInstance.dismiss('cancel');
		$window.location.href = "#/hosts";
		$cookies.put('OpenCredentialHost', host );
	}

	$scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

}]);