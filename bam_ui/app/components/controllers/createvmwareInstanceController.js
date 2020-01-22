angular.module('bigSQL.components').controller('createvmwareInstanceController', ['$scope', '$uibModalInstance', 'PubSubService', 'UpdateComponentsService', 'MachineInfo', '$http', '$window', '$interval', '$rootScope', 'pgcRestApiCall', 'bamAjaxCall', 'htmlMessages', '$uibModal', '$cookies', function ($scope, $uibModalInstance, PubSubService, UpdateComponentsService, MachineInfo, $http, $window, $interval, $rootScope, pgcRestApiCall, bamAjaxCall, htmlMessages, $uibModal, $cookies) {

    $scope.loadingSpinner = true;
    $scope.lab = $uibModalInstance.lab;
    $scope.disp_name = $uibModalInstance.disp_name;
    $scope.instance = $uibModalInstance.instance;
    $scope.availList = [];
    var addList = [];
    $scope.addToMetadata = false;
    $scope.discoverMsg = htmlMessages.getMessage('loading-azure-pg');
    var session;
    $scope.region = '';
    $scope.showUseConn = false;

    $scope.gettingImages = true;

    $scope.data = {
        'computer_name' : '',
        'clonefrom' : '',
        'admin_username' : '',
        'password' : ''
        //'num_cpus' : '',
        //'vm_size' : ''
    }

    $scope.creatingVM = htmlMessages.getMessage('create-azure-vm');

    var getData = pgcRestApiCall.getCmdData('instances vm  --cloud vmware');
    getData.then(function(data){
        $scope.gettingImages = false;
        if(data.state != 'completed'){
            $scope.showErrMsg = true;
            $scope.errMsg = data.message;
        }
        else{
            $scope.images = data.data;
        }
    });

    $scope.createVM = function(){
        $scope.creating = true;
        $scope.showErrMsg = false;
        var data = [];
        data.push($scope.data);
        var requestData = {
            'cloud' : 'vmware',
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
                $rootScope.$emit("vmwareCreated", data.message);
                $uibModalInstance.dismiss('cancel');
              }
        })
    }


    $scope.toggleAll = function() { 
        if($scope.isAllSelected){
            $scope.isAllSelected = false;
        }else{
            $scope.isAllSelected = true;
        }
        angular.forEach($scope.availList, function(itm){ itm.selected = $scope.isAllSelected; });
        angular.forEach($scope.vmList, function(itm){ itm.selected = $scope.isAllSelected; });
    }

    $scope.optionToggled = function(){
        $scope.checked = false;
        angular.forEach($scope.newAvailList, function (item) {
            if(item.selected){
                $scope.checked = true;
            }
        });
    }


    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.cancel = function () {
        $rootScope.$emit('refreshUpdateDate');
        $uibModalInstance.dismiss('cancel');
    };

}]);
