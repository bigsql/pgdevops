angular.module('bigSQL.components').controller('pgdgActionModalController', ['$scope', '$uibModalInstance', 'PubSubService', '$rootScope', '$uibModal', 'bamAjaxCall', '$http', '$window', '$interval', '$timeout', function ($scope, $uibModalInstance, PubSubService, $rootScope, $uibModal, bamAjaxCall, $http, $window, $interval, $timeout) {

    $scope.pgdgComp = $uibModalInstance.pgdgComp;
    $scope.pgdgRepo = $uibModalInstance.pgdgRepo;
    $scope.procDone = false;
    $scope.removing = false;
    $scope.installing = false;
    $scope.registering = false;
    $scope.action = $uibModalInstance.action;
    $scope.pwd = {text: ''};
    $scope.btnAction = $scope.action;

    
    if($uibModalInstance.host == 'localhost' || $uibModalInstance.host == '' ){
        $scope.currentHost = '';
    }else{
        $scope.currentHost = $uibModalInstance.host;
    }

    function pgdgBtnAction(argument){


        var args = {
            "component" : $scope.pgdgComp,
            "host" : $scope.currentHost,
            "repo" : $scope.pgdgRepo,
            "action" : argument,
            "pwd" : $scope.pwd.text
        }
        if ($scope.action == 'install') {
            $scope.loading = true;
            $scope.installing = true;
        }else if($scope.action == 'remove'){
            $scope.removing = true;
            $scope.loading = true;
        } else{
            $scope.registering = true;
        }
        var pgdgCmd = $http.post($window.location.origin + '/api/pgdgAction?q=' + Math.floor(Date.now() / 1000).toString(), args);
        pgdgCmd.then(function (argument) {
            $scope.loading = false;
            setTimeout(function() {getBGStatus(argument.data.process_log_id)},3000);
        });

    }
    if ($scope.pgdgComp && $scope.action) {
        pgdgBtnAction($scope.action);
    }

    $scope.continueAction = function(argument){
        pgdgBtnAction(argument);
    };
    $scope.register = function (argument) {
        $scope.btnAction = "register";
        $scope.registering = true;
        pgdgBtnAction("register");

    };


    function getBGStatus(process_log_id){
        
        var bgReportStatus = $http.get($window.location.origin + '/api/bgprocess_status/'+ process_log_id + '?q=' + Math.floor(Date.now() / 1000).toString());

        bgReportStatus.then(function (ret_data){
            $scope.sudo_pwd = false;
            $scope.procId = ret_data.data.pid;
            $scope.error_msg = ''; 
            $scope.taskID = process_log_id;
            $scope.out_data = ret_data.data.out_data;
            $scope.procCmd = ret_data.data.cmd;

            if (ret_data.data.process_completed){
                var n = ret_data.data.out_data.search("sudo: no tty present and no askpass program specified");
                var n2 = ret_data.data.out_data.search("password required");
            if (n>=0){
                $scope.sudo_pwd = true;
                var res = ret_data.data.out_data.replace("sudo: no tty present and no askpass program specified", "Password required ...");
                $scope.out_data = res;
            } else if (n2>=0){

                $scope.sudo_pwd = true;
            }

                $scope.procDone = false;
                if(ret_data.data.process_failed){
                    $scope.procStatus = "Failed."
                    $scope.error_msg = ret_data.data.error_msg;
                }else{
                    $scope.procDone = true;
                    $scope.registering = false;
                    $scope.installing = false;
                    $scope.removing = false;
                }
            } else{
                setTimeout(function() {getBGStatus(process_log_id) },2000);
            }

            $timeout(function() {
                var scroller = document.getElementById("console");
                scroller.scrollTop = scroller.scrollHeight;
            }, 0, false);
        });
    }


    $scope.cancel = function () {
        $rootScope.$emit('refreshRepo', $scope.pgdgRepo ,'Installed');
        $uibModalInstance.dismiss('cancel');
    };

}]);