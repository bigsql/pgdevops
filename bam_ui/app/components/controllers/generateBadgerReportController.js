angular.module('bigSQL.components').controller('generateBadgerReportController', ['$scope','$rootScope', '$uibModalInstance', 'PubSubService', 'bamAjaxCall', '$sce', "$http", "$window", function ($scope, $rootScope, $uibModalInstance, PubSubService, bamAjaxCall, $sce, $http, $window) {

	var session;

    var subscriptions = [];
    var sessionPromise = PubSubService.getSession();

    sessionPromise.then(function (val) {
    	session = val;

        session.subscribe("com.bigsql.badgerReports", function (data) {
            var result = data[0];
            $scope.generatingReportSpinner = false;
            if (result.error == 0) {
                $scope.report_file = result.report_file;
                $scope.report_url = "/reports/" + result.report_file;
            } else {
                $scope.badgerError = result.msg;
                $scope.generatingReportSpinner = false;
            }
            $scope.$apply();

        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        if($uibModalInstance.smallFiles.length > 0){
            $scope.badgerError = $uibModalInstance.smallFiles + '. The chosen logfile(s) do not contain enough data to generate a pgBadger report.'
        }else if ($uibModalInstance.selectedFiles.length > 0) {
            $scope.generatingReportSpinner = true;
            var args={
                    "log_files": $uibModalInstance.selectedFiles,
                    "db":       $uibModalInstance.pgDB,
                    "jobs":   $uibModalInstance.pgJobs,
                    "log_prefix": $uibModalInstance.pgLogPrefix,
                    "title":$uibModalInstance.pgTitle
            };
            var generateReports = $http.post($window.location.origin + '/api/generate_badger_reports', args);
            generateReports.then(function (argument) {
            $scope.generatingReportSpinner = false;
            if (argument.data.in_progress){

                $scope.badgerError = "Started generating the report. Once it is done it may appear in your recent reports list or else refresh manualy.";
                $scope.generatingReportSpinner = false;
            } else{
                $scope.report_file = argument.data.report_file;
                $scope.report_url = "/reports/" + argument.data.report_file;
                }

            });
        }
    });

    $scope.cancel = function () {
        $rootScope.$emit('updateReports');
        $uibModalInstance.dismiss('cancel');
    };

    //need to destroy all the subscriptions on a template before exiting it
    $scope.$on('$destroy', function () {
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i])
        }
    });


    
}]);