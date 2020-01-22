angular.module('bigSQL.components').controller('credentialManagerController', ['$rootScope', '$scope', '$uibModal','PubSubService', 'MachineInfo', 'UpdateComponentsService', 'bamAjaxCall', '$window', '$cookies', '$sce', 'htmlMessages', '$timeout', 'pgcRestApiCall', function ($rootScope, $scope, $uibModal, PubSubService, MachineInfo, UpdateComponentsService, bamAjaxCall, $window, $cookies, $sce, htmlMessages, $timeout, pgcRestApiCall) {

	$scope.alerts = [];
	$scope.loading = true;
	$scope.types = {'SSH Key' : 'ssh-key', 'Cloud' : 'cloud', 'Password' : 'pwd'};

	var credentialsList = function(argument) {
		$scope.loading = true;
		$scope.isAllSelected = false;
		$scope.options = {
	    	master : false
	    }
	    $scope.model = {
	    	selectedLabelList : []
	    }
		var getCredentials = bamAjaxCall.getCmdData('pgc/credentials/')
		getCredentials.then(function (data) {
			$scope.loading = false;
			$scope.credentialsList = data.data;
			for (var i = $scope.credentialsList.length - 1; i >= 0; i--) {
				if ($scope.credentialsList[i].last_used) {
					var dateTime = new Date(($scope.credentialsList[i].last_used).split('.')[0].replace(/-/gi,'/')+' UTC');
					$scope.credentialsList[i].last_used_local = dateTime.toString();
				}
				$scope.credentialsList[i].selected = false;
			}
			if ($scope.credentialsList.length == 0) {
				$scope.noCredMsg = $sce.trustAsHtml(htmlMessages.getMessage('no-credentials'));
			}
		})

	}

	$rootScope.$on('refreshCreds', function (argument) {
		credentialsList();
	});

	credentialsList();

	$scope.model = {
    	selectedLabelList : []
    }
    $scope.options = {
    	master : false
    }
    $scope.isSelectAll = function(){
    	$scope.model = {
	    	selectedLabelList : []
	    }
	    if($scope.options.master){
			$scope.options.master = true;
	    	for(var i=0;i<$scope.credentialsList.length;i++){
				$scope.model.selectedLabelList.push($scope.credentialsList[i].cred_name);		
			}
	    }else{$scope.options.master = false;}
	   	angular.forEach($scope.credentialsList, function (item) {
			    item.selected = $scope.options.master;
	   	});

	}
    
  $scope.isLabelChecked = function(){
		var _name = this.cred.cred_name;
		if(this.cred.selected){
			$scope.model.selectedLabelList.push(_name);
			if($scope.model.selectedLabelList.length == $scope.credentialsList.length ){$scope.options.master = true;}
		}else{
			$scope.options.master = false;
			var index = $scope.model.selectedLabelList.indexOf(_name);
			$scope.model.selectedLabelList.splice(index, 1);
		}
	}


    $rootScope.$on('deleteResponse', function(argument, data) {
    	if (data.state == 'error') {
    		$scope.alerts.push({
	    		msg : data.message,
	    		type : 'error'
	    	})
    	}else{
    		$scope.alerts.push({
	    		msg : data.message,
	    		type : 'warning'
	    	})
    	}	
    })

	$rootScope.$on('addResponse', function(argument, data) {
    	if (data.state == 'error') {
    		$scope.alerts.push({
	    		msg : data.message,
	    		type : 'error'
	    	})
    	}else{
    		$scope.alerts.push({
	    		msg : data.message,
	    		type : 'success'
	    	})
    	}	
    })    

    $scope.checkOptions = function (argument) {
    	$scope.showUpdate = false;
    	$scope.showDeleteReport = false;
    	var selectedCreds = [];
    	$scope.showUsage = false;
    	for (var i = $scope.credentialsList.length - 1; i >= 0; i--) {
			if($scope.credentialsList[i].selected){
				selectedCreds.push($scope.credentialsList[i]);
			}
			if ($scope.credentialsList[i].selected && $scope.credentialsList[i].hosts.length>0) {
				$scope.showUsage = true;
			}
		}
		if (selectedCreds.length==0) {
			$scope.showDeleteReport = false;
			$scope.showUpdate = false;
		}else if(selectedCreds.length == 1){
			$scope.showUpdate = true;
			$scope.showDeleteReport = true;
		}else{
			$scope.showDeleteReport = true;
		}
    }

	$scope.deleteCredential = function (cred_uuid, disabled) {
		if (!disabled) {
			var selectedCreds = [];
			for (var i = $scope.credentialsList.length - 1; i >= 0; i--) {
				if($scope.credentialsList[i].selected){
					selectedCreds.push($scope.credentialsList[i]);
				}
			}
			if (selectedCreds.length>0) {
				var cred_uuids = [];
				for (var i = $scope.credentialsList.length - 1; i >= 0; i--) {
					if($scope.credentialsList[i].selected){
						cred_uuids.push($scope.credentialsList[i].cred_uuid);
					}
				}
				var modalInstance = $uibModal.open({
		            templateUrl: '../app/components/partials/confirmDeletionModal.html',
		            controller: 'confirmDeletionModalController',
		        });
		        modalInstance.deleteFiles = cred_uuids;
		        modalInstance.comp = 'credentials';
		        modalInstance.deleteCred = true;
			}else{
				$scope.alerts.push({
					msg: htmlMessages.getMessage('select-one-cred'),
	                type: 'warning'
	            });
			}
		}
	}

	$scope.addCred = function (title) {
		var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/addCredentialModal.html',
                controller: 'addCredentialModalController',
                keyboard  : false,
                backdrop  : 'static',
            });
		modalInstance.title = title;
	}

	$scope.updateCred = function (title, type) {
		var updateCreds = [];
		for (var i = $scope.credentialsList.length - 1; i >= 0; i--) {
			if($scope.credentialsList[i].selected){
				updateCreds.push($scope.credentialsList[i]);
			}
		}
		if (updateCreds.length == 1) {
			var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/addCredentialModal.html',
                controller: 'addCredentialModalController',
                keyboard  : false,
                backdrop  : 'static',
            });
			modalInstance.title = title;
			modalInstance.updateCred = updateCreds[0];
			modalInstance.type = type;
		}else{
			$scope.alerts.push({
				msg: htmlMessages.getMessage('select-one-cred'),
                type: 'warning'
            });
		}
	}

	$scope.openUsage = function (name, host_list, cred_type, disabled) {
			var selectedCreds = [];
			var openModel = false;
			for (var i = $scope.credentialsList.length - 1; i >= 0; i--) {
				if($scope.credentialsList[i].selected){
					selectedCreds.push($scope.credentialsList[i]);
				}
				if ($scope.credentialsList[i].selected && $scope.credentialsList[i].hosts.length>0) {
					openModel = true;
				}
			}
			if ((name || selectedCreds.length>0) && (name ||openModel)) {
				var modalInstance = $uibModal.open({
	                templateUrl: '../app/components/partials/credentialUsage.html',
	                controller: 'credentialUsageController',
	                keyboard  : false,
	                backdrop  : 'static',
	            });
				modalInstance.name = name;
				modalInstance.host_list = host_list;
				modalInstance.cred_type = cred_type;
				modalInstance.selectedCreds = selectedCreds;
			}else if (!openModel && selectedCreds.length>0) {
				$scope.alerts.push({
					msg: htmlMessages.getMessage('no-usage-creds'),
	                type: 'warning'
	            });
			}else{
				$scope.alerts.push({
					msg: htmlMessages.getMessage('select-one-cred'),
	                type: 'warning'
	            });
			}
	}

	$scope.closeAlert = function (index) {
	    $scope.alerts.splice(index, 1);
	};

}]);