angular.module('bigSQL.components').controller('feedbackFormController', ['$scope', '$uibModalInstance', 'PubSubService', '$rootScope', '$uibModal', 'bamAjaxCall', '$http', 'htmlMessages', function ($scope, $uibModalInstance, PubSubService, $rootScope, $uibModal, bamAjaxCall, $http, htmlMessages) {

	$scope.lab = $uibModalInstance.lab;
	$scope.to_email = 'bigsql-feedback@openscg.com';
	$scope.sendingEmail = false;
	$scope.showSendbtn = true;
	$scope.alerts = [];

	if($uibModalInstance.disp_name){
		$scope.subject = $uibModalInstance.disp_name + ' Lab';
	}

	var userInfoData = bamAjaxCall.getCmdData('userinfo');
        userInfoData.then(function(data) {
        	$scope.from_email = data.email;
        }); 

    $scope.sendEmail = function (argument) {
    	$scope.sendingEmail = true;
    	var args = {
    		'text' : $scope.feedback,
    		'subject' : $scope.subject,
    		'from_email' : $scope.from_email,
    		'to' : $scope.to_email
    	}
    	
    	var sendFeedback = $http.post('https://www.bigsql.org/email-feedback/',args)
    	sendFeedback.then(function (argument) {	
    		if (argument.status == 200) {
                $rootScope.$emit('emailSucessMsg', htmlMessages.getMessage('email-response'), 'success');
    			$scope.showSendbtn = true;
    			$uibModalInstance.dismiss('cancel');
    		}else{
    			$scope.sendingEmail = false;
                $rootScope.$emit('emailSucessMsg', data.msg, 'danger');
    		}
    	})
    	$uibModalInstance.dismiss('cancel');
    }

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

}]);