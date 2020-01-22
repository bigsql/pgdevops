angular.module('bigSQL.components').controller('createNewAWSEC2Controller', ['$scope', '$stateParams', 'PubSubService', '$rootScope', '$interval','MachineInfo', 'pgcRestApiCall', '$uibModalInstance', '$uibModal', '$cookies', function ($scope, $stateParams, PubSubService, $rootScope, $interval, MachineInfo, pgcRestApiCall, $uibModalInstance, $uibModal, $cookies) {

    var session;
    $scope.showErrMsg = false;
    $scope.creating = false;


    $scope.loading = true;
    $scope.firstStep = true;
    $scope.secondStep = false;
    $scope.disableInsClass = true;
    $scope.instance = { 'name': '' };
    $scope.shutDownBehaviours = {'Stop':'stop', 'Terminate':'terminate'}

    $scope.data = {
        'computer_name':'',
        'region' : '',
        'image_id' : 'ami-ae7bfdb8',
        'instance_type' : 't2.micro',
        'kernel_id' : '',
        'key_name' : '',
        'monitoring' : '',
        'ram_disk_id' : '',
        'subnet_id' : '',
        'user_data' : '',
        'additional_info' : '',
        'client_token' : '',
        'disable_api_termination' : '',
        'dry_run' : '',
        'ebs_optimized' : '',
        'shutdown_behaviour' : '',
        'private_ip_address' : '',
        'storage_type' : 'gp2',
        'volume_size' : 8,
        'instance_count' : 1,
        'tags' : {}
    };


    var regions = pgcRestApiCall.getCmdData('metalist aws-regions');
    regions.then(function(data){
        $scope.loading = false;
        $scope.regions = data;
        $scope.data.region = $scope.regions[0].region;
        $scope.getSecGroup();
        $scope.getKeyPair();
        $scope.getVpc();
    });

    var instanceTypes = pgcRestApiCall.getCmdData('metalist aws-ec2');
    instanceTypes.then(function(data){
        $scope.types = data;
    });
    $scope.getSecGroup = function (argument) {
        $scope.gettingSecGrps = true;
        var vpc_subnet = pgcRestApiCall.getCmdData('metalist sec-group --type vm --region=' + $scope.data.region + ' --cloud=aws');
        vpc_subnet.then(function(data){
            if(data.state != 'completed'){
                $scope.showErrMsg = true;
                $scope.errMsg = data[0].msg;
            }
            else{
                $scope.secgroups = data.data;
            }
            $scope.gettingSecGrps = false;
        });
    }

    $scope.getKeyPair = function (argument) {
        $scope.gettingKeyPairs = true;
        var vpc_subnet = pgcRestApiCall.getCmdData('metalist keypairs --type vm --region=' + $scope.data.region + ' --cloud=aws');
        vpc_subnet.then(function(data){
            if(data.state != 'completed'){
                $scope.showErrMsg = true;
                $scope.errMsg = data[0].msg;
            }
            else{
                $scope.keypairs = data.data;
            }
            $scope.gettingKeyPairs = false;
        });
    }

    $scope.getVpc = function (argument) {
        $scope.gettingVpcs = true;
        var vpc_subnet = pgcRestApiCall.getCmdData('metalist vpc-list --region=' + $scope.data.region + ' --cloud=aws --type vm');
        vpc_subnet.then(function(data){
            if(data.state != 'completed'){
                $scope.showErrMsg = true;
                $scope.errMsg = data[0].msg;
            }
            else{
                $scope.subnets = data.data;
                $scope.data.subnet_id = '';
            }
            $scope.gettingVpcs = false;
        });
    }

    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
    	session = val;
    });

    $scope.changeSubnet = function (argument) {
        if ($scope.data.network_name) {
            var vpc_subnets = [];
            for (var i = $scope.subnets.length - 1; i >= 0; i--) {
               if($scope.subnets[i].vpc == $scope.data.network_name){
                vpc_subnets.push($scope.subnets[i].subnet_group);
               }
            }
            $scope.subnetGroups = vpc_subnets;
        }else{
            $scope.data.subnet_id = '';
        }
        $scope.data.security_group = '';
    }


    $scope.regionChange = function (region) {
        session.call('com.bigsql.rdsMetaList', ['instance-class', '', $scope.data.region, '9.6.3']);  
        //session.call('com.bigsql.rdsMetaList', ['vpc-list', '', $scope.data.region, '']);
        $scope.getSecGroup();
        $scope.getKeyPair();
        $scope.getVpc();
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

    $scope.createEC2 = function(){
        $scope.data.tags['Name'] = $scope.instance.name;
        $scope.data.computer_name = $scope.instance.name;
        $scope.creating = true;
        $scope.showErrMsg = false;
        var data = [];
        $cookies.put('lastSelRegion', $scope.data.region);
        data.push($scope.data);
        var requestData = {
            'cloud' : 'aws',
            'type' : 'vm',
            'params' : data
        }
        var createEC2 = pgcRestApiCall.postData('create',requestData)
        createEC2.then(function (data) {
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

    $scope.validateFields = function(){
        if($scope.creating){
            return ($scope.creating);
        }
        if(!$scope.instance.name || !$scope.data.keyname){
            return (true);
        }
        if(!$scope.data.subnet_id && !$scope.data.security_group){
            return (true);
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


}]);