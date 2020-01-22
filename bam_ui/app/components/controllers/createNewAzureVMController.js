angular.module('bigSQL.components').controller('createNewAzureVMController', ['$scope', '$stateParams', 'PubSubService', '$rootScope', '$interval','MachineInfo', 'pgcRestApiCall', '$uibModalInstance', '$uibModal', 'htmlMessages', function ($scope, $stateParams, PubSubService, $rootScope, $interval, MachineInfo, pgcRestApiCall, $uibModalInstance, $uibModal, htmlMessages) {

    var session;
    $scope.showErrMsg = false;
    $scope.creating = false;


    $scope.loading = true;
    $scope.firstStep = true;
    $scope.secondStep = false;
    $scope.disableInsClass = true;
    $scope.loadingResGroups = true;
    $scope.days = {'Monday': 'mon', 'Tuesday': 'tue', 'Wednesday' : 'wed', 'Thursday': 'thu', 'Friday' : 'fri', 'Saturday': 'sat', 'Sunday': 'sun'};

    $scope.creatingAzureVM = htmlMessages.getMessage('create-azure-vm');
    $scope.valiedCred = true;

    $scope.data = {
        'region' : 'southcentralus',
        'group_name' : '',
        'vm_size' : 'Basic_A0',
        'computer_name' : '',
        'publisher':'',
        'offer' : '',
        'sku': '',
        'version':'latest',
        'admin_username':'',
        'password':'',
        'storage_account' : ''
    };

    $scope.loading = false;
    var regions = pgcRestApiCall.getCmdData('metalist azure-regions');
    regions.then(function(data){
        $scope.loading = false;
        $scope.regionsList = data;
        $scope.data.region = 'southcentralus';
        $scope.getInstanceType('southcentralus');
    });

    $scope.regionChange = function(){
        $scope.loadingResGroups = true;
        $scope.loadingStorageAccounts =true;
        if($scope.data.region){
            var resource_groups = pgcRestApiCall.getCmdData('metalist res-group --cloud azure --region '+ $scope.data.region )
        }else{
            var resource_groups = pgcRestApiCall.getCmdData('metalist res-group --cloud azure')
        }
        resource_groups.then(function (data) {
            if(data.state != 'completed'){
                $scope.showErrMsg = true;
                $scope.errMsg = data[0].msg;
                $scope.stopAllLoading();
            }
            else{
                $scope.res_groups = data.data;
                if ($scope.res_groups.length > 0) {
                    $scope.data.group_name = $scope.res_groups[0].name;
                    $scope.storageChange();
                }else{
                    $scope.data.group_name = '';
                    $scope.data.storage_account = '';
                }
            }
            $scope.loadingResGroups = false;
        });
    }

    $scope.storageChange = function (argument) {
        $scope.loadingStorageAccounts = true;
        $scope.data.subnet_name = ''
        var getStorageAcs = pgcRestApiCall.getCmdData('metalist storage-accounts --cloud azure --region '+ $scope.data.region  + ' --group ' + $scope.data.group_name + ' --type db');
        getStorageAcs.then(function (data) {
            if(data.state != 'completed'){
                $scope.showErrMsg = true;
                $scope.errMsg = data[0].msg;
                $scope.stopAllLoading();
            }
            else{
                if (data.data.length > 0) {
                    $scope.storageAccounts = data.data;
                }else{
                    $scope.storage_account = '';
                }
             }
            $scope.loadingStorageAccounts = false;
        });

        var getSubnet = pgcRestApiCall.getCmdData('metalist vpc-list --cloud azure --type vm --group ' + $scope.data.group_name );
        getSubnet.then(function (data) {
            if(data.state != 'completed'){
                $scope.showErrMsg = true;
                $scope.errMsg = data[0].msg;
                $scope.stopAllLoading();
            }
            else{
                $scope.subnets = data.data;
            }
        });

    }

    $scope.changeSubnet = function (argument) {
        if ($scope.data.network_name) {
            for (var i = $scope.subnets.length - 1; i >= 0; i--) {
               if($scope.subnets[i].vpc == $scope.data.network_name){
                $scope.data.subnet_name = $scope.subnets[i].subnet_group;
               }
            }
        }else{
            $scope.data.subnet_name = '';
        }
    }

    $scope.getInstanceType = function (region) {
        $scope.loadingInsType = true;
        var ins_types = pgcRestApiCall.getCmdData('metalist instance-type --region ' + $scope.data.region +' --cloud azure --type vm' );
        ins_types.then(function (data) {
            if(data.state != 'completed'){
                $scope.showErrMsg = true;
                $scope.errMsg = data[0].msg;
                $scope.stopAllLoading();
            }
            else{
                $scope.ins_types = data.data;
            }
            $scope.loadingInsType = false;
        });
    }

    var imagesList = pgcRestApiCall.getCmdData('metalist azure-images');
    imagesList.then(function (argument) {
        $scope.skuMapping = argument;
    });


    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
    	session = val;
    });
    
    $scope.publisherChange = function(sku){
        $scope.data['offer'] = sku.offer;
        $scope.data['publisher'] = sku.publisher;
        $scope.data['sku'] = sku.sku;
        $scope.data['version'] = sku.version;
    }


    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    $scope.createVM = function(){
        $scope.creating = true;
        $scope.showErrMsg = false;
        var data = [];
        data.push($scope.data);
        var requestData = {
            'cloud' : 'azure',
            'type' : 'vm',
            'params' : data
        }
        var createVMResponse = pgcRestApiCall.postData('create',requestData)
        createVMResponse.then(function (data) {
            $scope.creating = false;
            if(data.code != 200){
                $scope.showErrMsg = true;
                $scope.errMsg = data.message;
              }else{
                $rootScope.$emit("RdsCreated", data.message);
                $uibModalInstance.dismiss('cancel');
              }
        })
    }

    var pwdRegExp = new RegExp("^(?=.*?[A-Za-z])(?=.*?[0-9])(?=.*?[~$@£!*?&^<>()\\[\\]\\=/{}`|_+,.:;])[A-Za-z0-9~$@£!*?&^<>()\\[\\]\\=/{}`|_+,.:;]{12,72}$(?!.*['%/#-])");
    var InsRegExp = new RegExp("^[a-z0-9-]+$");
    var userNameExp = new RegExp("^[a-zA-Z]+$");
    $scope.pwdValid = false;
    $scope.instanceNameValid = false;
    $scope.userNameValid = false;

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

    $scope.next = function(region){
        $scope.firstStep = false;
        $scope.secondStep = true;
    }

    $scope.previous = function(data){
        if($scope.secondStep){
            $scope.secondStep = false;
            $scope.firstStep = true;
            $scope.dbEngVersions = [];
            $scope.data.engine_version = '';
        }else if($scope.thirdStep){
            $scope.thirdStep = false;
            $scope.secondStep = true;
            $scope.showErrMsg = false;
        }
    }

    $scope.stopAllLoading = function(){
        $scope.loadingResGroups = false;
        $scope.loadingInsType = false;
        $scope.loadingStorageAccounts = false;
    }

    $scope.regionChange();


}]);