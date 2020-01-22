angular.module('bigSQL.components').controller('backgroundProcessListController', ['$rootScope', '$scope', '$uibModal', 'PubSubService', 'MachineInfo', 'UpdateComponentsService', '$window', 'bamAjaxCall', '$cookies', '$sce', 'htmlMessages','$http', '$timeout', 'pgcRestApiCall', function ($rootScope, $scope, $uibModal, PubSubService, MachineInfo, UpdateComponentsService, $window, bamAjaxCall, $cookies, $sce, htmlMessages,$http,$timeout, pgcRestApiCall) {
    $scope.processList = [];
    $scope.loading = true;
    $scope.showBackupBgProcess = false;
    $scope.showBackupProcess = true;
    $scope.processType = 'all';
    $scope.jobTypes = [{
                'type':'All Jobs',
                'type_value': 'all'
            },
            {
                'type':'Backup',
                'type_value': 'backup'
            },
            {
                'type':'Restore',
                'type_value': 'restore'
            },
            {
                'type':'Badger',
                'type_value': 'pgBadger Report'
            }];
    var ajaxSubscriptions = [];
    $scope.getBGprocessList = function(type) {
        if(type == 'all' || type == ''){
            type = '';
        }
        else{
            type = '/'+type;
        }
        var getbgProcess = bamAjaxCall.getCmdData('bgprocess_list'+type);
        getbgProcess.then(function (argument) {
            if (argument.process) {
                $scope.processList = argument.process;
                // $scope.loading = false;
            }
            ajaxSubscriptions.push($timeout(function() {
                $scope.getBGprocessList($scope.processType)
            }, 5000));
        })
    };

    var lablist = pgcRestApiCall.getCmdData('lablist');
    lablist.then(function (argument) {
        var labs = argument;
        $scope.loading = false;
        for (var i = labs.length - 1; i >= 0; i--) {
            if(labs[i].lab == 'dumprest' && labs[i].enabled != "on"){
                $window.location.href = '/';
                break;
            }
        }
    });  

    $scope.getBGprocessList('');

    $scope.jobTypeChange = function(type){
        if(type == "all"){
            getBGprocessList('');
        }
        else{
            getBGprocessList('/'+type);
        }
    };
    $scope.getTruncatedCmd = function(cmd){
        if(!cmd) return "Show Console Output";
        if(cmd.indexOf("pgc ") != -1 || cmd.indexOf("pgbadger ") != -1){
            var cmd_list = cmd.split(" ");
            var index = -1;
            if(cmd.indexOf("pgc ") != -1){
                index = $scope.is_in_array("pgc",cmd_list)
                cmd_list[index] = "pgc";
            }
            else if(cmd.indexOf("pgbadger ") != -1){
                index = $scope.is_in_array("pgbadger",cmd_list)
                cmd_list[index] = "pgbadger";
            }
        return cmd_list.join(" ");
        }
        return cmd;
    };

    $scope.getLocalTime = function(time){
        if(!time){
            return "";
        }
        var d_date = new Date(time.split('.')[0].replace(/-/gi,'/')+' UTC');
        return d_date;
    }
    $scope.is_in_array = function(s,data) {
        for (var i = 0; i < data.length; i++) {
            if (data[i].toLowerCase().indexOf(s) != -1) return i;
        }
        return -1;
    }
    $scope.showConsoleOutput = function(log_id){
        $scope.showBackupBgProcess = true;
        if($scope.refreshConsole){
            clearTimeout($scope.refreshConsole);
        }
        getBGStatus(log_id);
        $scope.dialog.open();
        //$rootScope.$emit('backgroundJobDetailConsole', log_id);

        /*var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/backgroundJobConsole.html',
            controller: 'backgroundJobConsoleController',
        });

        modalInstance.processId = log_id;*/
    };

    $rootScope.$on('hidebgProcess', function (argument) {
        $scope.showBackupBgProcess = false;
    });



    $scope.isbgProcessStarted = false;
    $scope.cmdAllowedTypes = ['backup','restore', 'badger'];
    // $scope.cancelbgProcess = false;
    function getBGStatus(process_log_id){
        var bgReportStatus = bamAjaxCall.getCmdData('bgprocess_status/'+ process_log_id,{'line_count':1000});
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
    angular.element(document).ready(function () {
        $scope.dialog = $("#dialog").dialog({
            uiLibrary: 'bootstrap',
            minWidth: 650,
            maxWidth: 1200,
            minHeight: 350,
            maxHeight: 750,
            height: 500,
            width:650,
            modal: false,
            //scrollable:true
            initialized: function (e) {
                $(".bg_job_console").height($('#dialog').height() - 200);
            },
            opening: function (e) {
                $(".bg_job_console").height($('#dialog').height() - 200);
            },
            opened: function (e) {
                $(".bg_job_console").height($('#dialog').height() - 200);
            },
        });

        $scope.dialog.on('resize', function (e) {
            $(".bg_job_console").height($('#dialog').height() - 200);
        });
    });

    $scope.navigate = function (path){
        window.location = path;
        window.location.reload();
    };

    //need to destroy all the subscriptions on a template before exiting it
    $scope.$on('$destroy', function () {
        for (var i = 0; i < ajaxSubscriptions.length; i++) {
            $timeout.cancel(ajaxSubscriptions[i])
        }
        $scope.dialog.close();
    });

}]);