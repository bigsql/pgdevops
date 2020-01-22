angular.module('bigSQL.menus').component('leftMenu', {
    bindings: {},
    controller: function ($scope, PubSubService, $rootScope, pgcRestApiCall, userInfoService) {
    	$scope.hideAwsNav = false;
    	$scope.hideAzureNav = false;
    	$scope.hideBackupRestore = false;
    	var getLablist = pgcRestApiCall.getCmdData('lablist');
    	getLablist.then(function (argument) {
    		for (var i = argument.length - 1; i >= 0; i--) {
                if (argument[i].lab == 'aws' && argument[i].enabled == 'on') {
                    $scope.hideAwsNav = true;
                }else if (argument[i].lab == 'dumprest' && argument[i].enabled == 'on') {
                    $scope.hideBackupRestore = true;
                }else if (argument[i].lab == 'azure' && argument[i].enabled == 'on') {
                    $scope.hideAzureNav = true;
                }else if (argument[i].lab == 'vmware' && argument[i].enabled == 'on') {
                    $scope.hidevmWareNav = true;
                }
            }
    	});

        $scope.devRole = false;
        var checkUserRole = userInfoService.getUserRole();
        checkUserRole.then(function (data) {
          if(data.data.code == 1){
            $scope.devRole = true;
          }
        })

    	$rootScope.$on('hideAwsNav', function (event, value) {
    		if (value == 'on') {
    			$scope.hideAwsNav = true;
    		}else{
    			$scope.hideAwsNav = false;
    		}
    	});


    	$rootScope.$on('hideAzureNav', function (event, value) {
    		if (value == 'on') {
    			$scope.hideAzureNav = true;
    		}else{
    			$scope.hideAzureNav = false;
    		}
    	});

        $rootScope.$on('hidevmWareNav', function (event, value) {
            if (value == 'on') {
                $scope.hidevmWareNav = true;
            }else{
                $scope.hidevmWareNav = false;
            }
        });

    	$rootScope.$on('hideBackupRestoreNav', function (event, value) {
    		if (value == 'on') {
    			$scope.hideBackupRestore = true;
    		}else{
    			$scope.hideBackupRestore = false;
    		}
    	})

    },
    templateUrl: "../app/menus/partials/leftMenu.html"
});