angular.module('bigSQL.components').controller('awsIntegrationController', ['$scope', 'PubSubService', '$state','$interval','$location', '$window', '$rootScope', '$cookies', '$uibModal', '$timeout', 'htmlMessages', 'userInfoService', 'pgcRestApiCall', function ($scope, PubSubService, $state, $interval, $location, $window, $rootScope, $cookies, $uibModal, $timeout, htmlMessages, userInfoService, pgcRestApiCall) {

	$scope.alerts = [];
    $scope.loading = true;
	$scope.discover =  function (settingName, disp_name, instance, searchEvent) {

		var modalInstance = $uibModal.open({
	        templateUrl: '../app/components/partials/rdsModal.html',
	        controller: 'rdsModalController',
	        keyboard  : false,
	        backdrop  : 'static',
	        windowClass : 'rds-modal',
	        size : 'lg'
	    });
	    modalInstance.lab = settingName;
	    modalInstance.disp_name = disp_name;
	    modalInstance.instance = instance;
        modalInstance.searchEvent = searchEvent;
        modalInstance.devRole = $scope.devRole;
	}

	$scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    var lablist = pgcRestApiCall.getCmdData('lablist');
    lablist.then(function (argument) {
        var labs = argument;
        $scope.loading = false;
        for (var i = labs.length - 1; i >= 0; i--) {
            if(labs[i].lab == "aws" && labs[i].enabled != "on"){
                $window.location.href = '/';
                break;
            }
        }
    });   


	$rootScope.$on('RdsCreated', function (argument, data) {
        $scope.discover('aws', 'Discover AWS EC2 Instances', 'vm', 'searchEvent');
        $scope.alerts.push({
                    msg: data,
                    type: 'success'
                });
    })

    $rootScope.$on('PostgresRdsCreated', function (argument, data) {
        $scope.discover('aws', 'Discover AWS Postgres RDS', 'db', 'searchEvent');
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

	$scope.createNewRds = function(){
        var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/createNewRds.html',
                controller: 'createNewRdsController',
                keyboard  : false,
                windowClass : 'rds-modal',
                backdrop  : 'static',
            });
    }

    $scope.createNewEC2 = function(){
        var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/createNewAWSEC2.html',
                controller: 'createNewAWSEC2Controller',
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