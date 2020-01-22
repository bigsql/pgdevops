angular.module('bigSQL.common').directive('backgroundProcessAlert', function (bamAjaxCall, $rootScope) {

    return {
        scope: {
            title: '@'
        },
        restrict: 'E',
        templateUrl: '../app/common/partials/backgroundProcessAlert.html',
        controller: ['$scope', '$http', '$window', '$cookies', '$rootScope', '$timeout', '$uibModal', '$sce','PubSubService', function backgroundProcessAlertController($scope, $http, $window, $cookies, $rootScope, $timeout, $uibModal, $sce, PubSubService) {

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
                    if($scope.procCmd && $scope.procCmd.indexOf("pgc dbdump") != -1 || $scope.procCmd.indexOf("pgc dbrestore") != -1){
                        $scope.procCmd = "pgc " + $scope.procCmd.split("pgc ")[1];
                    }
                    if (ret_data.process_completed){
                        $scope.procCompleted = true;
                        if(ret_data.process_failed){
                            $scope.procStatus = "Failed."
                            $scope.generatedFile = '';
                            $scope.generatedFileName = '';
                            $scope.error_msg = ret_data.error_msg;
                            if(ret_data.component_required){
                                var modalInstance = $uibModal.open({
                                    templateUrl: '../app/components/partials/confirmOverrideModel.html',
                                    controller: 'confirmOverrideModalController',
                                });
                                if($scope.procCmd.indexOf("pgc dbrestore") != -1){
                                    modalInstance.modalTitle = $sce.trustAsHtml("pg_restore must match source DB version");
                                    $rootScope.$emit("getSelectedHost","restore");
                                }
                                else{
                                    modalInstance.modalTitle = $sce.trustAsHtml("pg_dump must match source DB version");
                                    $rootScope.$emit("getSelectedHost","backup");
                                }
                                modalInstance.modelBody = $sce.trustAsHtml("Host " + $rootScope.selectedHost +" Requires: "+ret_data.component_required);
                                modalInstance.successText = "Install";
                                modalInstance.failText = "Cancel";
                                modalInstance.acceptMethod = "initComponentInstall";
                                modalInstance.sshHost = $rootScope.selectedHost;
                                modalInstance.component = ret_data.component_required;
                                $rootScope.$emit('hidebgProcess');
                            }
                        }else{
                            $scope.procStatus = "Completed."
                            $scope.generatedFile = ret_data.file;
                            $scope.generatedFileName = ret_data.report_file;
                        }
                        $scope.procEndTime = new Date(ret_data.end_time.split('.')[0].replace(/-/gi,'/')+' UTC').toString();
                        $rootScope.$emit("refreshBadgerReports");
                    } else{
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

            //for console toggle 

            document.getElementById('btask-tab-pullout').onclick = function() {
              this.__toggle = !this.__toggle;
              var target = document.getElementById('btask-console-hidden');
              if( !this.__toggle) {
                  target.style.display = "block";
                  this.firstElementChild.classList.remove("fa-chevron-left");
                  this.firstElementChild.classList.add("fa-chevron-right");
              }
              else {
                  target.style.display = "none";
                  this.firstElementChild.classList.add("fa-chevron-left");
                  this.firstElementChild.classList.remove("fa-chevron-right");
              }
            }

            /*$rootScope.$on('initComponentInstall', function () {
                debugger
                $scope.installComponentBackground('pg95','localhost');
                debugger
             });
*/
            $scope.cancel = function (argument) {
                $rootScope.$emit('hidebgProcess');
                //var bgReportAcknowledge = $http.put($window.location.origin + '/admin/misc/bgprocess/'+ argument);
                // $scope.cancelbgProcess = true;
            }

            $rootScope.$on('backgroundProcessStarted', function (argument, pid) {
                if($scope.refreshConsole){
                    clearTimeout($scope.refreshConsole);
                }
                getBGStatus(pid);

            });
            
        }]
    }
});