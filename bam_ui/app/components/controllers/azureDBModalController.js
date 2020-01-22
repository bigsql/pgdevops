angular.module('bigSQL.components').controller('azureDBModalController', ['$scope', '$uibModalInstance', 'PubSubService', 'UpdateComponentsService', 'MachineInfo', '$http', '$window', '$interval', '$rootScope', 'pgcRestApiCall', 'bamAjaxCall', 'htmlMessages', '$uibModal', '$cookies', '$sce', '$timeout', function ($scope, $uibModalInstance, PubSubService, UpdateComponentsService, MachineInfo, $http, $window, $interval, $rootScope, pgcRestApiCall, bamAjaxCall, htmlMessages, $uibModal, $cookies, $sce, $timeout) {

    $scope.loadingSpinner = true;
    $scope.lab = $uibModalInstance.lab;
    $scope.disp_name = $uibModalInstance.disp_name;
    $scope.instance = $uibModalInstance.instance;
    $scope.devRole = $uibModalInstance.devRole;
    $scope.availList = [];
    var addList = [];
    $scope.addToMetadata = false;
    $scope.discoverMsg = htmlMessages.getMessage('loading-azure-pg');
    var session;
    $scope.region = '';
    $scope.showUseConn = false;

    $scope.showAddSSHHost = false;
    $scope.vmSelected = -1;
    $scope.alerts = [];
    $scope.labNotEnabled = false;

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
                    $scope.loadingSpinner = false;
                    $scope.showUseConn = true;
                    $scope.availList = [];
                    if($scope.instance == 'db'){
                        $scope.rdsList = data.data;
                        for (var i = $scope.rdsList.length - 1; i >= 0; i--) {
                            if ($scope.rdsList[i].is_in_pglist == true) {
                                $scope.rdsList[i].selected = true;
                                $scope.checked = true;
                            }
                            $scope.availList.push($scope.rdsList[i]);
                        }
                        $scope.newAvailList = $($scope.availList).filter(function(i,n){ return n.is_in_pglist != true });
                    }
                    else if($scope.instance == 'vm'){
                        $scope.vmList = data.data;
                        $scope.showAddSSHHost = true;
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

    $scope.createConnPgadmin = function(index){
        $scope.addToMetadata = true;
        $scope.addToMetadataMsg = htmlMessages.getMessage('add-to-pgadmin');
        var argsJson = [];
        for (var i = $scope.availList.length - 1; i >= 0; i--) {
            if($scope.availList[i].selected && !$scope.availList[i].is_in_pglist){
                var args = {};
                args['db'] = $scope.availList[i].dbname;
                args['port'] = $scope.availList[i].port;
                args['user'] = $scope.availList[i].user;
                args['host'] = $scope.availList[i].host;
                args['component'] = $scope.availList[i].instance;
                args['project'] = 'azure';
                args['rds'] = true;
                args['region'] = $scope.availList[i].region;
                argsJson.push(args);
            }
        }
        var multiArgs = {'multiple': argsJson}
        var addToMetaData = bamAjaxCall.postData('/api/add_to_metadata', multiArgs );
        addToMetaData.then(function (argument) {
            $window.location = '#/hosts'
            $timeout.cancel(stopped);
            $rootScope.$emit('refreshPgList');
            $rootScope.$emit('refreshUpdateDate');
            $uibModalInstance.dismiss('cancel');
        } );
    };

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
            var selectedVm = $scope.vmSelected;
            if(Array.isArray(selectedVm["public_ips"])){
                if(selectedVm["public_ips"].length > 0){
                    modalInstance.host_ip = selectedVm["public_ips"][0];
                }
                else{
                    modalInstance.host_ip = "";
                }
            }
            else{
                modalInstance.host_ip = selectedVm["public_ips"];
            }
            modalInstance.host_name = selectedVm["name"];
        }else{
            $scope.labNotEnabled = true;
            var getMessage = $sce.trustAsHtml(htmlMessages.getMessage('labNotEnabledOnModel').replace('{{lab}}', $scope.multiHostlabName).replace('{{method}}','cancel()'));

            $scope.alerts.push({
                msg: getMessage,
                type: 'warning'
            });
        }
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
