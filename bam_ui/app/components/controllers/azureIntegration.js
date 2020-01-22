angular.module('bigSQL.components').controller('azureIntegrationController', ['$scope', 'PubSubService', '$state','$interval','$location', '$window', '$rootScope', 'bamAjaxCall', '$cookies', '$uibModal', '$timeout', 'htmlMessages', 'userInfoService', 'pgcRestApiCall', function ($scope, PubSubService, $state, $interval, $location, $window, $rootScope, bamAjaxCall, $cookies, $uibModal, $timeout, htmlMessages, userInfoService, pgcRestApiCall) {

	$scope.alerts = [];
    $scope.loading = true;
	$scope.discover =  function (settingName, disp_name, instance) {

		var modalInstance = $uibModal.open({
	        templateUrl: '../app/components/partials/azureDBModal.html',
	        controller: 'azureDBModalController',
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
            if(labs[i].lab == "azure" && labs[i].enabled != "on"){
                $window.location.href = '/';
                break;
            }
        }
    });   

	$scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

	$rootScope.$on('AzureDBCreated', function (argument, data) {
        $scope.discover('azure', 'Discover Azure PostgreSQL Instances', 'db');
        $scope.alerts.push({
                    msg: data,
                    type: 'success'
                });
    })
    
    $rootScope.$on('RdsCreated', function (argument, data) {
        $scope.discover('azure', 'Discover Azure VM instances', 'vm');
        $scope.alerts.push({
                    msg: data,
                    type: 'success'
                });
    })

    $scope.comingSoon = function (argument) {
    	$scope.alerts.push({
                    msg: htmlMessages.getMessage('coming-soon'),
                    type: 'warning'
                });
    }

	$scope.createNewAzureDb = function(){
        var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/createNewAzureDB.html',
                controller: 'createNewAzureDBController',
                keyboard  : false,
                windowClass : 'rds-modal',
                backdrop  : 'static',
            });
    }

    $scope.createNewVM = function(){
        var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/createNewAzureVM.html',
                controller: 'createNewAzureVMController',
                keyboard  : false,
                windowClass : 'rds-modal',
                backdrop  : 'static',
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