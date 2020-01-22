angular.module('bigSQL.components').controller('createNewAzureDBController', ['$scope', '$stateParams', 'PubSubService', '$rootScope', '$interval','MachineInfo', 'bamAjaxCall', '$uibModalInstance', '$uibModal', 'pgcRestApiCall', 'htmlMessages', function ($scope, $stateParams, PubSubService, $rootScope, $interval, MachineInfo, bamAjaxCall, $uibModalInstance, $uibModal, pgcRestApiCall, htmlMessages) {

    var session;
    $scope.showErrMsg = false;
    $scope.creating = false;


    $scope.loading = true;
    $scope.firstStep = true;
    $scope.secondStep = false;
    $scope.disableInsClass = true;
    $scope.loadingResGroups = true;
    $scope.days = {'Monday': 'mon', 'Tuesday': 'tue', 'Wednesday' : 'wed', 'Thursday': 'thu', 'Friday' : 'fri', 'Saturday': 'sat', 'Sunday': 'sun'};
    $scope.data = {
        'region' : 'southcentralus',
        'master_user' : '',
        'instance' : '',
        'password' : '',
        'engine_version' : '9.6',
        'group_name' : '',
        'ssl_mode' : "Disabled",
        'start_ip':"0.0.0.0",
        'end_ip':"255.255.255.255",
        'publicly_accessible' : true
    };
    $scope.loading = false;

    var regions = pgcRestApiCall.getCmdData('metalist azure-regions');
    regions.then(function(data){
        $scope.loading = false;
        $scope.regions = data;
        $scope.data.region = 'southcentralus';
    });

    $scope.creatingAzureDB = htmlMessages.getMessage('create-azure-db');

    $scope.changePubAcs = function () {
        if (!$scope.data.publicly_accessible) {
            $scope.data.start_ip = '';
            $scope.data.end_ip = '';
        }else{
            $scope.data.start_ip = "0.0.0.0";
            $scope.data.end_ip = "255.255.255.255";
        }
    }

    $scope.regionChange = function(){
        $scope.loadingResGroups = true;
        if($scope.data.region){
            var resource_groups = pgcRestApiCall.getCmdData('metalist res-group --cloud azure --region '+ $scope.data.region )
        }else{
            var resource_groups = pgcRestApiCall.getCmdData('metalist res-group --cloud azure')
        }
        resource_groups.then(function (data) {
            if(data.state != 'completed'){
                $scope.showErrMsg = true;
                $scope.errMsg = data[0].msg;
            }
            else{
                $scope.res_groups = data.data;
            }
            $scope.loadingResGroups = false;
        });
    }
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    $scope.createVM = function(){
        $scope.creating = true;
        $scope.showErrMsg = false;
        if ($scope.data.publicly_accessible) {
            $scope.data.publicly_accessible = "Yes";
        }else{
            $scope.data.publicly_accessible = "No";
        }
        var data = [];
        data.push($scope.data);
        var requestData = {
            'cloud' : 'azure',
            'type' : 'db',
            'params' : data
        }
        var createAzureDB = pgcRestApiCall.postData('create',requestData)
        createAzureDB.then(function (data) {
            $scope.creating = false;
            if(data.code != 200){
                $scope.showErrMsg = true;
                $scope.errMsg = data.message;
              }else{
                $rootScope.$emit("AzureDBCreated", data.message);
                $uibModalInstance.dismiss('cancel');
              }
        })
    }

    var pwdRegExp = new RegExp("^(?=.*?[A-Za-z])(?=.*?[0-9])(?=.*?[~$@£!*?&^<>()\\[\\]\\=/{}`|_+,.:;])[A-Za-z0-9~$@£!*?&^<>()\\[\\]\\=/{}`|_+,.:;]{12,72}$(?!.*['%/#-])");
    var InsRegExp = new RegExp("^[a-z0-9-]+$");
    var userNameExp = new RegExp("^[a-zA-Z]+$");

    $scope.validationInputPwdText = function(value) {
        if (pwdRegExp.test(value)) {
            $scope.pwdValid = true;
        }else{
            $scope.pwdValid = false
        }
    };

    $scope.validateInsName = function (value) {
        if (InsRegExp.test(value)) {
            $scope.instanceNameValid = true;
        }else{
            $scope.instanceNameValid = false
        }
    }

    $scope.validateUserName = function (value) {
        if (userNameExp.test(value)) {
            $scope.userNameValid = true;
        }else{
            $scope.userNameValid = false
        }
    }

    $scope.regionChange();


}]);