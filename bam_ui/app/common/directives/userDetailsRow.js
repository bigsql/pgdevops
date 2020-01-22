angular.module('bigSQL.common').directive('userDetailsRow', function () {
	
	return {
        scope: {
            value: "=",
            roles: "="
        },
        restrict: 'E',
        templateUrl: '../app/components/partials/userForm.html',
        controller: ['$scope', '$rootScope', '$window', '$http', function userDetailsRowController($scope, $rootScope, $window, $http) {
			var count = 1;

			$scope.deleteUser = function (user_id) {
		        var delete_url = $window.location.origin + '/admin/user_management/user/' + user_id;

		        $http.delete(delete_url)
		            .success(function (data) {
		                $rootScope.$emit('callGetList');
		            })
		            .error(function (data, status, header, config) {

		            });

		    };

		    $scope.updateRole = function() {
		    	if(!$scope.value.new){
		    		var updateData = {};
            		updateData.id = $scope.value.id;
			        updateData.role = $scope.value.role;
	            	$rootScope.$emit('updateUser', updateData);
		    	}
			}

			$scope.updateActive = function() {
		    	if(!$scope.value.new){
		    		var updateData = {};
            		updateData.id = $scope.value.id;
			        updateData.active = $scope.value.active;
	            	$rootScope.$emit('updateUser', updateData);
		    	}
			}

            $scope.formSave = function () {
            	
            	if($scope.passwordValid && count == 1 ) {
            		var userData = {};
            		userData.id = $scope.value.id;
			        userData.email = $scope.value.email;
			        userData.active = $scope.value.active;
			        userData.role = $scope.value.role;
			        userData.newPassword = $scope.userForm.password_c.$viewValue;
			        userData.confirmPassword = $scope.userForm.password_c.$viewValue;
	            	$rootScope.$emit('saveUser', userData);
	            	count += 1; 
            	}
		    }
        }]
    }

})