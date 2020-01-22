angular.module('bigSQL.components').controller('pgInitializeController', ['$scope','$rootScope', '$uibModalInstance','MachineInfo', 'PubSubService', 'bamAjaxCall', 'pgcRestApiCall', '$http', '$window', function ($scope, $rootScope, $uibModalInstance, MachineInfo, PubSubService, bamAjaxCall, pgcRestApiCall, $http, $window) {

	var session;
    var subscriptions = [];

	$scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    $scope.comp = $uibModalInstance.component;
    $scope.autoStartButton = $uibModalInstance.autoStartButton;
    $scope.dataDir = $uibModalInstance.dataDir;
    $scope.host = $uibModalInstance.host;
    $scope.userName = $uibModalInstance.userName;
    $scope.userPassword = $uibModalInstance.password;
    $scope.initializing = false;
    $scope.autostart = {value : false}
    $scope.autostartOn = false;

    function getInfoComp(argument) {
        if($scope.host == 'localhost' || $scope.host == '' || !$scope.host ){
            var infoData = pgcRestApiCall.getCmdData('info ' + $scope.comp);
        } else{
            var infoData = pgcRestApiCall.getCmdData('info ' + $scope.comp + ' --host "' + $scope.host + '"');
        }
        infoData.then(function(args) {
            var data = args[0];
            $scope.dataDir = data.available_datadir;
            $scope.portNumber = data.available_port;
            if (data.component == $scope.comp) {
                if(data['autostart'] == "on" ){
                    $scope.autostartOn = true;
                    $scope.autostart.value = true;
                }else{
                    $scope.autostart.value = true;
                    $scope.autostartChange($scope.autostart);
                }
            }
        });
    }

    function startComp(args) {
        if($scope.host == 'localhost' || $scope.host == '' || !$scope.host){
                session.call('com.bigsql.start', [$scope.comp]);
        }else{
            session.call('com.bigsql.start', [$scope.comp, $scope.host]);
        }
    }

    getInfoComp();

    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
    	session = val;        

        $scope.portNumber = '';

        $scope.autostartChange = function (args) {
            $scope.autoStartVal;
            if(args.value){
                $scope.autoStartVal = 'on';
                $scope.autostart.value = true;
            } else {
                $scope.autoStartVal = 'off';
                $scope.autostart.value = false;
            }
        }

        session.subscribe('com.bigsql.onAutostart', function (data) {
            startComp();
        }).then(function (sub) {
            subscriptions.push(sub);
        });

        session.subscribe('com.bigsql.onInit',
        function (data) {
                var compStatus = JSON.parse(data[0]);
                if(compStatus[0].status == 'complete'){
                    $scope.addToMetaData();
                    if (!$scope.autostartOn && $scope.autoStartVal) {
                        if($scope.host == 'localhost' || $scope.host == '' || !$scope.host){
                            session.call('com.bigsql.autostart',[$scope.autoStartVal,$scope.comp]).then(function (argument) {
                            getInfoComp();
                        });
                        } else{
                            session.call('com.bigsql.autostart',[$scope.autoStartVal,$scope.comp, $scope.host]).then(function (argument) {
                                getInfoComp();
                            });
                        }
                    }
                }else{
                    $uibModalInstance.dismiss('cancel');
                }
            }).then(function (subscription){
                subscriptions.push(subscription);
            });
    });

    $scope.addToMetaData = function (comp, remote_host) {
        if($scope.host == 'localhost' || $scope.host == '' || !$scope.host){
            var infoComp = pgcRestApiCall.getCmdData('info ' + $scope.comp);
        }else{
            var infoComp = pgcRestApiCall.getCmdData('info ' + $scope.comp + ' --host "' + $scope.host + '"');
        }
        infoComp.then(function(args) { 
            if ($scope.host == '') {
                args[0]['host'] = 'localhost';
            }else{
                args[0]['host'] = $scope.host;                
            }
            var addToMetaData = bamAjaxCall.postData('/api/add_to_metadata', args[0]);
            addToMetaData.then(function (argument) {
                startComp();
                $uibModalInstance.dismiss('cancel');                        
            });
        });
    }

    $scope.init = function() {
        $scope.initializing = true;
        if($scope.host == 'localhost' || $scope.host == '' || !$scope.host){
        	if(!$scope.portNumber){
                $scope.portNumber = document.getElementById('portNumber').value;
            }
            session.call('com.bigsql.init', [ $scope.comp, $scope.formData.password, $scope.dataDir, $scope.portNumber.toString() ] );
        } else {
            if ($scope.userName == undefined || $scope.password == undefined) {
                // var event_url =  'initpg/'  + $scope.host + '/' + $scope.comp + '/' +$scope.formData.password ;
                session.call('com.bigsql.init', [ $scope.comp, $scope.formData.password, $scope.dataDir, $scope.portNumber.toString(), $scope.host ] );
            }else{
                var event_url =  'initpg/'  + $scope.host + '/' + $scope.comp + '/' +$scope.formData.password + '/' + $scope.userName +'/' + $scope.userPassword;
                var eventData = bamAjaxCall.getCmdData(event_url);
                eventData.then(function(data) {
                    $scope.addToMetaData();
                    if (!$scope.autostartOn && $scope.autoStartVal) {
                        session.call('com.bigsql.autostart',[$scope.autoStartVal,$scope.comp, $scope.host]).then(function (argument) {
                            getInfoComp();
                        });
                    }
                });
            }
        }

    }

    $scope.$on('$destroy', function () {
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i])
        }
    });

}]);