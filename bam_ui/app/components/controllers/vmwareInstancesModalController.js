angular.module('bigSQL.components').controller('vmwareInstancesModalController', ['$scope', '$uibModalInstance', 'PubSubService', 'UpdateComponentsService', 'MachineInfo', '$http', '$window', '$interval', '$rootScope', 'pgcRestApiCall', 'bamAjaxCall', 'htmlMessages', '$uibModal', '$cookies', '$sce', '$timeout', function ($scope, $uibModalInstance, PubSubService, UpdateComponentsService, MachineInfo, $http, $window, $interval, $rootScope, pgcRestApiCall, bamAjaxCall, htmlMessages, $uibModal, $cookies, $sce, $timeout) {

    $scope.loadingSpinner = true;
    $scope.lab = $uibModalInstance.lab;
    $scope.disp_name = $uibModalInstance.disp_name;
    $scope.instance = $uibModalInstance.instance;
    $scope.devRole = $uibModalInstance.devRole;
    $scope.availList = [];
    $scope.vmSelected = -1;
    var addList = [];
    $scope.addToMetadata = false;
    $scope.discoverMsg = htmlMessages.getMessage('loading-azure-pg');
    var session;
    $scope.region = '';
    $scope.showUseConn = false;
    $scope.showAddSSHHost = false;
    $scope.alerts = [];
    var getLabList = pgcRestApiCall.getCmdData('lablist');
    $scope.multiHostlab = false;
    getLabList.then(function (argument) {
        for (var i = argument.length - 1; i >= 0; i--) {
            if(argument[i].lab == "multi-host-mgr"){
                $scope.multiHostlabName = argument[i].disp_name;
            }
            if(argument[i].lab == "multi-host-mgr" && argument[i].enabled == "on"){
                $scope.multiHostlab = true;
            }
        }
    })

    $scope.counter = 20;
    $scope.autorefreshMsg = htmlMessages.getMessage('autorefreshMsg');
    $scope.showCounter = false;
    var stopped;
    var autoRefreshCookie = $cookies.get('autoRefreshCookie');
    $scope.isAutoRefresh = {value : true};
    if (autoRefreshCookie != undefined) {
        $scope.isAutoRefresh.value = (autoRefreshCookie == 'true');
    }
    $scope.countdown = function() {
        $timeout.cancel(stopped);
        stopped = $timeout(function() {
            $scope.counter--; 
            if ($scope.counter < 1) {
                $scope.loadingSpinner = true;
                getInstances(); 
                $scope.counter = 20; 
            }else{
                $scope.countdown();
            }   
        }, 1000);
    };

    $scope.autoRefresh = function (argument) {
        if ($scope.isAutoRefresh.value) {
            $scope.showCounter = true;
            $scope.countdown();
        }else{
            $scope.counter = 20;
            $timeout.cancel(stopped);
        }
        $cookies.put('autoRefreshCookie', $scope.isAutoRefresh.value);
    }

    function getInstances(argument) {
        var userInfoData = pgcRestApiCall.getCmdData('userinfo');
        userInfoData.then(function(data) {
            $scope.userInfo = data;
            var cmd = 'instances '+ $scope.instance +' --email '+$scope.userInfo.email + ' --cloud '+$scope.lab
            var getData = pgcRestApiCall.getCmdData(cmd);
            getData.then(function(data){
                if (data.state == 'info') {
                    $scope.discoverMsg = data.message;
                }else if (data.state=="error") {
                    $scope.loadingSpinner = false;
                    $scope.errMsg = data.message;
                    // $rootScope.$emit('disableLab', $scope.lab, 'off')
                }else if(data.state=="completed"){
                    $scope.showAddSSHHost = true;
                    $scope.loadingSpinner = false;
                    $scope.showUseConn = true;
                    $scope.availList = [];
                    if($scope.instance == 'vm'){
                        $scope.vmList = data.data;
                        for (var i = $scope.vmList.length - 1; i >= 0; i--) {
                            if($scope.vmList[i].private_ips.length > 0){
                                var  RegE = /^\d{1,3}.\d{1,3}.\d{1,3}.\d{1,3}$/ ;
                                if($scope.vmList[i].private_ips[0].match(RegE)) {
                                       $scope.vmList[i].private_ipv4 = $scope.vmList[i].private_ips[0];
                                }
                            }
                        }
                    }
                    if (data.data.length == 0 ) {
                        $scope.noRDS = true;
                        $scope.noInstanceMsg = htmlMessages.getMessage('no-instances');
                    }
                    if ($scope.isAutoRefresh.value) {
                        $timeout.cancel(stopped);
                        $scope.showCounter = true;
                        $scope.countdown();
                    }
               }
            });
        });   
    }

    getInstances();

    $scope.addSSHHost = function () {
        //$uibModalInstance.dismiss('cancel');
        if ($scope.multiHostlab) {
            var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/addHostModal.html',
                windowClass: 'modal',
                controller: 'addHostController',
                scope: $scope,
                keyboard  : false,
                backdrop  : 'static',
            });
            var vmSelected = $scope.vmSelected;
            modalInstance.host_ip = vmSelected["private_ipv4"];
            modalInstance.host_name = vmSelected["name"];
        }else{
            $scope.labNotEnabled = true;
            var getMessage = $sce.trustAsHtml(htmlMessages.getMessage('labNotEnabledOnModel').replace('{{lab}}', $scope.multiHostlabName));

            $scope.alerts.push({
                msg: getMessage,
                type: 'warning'
            });
        }
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

    $scope.vmOptionToggled = function(vm){
        $scope.showAddSSHHost = true;
        $scope.vmSelected = vm;
    }


    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.cancel = function () {
        $rootScope.$emit('refreshUpdateDate');
        $timeout.cancel(stopped);
        $uibModalInstance.dismiss('cancel');
    };

}]);
