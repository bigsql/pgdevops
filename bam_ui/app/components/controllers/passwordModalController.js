angular.module('bigSQL.components').controller('passwordModalController', ['$scope', '$uibModalInstance', 'PubSubService', '$rootScope', '$uibModal', 'bamAjaxCall', '$http', '$window', '$interval', '$timeout', function ($scope, $uibModalInstance, PubSubService, $rootScope, $uibModal, bamAjaxCall, $http, $window, $interval, $timeout) {

    $scope.sid = $uibModalInstance.sid;
    $scope.gid = $uibModalInstance.gid;
    $scope.errorMsg = $uibModalInstance.error;
    $scope.connection = {savePwd : false};

    $scope.submitPassword = function (pwd) {
        $rootScope.$emit('getDBstatus', $scope.sid, $scope.gid, pwd, $scope.connection.savePwd, false   );
        $scope.connect_err = '';
        $scope.connecting = true;
    }
        
    $scope.openEditConn = function (argument) {
        $rootScope.$emit('openEditConn', $scope.sid);
        $uibModalInstance.dismiss('cancel');
    }

    $rootScope.$on('connectionData', function (event, argument) {
        $uibModalInstance.dismiss('cancel');
    })

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

}]);