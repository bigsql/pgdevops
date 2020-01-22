angular.module('bigSQL.common').factory('userInfoService', function ($window, $rootScope, $q, $interval, bamAjaxCall, $http) {

	function getUserInfo(argument) {

		return $q(function (resolve, reject) {
			var userInfoData = bamAjaxCall.getCmdData('userinfo');
	        userInfoData.then(function(data) {
	        	resolve(data);
	        });
    	});
	}

	function getUserRole(argument) {
		
		return($q(function (resolve, reject) {
			var checkUserRole = $http.get($window.location.origin + '/api/checkUserRole');
		    checkUserRole.then(function (data) {
		        resolve(data);
		    })
		}))
	}

	return {
        getUserInfo: getUserInfo,
        getUserRole: getUserRole
    }
});