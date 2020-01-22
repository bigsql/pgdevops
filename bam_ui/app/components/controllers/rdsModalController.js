angular.module('bigSQL.components').controller('rdsModalController', ['$scope', '$uibModalInstance', 'PubSubService', 'UpdateComponentsService', 'MachineInfo', '$http', '$window', '$interval', '$rootScope', 'bamAjaxCall', 'pgcRestApiCall', 'htmlMessages', '$uibModal', '$cookies', '$sce', '$timeout', function ($scope, $uibModalInstance, PubSubService, UpdateComponentsService, MachineInfo, $http, $window, $interval, $rootScope, bamAjaxCall, pgcRestApiCall, htmlMessages, $uibModal, $cookies, $sce, $timeout) {

    $scope.loadingSpinner = true;
    $scope.lab = $uibModalInstance.lab;
    $scope.disp_name = $uibModalInstance.disp_name;
    $scope.instance = $uibModalInstance.instance;
    $scope.searchEvent = $uibModalInstance.searchEvent;
    $scope.devRole = $uibModalInstance.devRole;
    $scope.availList = [];
    var addList = [];
    $scope.addToMetadata = false;
    $scope.discoverMsg = htmlMessages.getMessage('loading-regions');
    var session;
    $scope.region = '';
    $scope.showUseConn = false;
    $scope.showAddSSHHost = false;
    $scope.ec2Selected = -1;
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
    
    var regions = pgcRestApiCall.getCmdData('metalist aws-regions');
    regions.then(function(data){
        $scope.loadingSpinner = false;
        $scope.regions = data;
        var regionCookie = $cookies.get('lastSelRegion');
        if(regionCookie){
            $scope.region = regionCookie;
        }
        if ($scope.searchEvent) {
            $scope.regionChange($scope.region);
        }
    });

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
        stopped = $timeout(function() {
            $scope.counter--; 
            if ($scope.counter < 1) {
                $scope.regionChange($scope.region); 
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

    $scope.regionChange = function (region) {
        $scope.counter = 20;
        $timeout.cancel(stopped);
        $scope.showUseConn = true;
        if (region==null) {
            region = '';
        }
        $cookies.put('lastSelRegion', region);
        $scope.availList = [];
        $scope.loadingSpinner = true;
        $scope.noRDS = false;
        $scope.ec2List = [];
        $scope.checked = false;
        $scope.discoverMsg = 'Searching';
        var sessionPromise = PubSubService.getSession();
        sessionPromise.then(function (val) {
            session = val;  
            sessionActive(session);
            if (region) {
                session.call('com.bigsql.instancesList', [$scope.instance, $scope.userInfo.email, region, $scope.lab]);
            }else{
                session.call('com.bigsql.instancesList', [$scope.instance, $scope.userInfo.email, '', $scope.lab]);
            }
            $scope.region = region;
        });
    }

    var userInfoData = bamAjaxCall.getCmdData('userinfo');
    userInfoData.then(function(data) {
        $scope.userInfo = data;
        var sessionPromise = PubSubService.getSession();
        sessionPromise.then(function (val) {
            session = val;
            sessionActive(session);
        });
    });


    function sessionActive(session) {
        for (var key in session._subscriptions) { 
            delete session._subscriptions[key];
        }
        session.subscribe('com.bigsql.onInstancesList', function (data) {
            var data = JSON.parse(data[0]);
            if (data[0].state == 'info') {
                $scope.discoverMsg = data[0].msg;
            }else if (data[0].state=="error") {
                $scope.loadingSpinner = false;
                $scope.errMsg = data[0].msg;
                // $rootScope.$emit('disableLab', $scope.lab, 'off')
            }else if(data[0].state=="completed"){
                $scope.loadingSpinner = false;
                $scope.availList = [];
                $scope.rdsList = data[0].data;
                for (var i = $scope.rdsList.length - 1; i >= 0; i--) {
                    if($scope.rdsList[i].status == 'available'){
                        if ($scope.rdsList[i].is_in_pglist == true) {
                            $scope.rdsList[i].selected = true;
                            $scope.checked = true;
                        }
                        $scope.availList.push($scope.rdsList[i]);
                    }
                }
                $scope.newAvailList = $($scope.availList).filter(function(i,n){ return n.is_in_pglist != true });
                if($scope.instance == 'vm'){
                    $scope.ec2List = data[0].data;
                    $scope.showAddSSHHost = true;
                }
                if (data[0].data.length == 0 ) {
                    $scope.noRDS = true;
                    $scope.noInstanceMsg = htmlMessages.getMessage('no-instances');
                }
                if ($scope.isAutoRefresh.value) {
                    $scope.showCounter = true;
                    $scope.countdown();
                }
            }
           $scope.$apply();
        });
    }

    // var rdslist = bamAjaxCall.getCmdData('rdslist');
    // rdslist.then(function (data) {
    //     $scope.loadingSpinner = false;
    //     if (data[0].state=="error") {
    //         $scope.errMsg = data[0].msg;
    //         $rootScope.$emit('disableLab', $scope.lab, 'off')
    //     }else{
    //         $scope.rdsList = data;
    //         for (var i = $scope.rdsList.length - 1; i >= 0; i--) {
    //             if($scope.rdsList[i].status == 'available'){
    //                 $scope.availList.push($scope.rdsList[i]);
    //             }
    //         }
    //         if ($scope.availList.length == 0) {
    //             $scope.noRDS = true;
    //             $scope.noRDSMsg = htmlMessages.getMessage('no-rds');
    //         }
    //     }
    // });

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
                args['project'] = 'aws';
                args['rds'] = true;
                args['region'] = $scope.availList[i].region;
                argsJson.push(args);
            }
        }
        var multiArgs = {'multiple': argsJson}
        var addToMetaData = bamAjaxCall.postData('/api/add_to_metadata', multiArgs );
        addToMetaData.then(function (argument) {
            $window.location = '#/hosts'
            $rootScope.$emit('refreshPgList');
            $rootScope.$emit('refreshUpdateDate');
            $timeout.cancel(stopped);
            $uibModalInstance.dismiss('cancel');
        } );
    };

    $scope.openRDSdetails = function (instance, region, db_class) {
        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/rdsDetailsModal.html',
            controller: 'rdsDetailsModalController',
            size : 'lg'
        });
        modalInstance.instance = instance;
        modalInstance.region = region;
        modalInstance.db_class = db_class;
    }

    $scope.toggleAll = function() {
        if($scope.isAllSelected){
            $scope.isAllSelected = false;
        }else{
            $scope.isAllSelected = true;
        }
        angular.forEach($scope.availList, function(itm){ itm.selected = $scope.isAllSelected; });
        angular.forEach($scope.ec2List, function(itm){ itm.selected = $scope.isAllSelected; });
    }

    $scope.optionToggled = function(){
        $scope.checked = false;
        angular.forEach($scope.newAvailList, function (item) {
            if(item.selected){
                $scope.checked = true;
            }
        });
    }

    $scope.ec2OptionToggled = function(ec2){
        $scope.showAddSSHHost = true;
        $scope.ec2Selected = ec2;
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
            var selectedEc2 = $scope.ec2Selected;
            modalInstance.host_ip = selectedEc2["public_ips"];
            modalInstance.host_name = selectedEc2["name"];
        }else{
            $scope.labNotEnabled = true;
            var getMessage = $sce.trustAsHtml(htmlMessages.getMessage('labNotEnabledOnModel').replace('{{lab}}', $scope.multiHostlabName));

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
