angular.module('bigSQL.components').controller('switchLogfileController', ['$scope','$rootScope', '$uibModalInstance', 'PubSubService', '$sce', function ($scope, $rootScope, $uibModalInstance, PubSubService, $sce) {

	var session;

    $scope.showResult = false;
    $scope.showStatus =  true;
    $scope.autoSelect = false;
    $scope.logAction = false;
    $scope.logFile = 'pgbadger-%Y%m%d_%H.log';
    var subscriptions = [];
    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
    	session = val;

    });

    $scope.comp = $uibModalInstance.comp;
    $scope.currentLogfile = $uibModalInstance.currentLogfile;

    $scope.switchFile = function (fileName) {
        $scope.logAction = true;
        session.call('com.bigsql.switch_log_file', [
            $scope.comp, fileName
        ]);

        session.subscribe("com.bigsql.onSwitchLogfile", function (data) {
            var result = data[0];

            if(result.error == 0){
                $scope.logAction = true;
                $scope.$apply();

                window.setTimeout(function() {
                    $rootScope.$emit('switchLogfile', fileName, $scope.comp);
                }, 2000);
            }else{
                $rootScope.$emit('switchLogfileError', result);
                $uibModalInstance.dismiss('cancel');
            }

        }).then(function (sub) {
            subscriptions.push(sub);
        }); 

        session.subscribe("com.bigsql.log_files_list", function (data) {
            $uibModalInstance.dismiss('cancel');
        });       
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    //need to destroy all the subscriptions on a template before exiting it
    $scope.$on('$destroy', function () {
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i])
        }
    });


    
}]);