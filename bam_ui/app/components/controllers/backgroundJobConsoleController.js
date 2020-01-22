angular.module('bigSQL.components').controller('backgroundJobConsoleController', ['$scope', '$uibModalInstance', 'PubSubService', '$rootScope', '$uibModal', 'bamAjaxCall', '$http', '$window', '$interval', '$timeout', function ($scope, $uibModalInstance, PubSubService, $rootScope, $uibModal, bamAjaxCall, $http, $window, $interval, $timeout) {

    $scope.process_id = $uibModalInstance.processId;

    $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
    };
    $scope.loading = true;

    $scope.isbgProcessStarted = false;
    $scope.cmdAllowedTypes = ['backup','restore'];
    // $scope.cancelbgProcess = false;
    function getBGStatus(process_log_id){
        var bgReportStatus = bamAjaxCall.getCmdData('bgprocess_status/'+ process_log_id);
        bgReportStatus.then(function (ret_data){
            $scope.procId = ret_data.pid;
            $scope.error_msg = '';
            $scope.procStartTime = new Date(ret_data.start_time.split('.')[0].replace(/-/gi,'/')+' UTC').toString();
            $scope.taskID = process_log_id;
            $scope.out_data = ret_data.out_data;
            $scope.process_type = ret_data.process_type;
            $scope.procCmd = ret_data.cmd;
            $scope.procExecTime = ret_data.execution_time;
            $scope.statusClass = "success-text";
            if($scope.procCmd){
                if($scope.procCmd.indexOf("pgc dbdump") != -1 || $scope.procCmd.indexOf("pgc dbrestore") != -1){
                    $scope.procCmd = "pgc " + $scope.procCmd.split("pgc ")[1];
                }
            }
            if (ret_data.process_completed){
                $scope.procCompleted = true;
                if(ret_data.process_failed){
                    $scope.statusClass = "fail-text";
                    $scope.procStatus = "Failed."
                    $scope.generatedFile = '';
                    $scope.generatedFileName = '';
                    $scope.error_msg = ret_data.error_msg;
                }else{
                    $scope.procStatus = "Completed."
                    $scope.generatedFile = ret_data.file;
                    $scope.generatedFileName = ret_data.report_file;
                }
                if(ret_data.end_time){
                    $scope.procEndTime = new Date(ret_data.end_time.split('.')[0].replace(/-/gi,'/')+' UTC').toString();
                }
            } else{
                $scope.statusClass = "running-text";
                $scope.procEndTime = '';
                $scope.generatedFile = '';
                $scope.generatedFileName = '';
                $scope.procCompleted = false;
                $scope.procStatus = "Running....";
                $scope.refreshConsole = setTimeout(function() {getBGStatus(process_log_id) },2000);
            }

            $timeout(function() {
                var scroller = document.getElementById("bg_console");
                scroller.scrollTop = scroller.scrollHeight;
            }, 0, false);

        });
    }
    getBGStatus($scope.process_id);


}]);