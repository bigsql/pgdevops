angular.module('bigSQL.components').controller('addPGConnectionModalController', ['$scope', '$uibModalInstance', 'PubSubService', '$rootScope', '$uibModal', 'bamAjaxCall', 'htmlMessages', '$window', '$http', function ($scope, $uibModalInstance, PubSubService, $rootScope, $uibModal, bamAjaxCall, htmlMessages, $window, $http) {

    var session;
	var sessPromise = PubSubService.getSession();
	var subscriptions = [];
	$scope.pgList = $uibModalInstance.pgList;
	$scope.editConnData = $uibModalInstance.editConnData;
	$scope.servers = [];
	$scope.servergroups = [];
	$scope.port = 5432;

    var server_group_list = bamAjaxCall.getData("/admin/browser/nodes/");
    server_group_list.then(function (argument) {
        $scope.servergroups = argument.data;
        if($scope.servergroups.length > 0 && !$scope.selectedServer )
          $scope.selectedServer = $scope.servergroups[0].label;
    });
	for (var i = 0; i < $scope.pgList.length; ++i) {
	    var obj = $scope.pgList[i];
	    if ($scope.servers.indexOf(obj.server_group)<0) {
		   	$scope.servers.push(obj.server_group)	    	
	    }
	}
	if ($scope.servers.length < 1) {
		$scope.servers = ['Servers'];
	}
	$scope.tryToConnect = false;
	$scope.connectionStatus = false;
	$scope.installingStatus = false;
	$scope.setupError = false;
	$scope.registerResponse;
	$scope.type = 'Add';
	$scope.alerts = [];

	$scope.hostName = '';
	$scope.pgcDir = '';
	$scope.userName = '';

    $scope.create_btn = "Create";
	if($scope.editConnData){
	    $scope.type = 'Edit';
		$scope.create_btn = "Update";
		$scope.host = $scope.editConnData.host;
		$scope.port = parseInt($scope.editConnData.port);
		$scope.userName = $scope.editConnData.db_user;
		$scope.database = $scope.editConnData.db;
		$scope.connectionName = $scope.editConnData.server_name;
		$scope.sid = $scope.editConnData.sid;
		$scope.selectedServer = $scope.editConnData.server_group;
	}

	
    sessPromise.then(function (sessParam) {
        session = sessParam;

    });

    $scope.connect = function (argument) {
        $scope.connecting = true;
        var disconnectall = bamAjaxCall.getData("/pgstats/disconnectall/");
        disconnectall.then(function (argument) {
            var data = {host: $scope.host, username: $scope.userName, password: $scope.password, dbname:$scope.database, port:$scope.port}
            var checkUser = bamAjaxCall.postData('/check_pg_conn', data);
            checkUser.then(function (data) {
                if(data.error == 0){
                    if ($scope.pgList.length > 0) {
                        $scope.gid = parseInt($($scope.servergroups).filter(function(i,n){ return n.label ==  $scope.selectedServer})[0]._id);
                        var data = {
                            component:$scope.connectionName,
                            host: $scope.host,
                            port: $scope.port,
                            database: $scope.database,
                            user: $scope.userName,
                            gid: $scope.gid,
                            rds : false
                        };
                        if ($scope.sid) {
                            data.sid=$scope.sid;
                        }
                        var addToMetaData = bamAjaxCall.postData('/api/add_to_metadata', data);
                        addToMetaData.then(function (argument) {
                            if(!$scope.sid){
                                $scope.sid = argument.sid;
                            }
                            if ($scope.savePassword) {
                                $rootScope.$emit('getDBstatus', $scope.sid, $scope.gid, $scope.password, true, true);
                                $scope.connect_err = '';
                                $scope.connecting = true;
                            }else{
                                $rootScope.$emit('getDBstatus', $scope.sid, $scope.gid, $scope.password, false, true);
                                $scope.connect_err = '';
                                $scope.connecting = true;
                            }
                            $rootScope.$emit('refreshPgList');
                            $uibModalInstance.dismiss('cancel');
                            $rootScope.$emit('closePasswordModal');
                        });
                    }else{
                        $scope.gid = "1";
                        var server_group_list = bamAjaxCall.getData("/admin/browser/nodes/");
                        server_group_list.then(function (argument) {
                            if(argument.data.length > 0){
                                var defaultGroup = argument.data.filter(function(i,n){ return i.label == "Servers"})[0];
                                if(defaultGroup){
                                    $scope.gid = parseInt(defaultGroup._id)
                                }else{
                                    $scope.gid = argument.data[0]._id;
                                }
                            }else{

                            }
                            var data = {
                                component:$scope.connectionName,
                                host: $scope.host,
                                port: $scope.port,
                                database: $scope.database,
                                user: $scope.userName,
                                gid: $scope.gid,
                                rds : false
                            };
                            if ($scope.sid) {
                                data.sid=$scope.sid;
                            }
                            var addToMetaData = bamAjaxCall.postData('/api/add_to_metadata', data);
                            addToMetaData.then(function (argument) {
                                if(!$scope.sid){
                                    $scope.sid = argument.sid;
                                }
                                if ($scope.savePassword) {
                                    $rootScope.$emit('getDBstatus', $scope.sid, $scope.gid, $scope.password, true, true);
                                    $scope.connect_err = '';
                                    $scope.connecting = true;
                                }else{
                                    $rootScope.$emit('getDBstatus', $scope.sid, $scope.gid, $scope.password, false, true);
                                    $scope.connect_err = '';
                                    $scope.connecting = true;
                                }
                                $rootScope.$emit('refreshPgList');
                                $uibModalInstance.dismiss('cancel');
                                $rootScope.$emit('closePasswordModal');
                            });
                        });
                    }
                }
                else{
                    $scope.connectionError = true;
                    $scope.message = data.msg;
                    $scope.connecting = false;
                }
             })
	    })
    }

    $rootScope.$on('updateMetaData', function(event, data){
        
        if(data.state!='error'){
            var data = {
                component:$scope.connectionName,
                host: $scope.host,
                port: $scope.port,
                database: $scope.database,
                user: $scope.userName,
                gid: $scope.gid,
                rds : false
            };
            if ($scope.sid) {
                data.sid=$scope.sid;
            }
            var addToMetaData = bamAjaxCall.postData('/api/add_to_metadata', data);
                addToMetaData.then(function (argument) {
                    $rootScope.$emit('refreshPgList');
                    $rootScope.$emit('closePasswordModal');
                });
        }
    });

    
    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

	$scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
        $rootScope.$emit('closePasswordModal');
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i]);
        }
    };

}]);