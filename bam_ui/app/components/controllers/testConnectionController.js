angular.module('bigSQL.components').controller('testConnectionController', ['$rootScope', '$scope', '$uibModal', 'PubSubService', 'MachineInfo', 'UpdateComponentsService', 'bamAjaxCall', '$window', '$cookies', '$sce', 'htmlMessages', '$timeout', '$uibModalInstance', function ($rootScope, $scope, $uibModal, PubSubService, MachineInfo, UpdateComponentsService, bamAjaxCall, $window, $cookies, $sce, htmlMessages, $timeout, $uibModalInstance) {

	$scope.alerts = [];
	$scope.connecting = false;

	$scope.user = $uibModalInstance.user;
	$scope.password = $uibModalInstance.password;
	$scope.ssh_key = $uibModalInstance.ssh_key;
	$scope.ssh_sudo_pwd = $uibModalInstance.ssh_sudo_pwd;

	$scope.closeAlert = function (index) {
	    $scope.alerts.splice(index, 1);
	};

	$scope.testCredential = function (argument) {
		$scope.connecting = true;
		$scope.msg = '';
		var data = {
			'user': $scope.user,
			'password' : $scope.password,
			'ssh_key' : $scope.ssh_key,
			'ssh_sudo_pwd' : $scope.ssh_sudo_pwd,
			'host' : $scope.host
		}
		var testConn = bamAjaxCall.getCmdData('testConn', data);
		testConn.then(function (argument) {
			$scope.connecting = false;
			var jsonData = JSON.parse(argument)[0];
			if (jsonData.state == 'success') {
				$scope.msg = jsonData.msg;
			}else{
				$scope.msg = jsonData.msg;
			}
		});
	}

	$scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

}]);