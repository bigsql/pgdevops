angular.module('bigSQL.components').controller('vmwareIntegrationController', ['$scope', 'PubSubService', '$state','$interval','$location', '$window', '$rootScope', 'bamAjaxCall', '$cookies', '$uibModal', '$timeout', 'htmlMessages', 'userInfoService', 'pgcRestApiCall', function ($scope, PubSubService, $state, $interval, $location, $window, $rootScope, bamAjaxCall, $cookies, $uibModal, $timeout, htmlMessages, userInfoService, pgcRestApiCall) {

	$scope.alerts = [];
    $scope.loading = true;
	$scope.discover =  function (settingName, disp_name, instance) {

		var modalInstance = $uibModal.open({
	        templateUrl: '../app/components/partials/vmwareInstancesModal.html',
	        controller: 'vmwareInstancesModalController',
	        keyboard  : false,
	        backdrop  : 'static',
	        windowClass : 'rds-modal',
	        size : 'lg'
	    });
	    modalInstance.lab = settingName;
	    modalInstance.disp_name = disp_name;
	    modalInstance.instance = instance;
        modalInstance.devRole = $scope.devRole;
	}

    var lablist = pgcRestApiCall.getCmdData('lablist');
    lablist.then(function (argument) {
        var labs = argument;
        $scope.loading = false;
        for (var i = labs.length - 1; i >= 0; i--) {
            if(labs[i].lab == "vmware" && labs[i].enabled != "on"){
                $window.location.href = '/';
                break;
            }
        }
    });   

	$scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    
    $rootScope.$on('vmwareCreated', function (argument, data) {
        $scope.discover('vmware', 'Discover VMware instances', 'vm');
        $scope.alerts.push({
                    msg: data,
                    type: 'success'
                });
    })

    $scope.createNewVM = function(){
        var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/createvmwareInstanceModal.html',
                controller: 'createvmwareInstanceController',
                keyboard  : false,
                backdrop  : 'static'
            });
    }

    $scope.devRole = false;
    var checkUserRole = userInfoService.getUserRole();
    checkUserRole.then(function (data) {
        if(data.data.code == 1){
          $scope.devRole = true;
        }
    })

}])