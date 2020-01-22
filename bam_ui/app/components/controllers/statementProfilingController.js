angular.module('bigSQL.components').controller('statementProfilingController', ['$scope','$rootScope', '$uibModalInstance','MachineInfo', 'PubSubService', function ($scope, $rootScope, $uibModalInstance, MachineInfo, PubSubService) {

	var session;

    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
    	session = val;
    });

    var subscriptions = [];

    $scope.hostName = $uibModalInstance.hostName;
    $scope.pgUser = $uibModalInstance.pgUser;
    $scope.pgPass = $uibModalInstance.pgPass;
    $scope.pgDB = $uibModalInstance.pgDB;
    $scope.pgPort = $uibModalInstance.pgPort;
    $scope.enableProfiler = false;
    $scope.comp = $uibModalInstance.comp;
    $scope.alerts = [];

    $scope.generateReport = function (argument) {

        if(!$scope.pgTitle){
            $scope.pgTitle = $scope.comp+':'+$scope.pgDB;
        }
    	session.call('com.bigsql.plprofiler', [
            $scope.hostName, $scope.pgUser,
            $scope.pgPort, $scope.pgDB,
            $scope.pgPass, $scope.pgQuery,
            $scope.pgTitle, $scope.pgDesc,
            'profile_query', $scope.comp
        ]).then(function (sub) {
            // $rootScope.$emit('refreshPage');
        	// $uibModalInstance.dismiss('cancel');
        });

        session.subscribe("com.bigsql.profilerReports", function (data) {
            $scope.generatingReportSpinner=false;
            $scope.errorMsg = '';
            var result=data[0];
            if (result.error == 0) {

                if(result.action == "profile_query" || result.action == "generate"){
                    $uibModalInstance.dismiss('cancel');
                }
                else{
                    $scope.alerts.push({
                            msg:  result.msg,
                            type: 'danger',
                        });
                    
                }
            } else {
                $scope.alerts.push({
                            msg:  result.msg,
                            type: 'danger',
                        });
            }
            $scope.$apply();

        }).then(function (subscription) {
            subscriptions.push(subscription);
        });
    };

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.cancel = function () {
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i])
        }
        $rootScope.$emit('refreshPage');
        $uibModalInstance.dismiss('cancel');
    };

}]);