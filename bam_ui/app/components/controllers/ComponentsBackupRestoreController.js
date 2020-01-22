angular.module('bigSQL.components').controller('ComponentsBackupRestoreController', ['$rootScope', '$scope', '$uibModal', 'PubSubService', 'MachineInfo', 'UpdateComponentsService', '$window', 'bamAjaxCall', 'pgcRestApiCall', '$cookies', '$sce', 'htmlMessages','$http','$timeout', function ($rootScope, $scope, $uibModal, PubSubService, MachineInfo, UpdateComponentsService, $window, bamAjaxCall, pgcRestApiCall, $cookies, $sce, htmlMessages,$http,$timeout) {
    var subscriptions = [];
    $scope.backup = {};
    $scope.backup.format = 'c';
    $scope.restore = {};
    $scope.restore.format = 'c'
    $scope.alerts = [];
    $scope.showBackupBgProcess = false;
    $scope.backup.advoptions = "-v"
    $scope.restore.advoptions = "-v"
    $scope.loadingBackupAction = false;
    $scope.loadingRestoreAction = false;
    $scope.loading = true;

    $scope.backupRestoreFeature = false;

    var ajaxSubscriptions = [];

    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

    var getLabList = pgcRestApiCall.getCmdData('lablist');

    getLabList.then(function (argument) {
        $scope.loading = false;
        for (var i = argument.length - 1; i >= 0; i--) {
            if(argument[i].lab == "dumprest" && argument[i].enabled != "on"){
                $window.location.href = '/';
            }
            if(argument[i].lab == "dumprest"){
                $scope.backupRestoreLab = argument[i].disp_name;
            }
            if(argument[i].lab == "dumprest" && argument[i].enabled == "on"){
                $scope.backupRestoreFeature = true;
                break;
            }
        }
        if(!$scope.backupRestoreFeature){
            var getMessage = $sce.trustAsHtml(htmlMessages.getMessage('labNotEnabled').replace('{{lab}}', $scope.backupRestoreLab));
                $scope.alerts.push({
                    msg: getMessage,
                    type: 'warning'
                });
        }
    });

    var session;

    var hostsList = pgcRestApiCall.getCmdData('register HOST --list');
    hostsList.then(function (data) {
        if (data.length > 0 && data[0].status == "error") {
            $scope.hosts = [];
        } else {
            $scope.hosts = data;
            if(data.length > 0){
                if(data[0].name != null){
                    $scope.backup.sshserver = data[0].name;
                    $scope.restore.sshserver = data[0].name;
                    $scope.onSSHServerChange(data[0].name,'backup');
                }
                else{
                    $scope.backup.sshserver = data[0].host;
                    $scope.restore.sshserver = data[0].host;
                    $scope.onSSHServerChange(data[0].host,'backup');
                }
            }
        }
     });

     $scope.checkBGprocess = function (process_type) {
        var getbgProcess = bamAjaxCall.getCmdData('bgprocess_list'+process_type);
        getbgProcess.then(function (argument) {
            if (argument.process) {
                for (var i = 0; i < argument.process.length ; i++) {
                    if (!argument.process[i].process_completed) {
                        $scope.showBackupBgProcess = true;
                        $rootScope.$emit('backgroundProcessStarted', argument.process[i].process_log_id);
                        break;
                    }
                }
            }
        })
    }

    $scope.checkBGprocess('');

    $scope.runningJobs = function (process_type){
        var getbgProcess = bamAjaxCall.getCmdData('bgprocess_list'+process_type);
        var totalCount = 0;
        var count = 0;
        var backupCount = 0;
        var restoreCount = 0;
        getbgProcess.then(function (argument) {
            if (argument.process) {
                for (var i = 0; i < argument.process.length ; i++) {
                    if (!argument.process[i].process_completed) {
                        if(argument.process[i].process_type == 'backup'){
                            backupCount ++;
                        }
                        else if(argument.process[i].process_type == 'restore'){
                            restoreCount ++;
                        }
                        else{
                            count ++;
                        }
                        totalCount ++;
                    }
                }
            }
            $rootScope.runningJobsCount = totalCount;
            $rootScope.runningBackupJobsCount = backupCount;
            $rootScope.runningRestoreJobsCount = restoreCount;
            ajaxSubscriptions.push($timeout(function() {
                $scope.runningJobs('')
            }, 5000));
        })
    }
    $scope.runningJobs('');

     $scope.onFormatChange = function(format, b_type){
        if(format == 'p' && b_type == 'restore'){
            $scope.restore.advoptions = "";
        }
        else if(b_type == 'restore'){
            if($scope.restore.advoptions.indexOf("-v") == -1){
                if($scope.restore.advoptions){
                   $scope.restore.advoptions = $scope.restore.advoptions + " -v";
                }
                else{
                    $scope.restore.advoptions = "-v";
                }
            }
        }
     }

     $scope.onPGCChange = function (pgc,b_type) {
        if(pgc){
            var i;
            for(i = 0; i < $scope.pgListRes.length; i++){
                if($scope.pgListRes[i].server_name == pgc && b_type == 'backup'){
                    $scope.backup.hostname = $scope.pgListRes[i].host;
                    $scope.backup.port = $scope.pgListRes[i].port;
                    $scope.backup.dbname = $scope.pgListRes[i].db;
                    $scope.backup.user = $scope.pgListRes[i].db_user;
                }
                else if($scope.pgListRes[i].server_name == pgc && b_type == 'restore'){
                    $scope.restore.hostname = $scope.pgListRes[i].host;
                    $scope.restore.port = $scope.pgListRes[i].port;
                    $scope.restore.dbname = $scope.pgListRes[i].db;
                    $scope.restore.user = $scope.pgListRes[i].db_user;
                }
            }
        }else{

        }
     };

     $scope.onSSHServerChange = function(sshServer,b_type){
        if(sshServer){
            if(b_type == 'backup'){
                var cookieVal = $cookies.get('directory_backup_'+sshServer);
                if(cookieVal){
                    $scope.backup.directory = cookieVal;
                }else{
                    var defaultPath = $scope.getSSHDefault(sshServer);
                    var hostInfo = $scope.getSSHDefault(sshServer);
                    if(hostInfo){
                        $scope.backup.directory = hostInfo['hostInfo']["home"];
                    }
                    else{
                        $scope.backup.directory = "";
                    }
                }
            }
            else if(b_type == 'restore'){
                var cookieVal = $cookies.get('directory_restore_'+sshServer);
                if(cookieVal){
                    $scope.restore.directory = cookieVal;
                }else{
                    var hostInfo = $scope.getSSHDefault(sshServer);
                    if(hostInfo)
                        $scope.restore.directory = hostInfo['hostInfo']["home"];
                    else
                        $scope.restore.directory = "";
                }
            }
        }
     };

     $scope.getSSHDefault = function(sshServer){
        if(sshServer){
            for(var i = 0; i < $scope.hosts.length; i++){
                if(sshServer == $scope.hosts[i].name || ($scope.hosts[i].name == null && sshServer == $scope.hosts[i].host))
                    return $scope.hosts[i];
            }
        }
        return null;
     };

     $scope.restoreDataBaseClick = function(){
        //$scope.checkBGprocess('');
        $scope.onPGCChange($scope.restore.pgc,'restore');
        $scope.onSSHServerChange($scope.restore.sshserver,'restore');
     };

     var sessionPromise = PubSubService.getSession();
     sessionPromise.then(function (val) {
        session = val;

        var userInfoData = bamAjaxCall.getCmdData('userinfo');
        userInfoData.then(function(data) {
            $scope.userInfo = data;
            session.call('com.bigsql.pgList', [$scope.userInfo.email]);
        });

        session.subscribe("com.bigsql.onPgList", function (data) {
            var data = JSON.parse(data);
            $scope.pgListRes = data;
            if(data.length > 0){
                $scope.backup.pgc = data[0].server_name;
                $scope.restore.pgc = data[0].server_name;
                $scope.onPGCChange($scope.backup.pgc,'backup');
                $scope.$apply();
            }
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });
        });

        $scope.checkFileExistense = function(){

            if($scope.backup.directory.indexOf('\\') != -1 && !endsWith($scope.backup.directory,'\\')){
                $scope.backup.directory = $scope.backup.directory + '\\';
            }
            else if($scope.backup.directory.indexOf('\\') == -1 && !endsWith($scope.backup.directory,'/')){
                $scope.backup.directory = $scope.backup.directory + '/';
            }

            var filename = $scope.backup.filename;
            if($scope.backup.format == 'p'){
                if((filename.split('.')).length == 1){
                    filename = filename + ".sql";
                }
            }
            var exists = false;
            var args = {
               "baseDir": $scope.backup.directory + filename,
               "pgcHost": $scope.backup.sshserver
            };
            var fileData = {}
            $scope.loadingBackupAction = true;
            var dirlist = $http.post($window.location.origin + '/api/dirlist', args);
            dirlist.then(function (argument) {
                if(argument.data[0].state != 'completed'){
                    $scope.startBackup();
                    return;
                }
                for (var i = 0; i < argument.data[0].data.length ; i++) {
                    if(argument.data[0].data[i].name == $scope.backup.directory + filename){
                        exists = true;
                        fileData['name'] = filename;
                        fileData['last_accessed'] = argument.data[0].data[i].last_accessed;
                    }
                }
                $scope.loadingBackupAction = false;
                if(exists){
                    //var confirmStatus = confirm("Do you want to override !");
                    var modalInstance = $uibModal.open({
                        templateUrl: '../app/components/partials/confirmOverrideModel.html',
                        controller: 'confirmOverrideModalController',
                    });

                    var returnHtmlText = "<div class='row'>";
                    returnHtmlText = returnHtmlText + "<div class='col-md-12'>";
                    returnHtmlText = returnHtmlText + "<div class='col-sm-8' style='padding-left: 20px;'><b>Name</b></div><div class='col-sm-4' style='padding-left: 20px;'><b>Last Accessed</b></div></div>";
                    returnHtmlText = returnHtmlText + "<div class='col-md-12' style='margin: 2px 2px 6px 6px;cursor: default;'>";
                    returnHtmlText = returnHtmlText + "<div class='col-sm-8'><span class='fa fa-file fa-1x file-img'></span>&nbsp;&nbsp;"+fileData['name']+"</div><div class='col-sm-4'>"+fileData['last_accessed']+"</div></div>";
                    modalInstance.modelBody = $sce.trustAsHtml(returnHtmlText);
                    modalInstance.modalTitle = $sce.trustAsHtml("<b> Selected file for backup already exists, do you want to overwrite?</b><br>");
                    modalInstance.acceptMethod = "initStartBackup";
                    modalInstance.successText = "Yes";
                    modalInstance.failText = "No";
                }
                else{
                    $scope.startBackup();
                }
            });

        }
        $scope.startBackup = function(){
            $cookies.put('directory_backup_'+$scope.backup.sshserver,$scope.backup.directory);
            var args = {
                "action":"backup",
                "host":$scope.backup.hostname,
                "dbName":$scope.backup.dbname,
                "port":$scope.backup.port,
                "username":$scope.backup.user,
                "sshServer":$scope.backup.sshserver,
                "backupDirectory":$scope.backup.directory,
                "fileName":$scope.backup.filename,
                "format":$scope.backup.format,
                "advOptions":$scope.backup.advoptions
            };
            if($scope.backup.password){
                args["password"] = $scope.backup.password;
            }
            $scope.loadingBackupAction = true;
            var backupDb = $http.post($window.location.origin + '/api/pgc/dbdump', args);
            backupDb.then(function (argument) {
                $scope.loadingBackupAction = false;
                $scope.showBackupBgProcess = true;
                $rootScope.$emit('backgroundProcessStarted', argument.data.data.process_log_id);
                $scope.backupDbSpinner = false;
            });
            //$scope.backup.password = "";
            //$scope.backup.filename = "";
        };

        $scope.startRestore = function(){
            $cookies.put('directory_restore_'+$scope.restore.sshserver,$scope.restore.directory);
            var args = {
                "action":"restore",
                "host":$scope.restore.hostname,
                "dbName":$scope.restore.dbname,
                "port":$scope.restore.port,
                "username":$scope.restore.user,
                "sshServer":$scope.restore.sshserver,
                "backupDirectory":$scope.restore.directory,
                "fileName":'',
                "format":$scope.restore.format,
                "advOptions":$scope.restore.advoptions
            };
            if($scope.restore.password){
                args["password"] = $scope.restore.password;
            }
            $scope.loadingRestoreAction = true;
            var backupDb = $http.post($window.location.origin + '/api/pgc/dbrestore', args);
            backupDb.then(function (argument) {
                $scope.loadingRestoreAction = false;
                $scope.showBackupBgProcess = true;
                $rootScope.$emit('backgroundProcessStarted', argument.data.data.process_log_id);
                $scope.backupDbSpinner = false;
            });
            //$scope.restore.password = "";
            //$scope.restore.filename = "";
        };

        $rootScope.$on('hidebgProcess', function (argument) {
            $scope.showBackupBgProcess = false;
        });

        $scope.closeAlert = function (index) {
            $scope.alerts.splice(index, 1);
        };

        $scope.getFiles = function (directory,type){
            var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/browseModel.html',
                controller: 'browseModalController',
            });
            if(type == 'backup'){
                modalInstance.directory = $scope.backup.directory;
                modalInstance.title = "SSH Directory Selecter";
                modalInstance.remote_host = $scope.backup.sshserver;
                var hostInfo = $scope.getSSHDefault($scope.backup.sshserver);
                if(hostInfo){
                    modalInstance.user_name = hostInfo['hostInfo']['user'];
                    modalInstance.host_ip = hostInfo['host'];
                    modalInstance.pgc_home = hostInfo['hostInfo']['home'];
                }
            }
            else{
                modalInstance.directory = $scope.restore.directory;
                modalInstance.title = "SSH File Selecter";
                modalInstance.remote_host = $scope.restore.sshserver;
                var hostInfo = $scope.getSSHDefault($scope.restore.sshserver);
                if(hostInfo){
                    modalInstance.user_name = hostInfo['hostInfo']['user'];
                    modalInstance.host_ip = hostInfo['host'];
                    modalInstance.pgc_home = hostInfo['hostInfo']['home'];
                }
            }
            modalInstance.b_type = type;

        };

        $scope.navigate = function (path){
            window.location = path;
            window.location.reload();
        };

        $rootScope.$on('fillFileName', function (argument,type, filename) {
            if(type == 'backup'){
                $scope.backup.directory = filename;
            }
            else{
                $scope.restore.directory = filename;
            }

         });
         $rootScope.$on('initStartBackup', function () {
            $scope.startBackup();

         });

         $rootScope.$on('getSelectedHost', function (argument, b_type) {
            if(b_type == 'backup'){
                $rootScope.selectedHost = $scope.backup.sshserver;
            }
            else{
                $rootScope.selectedHost =$scope.restore.sshserver;
            }

         });

        //need to destroy all the subscriptions on a template before exiting it
        $scope.$on('$destroy', function () {
            for (var i = 0; i < ajaxSubscriptions.length; i++) {
                $timeout.cancel(ajaxSubscriptions[i])
            }
            for (var i = 0; i < subscriptions.length; i++) {
                session.unsubscribe(subscriptions[i])
            }
        });
}]);