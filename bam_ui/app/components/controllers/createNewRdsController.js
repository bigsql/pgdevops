angular.module('bigSQL.components').controller('createNewRdsController', ['$scope', '$stateParams', 'PubSubService', '$rootScope', '$interval','MachineInfo', 'pgcRestApiCall', '$uibModalInstance', '$uibModal', '$cookies', function ($scope, $stateParams, PubSubService, $rootScope, $interval, MachineInfo, pgcRestApiCall, $uibModalInstance, $uibModal, $cookies) {

    var session;
    $scope.showErrMsg = false;
    $scope.creating = false;


    $scope.loading = true;
    $scope.firstStep = true;
    $scope.secondStep = false;
    $scope.disableInsClass = true;
    $scope.days = {'Monday': 'mon', 'Tuesday': 'tue', 'Wednesday' : 'wed', 'Thursday': 'thu', 'Friday' : 'fri', 'Saturday': 'sat', 'Sunday': 'sun'};

    $scope.backup = {
        'backup_window_show' : 'no',
        'backup_window_hours' : '00',
        'backup_window_mins' : '00',
        'backup_window_duration' : '00',
    }

    $scope.maintanance = {
        'main_window_show' : 'no',
        'main_window_day' : 'mon',
        'main_window_hours': '00',
        'main_window_mins' : '00',
        'main_window_duration': '00',
    }

    $scope.vpc_security = {group_ids: ''};
    $scope.security = {groups_list: ''};

    $scope.data = {
        'engine' : 'postgres',
        'allocated_storage' : 5,
        'port' : 5432,
        'public_accessible' : false,
        'copy_tags' : false,
        'storage_type' : 'gp2',
        'multi_az' : false,
        'backup_retention_period' : 7,
        'enable_mon' : false,
        'version_upgrade' : false,
        'storage_encrypted' : false,
        'monitoring_interval' : 60,
        'monitoring_role' : 'default',
        'backup_window' : 'no',
        'monitor_arn' : 'Default',
        'vpc_security_group_ids': [],
        // 'security_groups' : [],
        'licence_model': '',
        'iops' : '',
        'option_group_name' : '',
        'charset' : '',
        'tags' : '',
        'cluster_identifier' : '',
        'tde_arn' : '',
        'tde_arn_pwd' : '',
        'kms_key_id' : '',
        'iam_role' : ''
    };


    var regions = pgcRestApiCall.getCmdData('metalist aws-regions');
    regions.then(function(data){
        $scope.loading = false;
        $scope.regions = data;
        $scope.data.region = $scope.regions[0].region;
    });

    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
    	session = val;
        // session.subscribe("com.bigsql.onCreateInstance", function(data){
        //   $scope.creating = false;
        //   var data = JSON.parse(data);
        //   if(data[0].state == 'error'){
        //     $scope.showErrMsg = true;
        //     $scope.errMsg = data[0].msg;
        //   }else{
        //     $rootScope.$emit("RdsCreated", data[0].msg);
        //     $uibModalInstance.dismiss('cancel');
        //   }
        //   $scope.$apply();
        // })

    });

    $scope.versionChange = function(argument){
        $scope.disableInsClass = true;
        $scope.data.db_class = '';
        $scope.dbGroups = [];
        $scope.optionGroups = '';
        $scope.data.db_parameter_group = [];
        $scope.data.option_group = '';
        $scope.types = '';
        $scope.data.db_class = [];
        var getInstanceClass = pgcRestApiCall.getCmdData("metalist instance-class --region=" + $scope.data.region + " --version=" + $scope.data.engine_version + " --cloud aws --type db");
        getInstanceClass.then(function(data){
            if(data.state != 'completed'){
                $scope.showErrMsg = true;
                $scope.errMsg = data[0].msg;
            }
            else{
            $scope.types = data.data;
            if ($scope.types.length>0) {
                $scope.data.db_class = 'db.t2.micro';
            }
            }
            $scope.disableInsClass = false;
        });
        for(var i = 0; i < $scope.dbEngVersions.length; ++i){
            if($scope.dbEngVersions[i].EngineVersion == $scope.data.engine_version){
                $scope.dbGroups = $scope.dbEngVersions[i].DBParameterGroups;
                $scope.optionGroups = $scope.dbEngVersions[i].OptionGroups;
                if($scope.dbGroups.length > 0){
                    $scope.data.db_parameter_group = $scope.dbGroups[0].DBParameterGroupName;
                }
                if($scope.optionGroups.length > 0){
                    $scope.data.option_group = $scope.optionGroups[0].OptionGroupName;
                }
            }
        }
    }

    $scope.vpcChange = function(argument){
        for (var i = 0; i < $scope.networkSec.length; ++i) {
            if($scope.networkSec[i].vpc == $scope.vpc.select){
                $scope.data.subnet_group = $scope.networkSec[i].subnet_group;
                $scope.availableZones = $scope.networkSec[i].zones;
                if($scope.availableZones.length > 0){
                    $scope.data.availability_zone = $scope.availableZones[0].name;
                }
                for (var j = 0; j < $scope.availableZones.length; ++j) {

                }
            };
        }
    }

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    $scope.createRDS = function(){
        $scope.data.vpc_security_group_ids = [];
        // $scope.data.security_groups = [];
        $scope.data.maintenance_window = '';
        $scope.data.backup_window = '';
        if(!$scope.data.enableMon){
            $scope.data.monitoring_interval = 0;
            $scope.data.monitor_arn = '';
        }
        if($scope.backup.backup_window_show=='yes'){
            var backTotalTime = parseInt($scope.backup.backup_window_hours) + parseInt($scope.backup.backup_window_duration);
            if(backTotalTime<10){backTotalTime="0"+backTotalTime};
            $scope.data.backup_window = $scope.backup.backup_window_hours + ':' + $scope.backup.backup_window_mins + '-' + backTotalTime + ':' + $scope.backup.backup_window_mins;
        }
        if($scope.maintanance.main_window_show=='yes'){
            var mainTotalTime = parseInt($scope.maintanance.main_window_hours) + parseInt($scope.maintanance.main_window_duration);
            if(mainTotalTime<10){mainTotalTime="0"+mainTotalTime};
            $scope.data.maintenance_window = $scope.maintanance.main_window_day + ':' + $scope.maintanance.main_window_hours + ':' + $scope.maintanance.main_window_mins + '-' + $scope.maintanance.main_window_day + ':' + mainTotalTime + ':' + $scope.maintanance.main_window_mins;
        }
        $scope.creating = true;
        $scope.showErrMsg = false;
        $cookies.put('lastSelRegion', $scope.data.region);
        var data = [];
        data.push($scope.data);
        // if ($scope.security.groups_list) {
        //     data[0].security_groups.push($scope.security.groups_list);
        // }
        if ($scope.vpc_security.group_ids) {
            data[0].vpc_security_group_ids.push($scope.vpc_security.group_ids);
        }
        var requestData = {
            'cloud' : 'aws',
            'type' : 'db',
            'params' : data
        }
        var createdb = pgcRestApiCall.postData('create',requestData)
        createdb.then(function (data) {
            $scope.creating = false;
            if(data.code != 200){
                $scope.showErrMsg = true;
                $scope.errMsg = data.message;
            }else{
                $rootScope.$emit("PostgresRdsCreated", data.message);
                $uibModalInstance.dismiss('cancel');
            }
        });
        // session.call('com.bigsql.createInstance', ['db', 'aws', data])
    }

    $scope.next = function(region){
        $scope.loading = true;
        if($scope.firstStep){
            var getRdsVersions = pgcRestApiCall.getCmdData('metalist rds-versions --region=' + $scope.data.region + ' --cloud aws --type db');
            getRdsVersions.then(function(data){
                if(data.state != 'completed'){
                    $scope.showErrMsg = true;
                    $scope.errMsg = data[0].msg;
                }
                else{
                    $scope.firstStep = false;
                    $scope.secondStep = true;
                    $scope.dbEngVersions = data.data;
                    $scope.data.engine_version = $scope.dbEngVersions[0].EngineVersion;
                    $scope.versionChange();
                }
                $scope.loading = false;
            });
        }else{
            var getVPCList = pgcRestApiCall.getCmdData("metalist vpc-list --region=" + $scope.data.region + " --cloud aws --type db");
            getVPCList.then(function(data){
                if(data.state != 'completed'){
                    $scope.showErrMsg = true;
                    $scope.errMsg = data[0].msg;
                }
                else{
                    $scope.secondStep = false;
                    $scope.thirdStep = true;
                    $scope.networkSec = data.data;
                    if($scope.networkSec.lenght > 0){
                        $scope.vpc = { select : $scope.networkSec[0].vpc }
                        $scope.vpcChange();
                    }
                }
                $scope.loading = false;
            });
        }
    }

    $scope.previous = function(data){
        $scope.showErrMsg = false;
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


}]);