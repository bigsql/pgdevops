angular.module('bigSQL.components').controller('browseModalController', ['$scope', '$uibModalInstance', 'PubSubService', '$rootScope', '$uibModal', 'bamAjaxCall', '$http', '$window', '$interval', '$timeout', function ($scope, $uibModalInstance, PubSubService, $rootScope, $uibModal, bamAjaxCall, $http, $window, $interval, $timeout) {

    $scope.directory = $uibModalInstance.directory;
    $scope.title = $uibModalInstance.title;
    $scope.type = $uibModalInstance.b_type;
    $scope.remoteHost = $uibModalInstance.remote_host;
    $scope.hostIp = $uibModalInstance.host_ip;
    $scope.userName = $uibModalInstance.user_name;
    $scope.pgcHome = $uibModalInstance.pgc_home;
    $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
    };
    $scope.loading = true;
    if(!$scope.directory){
        $scope.directory = $scope.pgcHome;
    }
    $scope.backLink = $scope.directory;
    $scope.currentPath = $scope.directory;

    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

    if($scope.directory.indexOf('\\') != -1 && !endsWith($scope.directory,'\\')){
        $scope.directory = $scope.directory + '\\';
    }
    else if($scope.directory.indexOf('/') != -1 && !endsWith($scope.directory,'/')){
        $scope.directory = $scope.directory + '/';
    }
    $scope.directory = $scope.directory + "*"
    if($scope.type == 'backup'){
        if($scope.directory.indexOf('\\') != -1)
            $scope.directory = $scope.directory + "\\\\"
        else
            $scope.directory = $scope.directory + "/"
    }
    var args = {
       "baseDir": $scope.directory,
       "pgcHost":$scope.remoteHost
    };

    var dirlist = $http.post($window.location.origin + '/api/dirlist', args);
    dirlist.then(function (argument) {
        $scope.errorText = "";
        if(argument.data[0].state != 'completed'){
            $scope.errorText = argument.data[0].msg;
        }
        else{
            $scope.files = argument.data[0].data;
        }
        $scope.loading = false;
    });

    $scope.getFiles = function(filename,type){
        $scope.errorText = "";
        $scope.loading = true;
        if(['d','.'].indexOf(type) != -1){
            if(filename.indexOf('\\') != -1 && !endsWith(filename,'\\')){
                var temp_filename = filename + '\\*';
            }
            else if(filename.indexOf('/') != -1 && !endsWith(filename,'/')){
                var temp_filename = filename + '/*';
            }
            else{
                var temp_filename = filename + "*";
            }
           if($scope.type == 'backup'){
            if($scope.directory.indexOf('\\') != -1)
                temp_filename = temp_filename + "\\\\"
            else
                temp_filename = temp_filename + "/"
           }
           var args = {
               "baseDir": temp_filename,
               "pgcHost":$scope.remoteHost
            };
            var dirlist = $http.post($window.location.origin + '/api/dirlist', args);
            dirlist.then(function (argument) {
                if(argument.data[0].state != 'completed'){
                    $scope.errorText = argument.data[0].msg;
                }
                else{
                    $scope.files = argument.data[0].data;
                    $scope.currentPath = filename;
                }
                $scope.loading = false;
            });
        }
        else{
            $rootScope.$emit("fillFileName",$scope.type,filename);
            $scope.cancel();
        }
    };

    $scope.selectFile = function(filename){
        $rootScope.$emit("fillFileName",$scope.type,filename);
        $scope.cancel();
    };

    $scope.navigateBack = function(index,currentPath){
        if(currentPath.indexOf('\\') != -1){
            var path = currentPath.split('\\').slice(0,index+1).join('\\');
            $scope.getFiles(path+'\\','d');
        }
        else{
            var path = currentPath.split('/').slice(1,index+1).join('/');
            $scope.getFiles('/'+path+'/','d');
        }
    };

    $scope.getName = function(filename){
        if((filename.lastIndexOf('/') != -1 && filename.lastIndexOf('/') + 1 == filename.length) || (filename.lastIndexOf('\\') != -1 && filename.lastIndexOf('\\') + 1 == filename.length)){
            filename = filename.substring(0, filename.length - 1);
        }
        if(filename.lastIndexOf('\\') != -1 )
            return filename.split('\\').pop();
        return filename.split('/').pop();
    }

    $scope.getNavigateLinks = function(path){
        if(path.indexOf('\\') != -1){
            return path.split('\\');
        }
        return path.split('/');
    }
}]);