//All the modules will be created him , all the developers would have create there modules here
"use strict";

angular.module('bigSQL.common', []);
angular.module('bigSQL.components', ['bigSQL.common', 'nvd3', 'ui.grid', 'ui.grid.expandable', 'ngCookies']);
angular.module('bigSQL.menus', ['bigSQL.common']);
angular.module('bigSQL', ['templates', 'angular.filter', 'ui.router', 'ui.bootstrap', 'bigSQL.common', 'bigSQL.menus', 'bigSQL.components']);

angular.module('bigSQL').run(function (PubSubService, $state, $window, $rootScope, $stateParams) {
    //Callback added for session creation
    var sessionCreated = function (session) {
        $rootScope.$emit('sessionCreated',session);
    };

    $window.onbeforeunload = function () {
        PubSubService.closeConnection();
    };

    PubSubService.initConnection();
    PubSubService.openConnection(sessionCreated);

});

angular.module('bigSQL').config(function ($urlRouterProvider) {
    $urlRouterProvider.otherwise("/");
});

angular.module('bigSQL').controller('BigSqlController', ['$scope', '$rootScope', '$uibModal', 'PubSubService', 'MachineInfo', '$state', '$window', function ($scope, $rootScope, $uibModal, PubSubService, MachineInfo, $state, $window) {


}]);
"use strict";

angular.module('bigSQL.common');
angular.module('bigSQL.components').config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider.state('components', {
        url: '/components',
        views: {
            "main": {
                controller: 'ComponentsController',
                templateUrl: '../app/components/components.html'
            }
        }

    }).state('components.view', {
        url: '/view',
        views: {
            "sub": {
                controller: 'ComponentsViewController',
                templateUrl: '../app/components/partials/view.html',
            }
        }

    }).state('components.status', {
        url: '/status',
        views: {
            "sub": {
                controller: 'ComponentsStatusController',
                templateUrl: '../app/components/partials/status.html',

            }
        }
    }).state('components.log', {
        url: '/log/',
        views: {
            "sub": {
                controller: 'ComponentsLogController',
                templateUrl: '../app/components/partials/log.html',

            }
        }
    }).state('components.detailsView', {
        url: '^/details/{component}',
        views: {
            "sub": {
                controller: 'ComponentDetailsController',
                templateUrl: '../app/components/partials/details.html',
            }
        }
    }).state('components.settingsView', {
        url: '/settings',
        views: {
            "sub": {
                controller: 'ComponentsSettingsController',
                templateUrl: '../app/components/partials/settings.html',
            }
        }
    }).state('components.detailspg95', {
        url: '^/details-pg/{component}',
        views: {
            "sub": {
                controller: 'ComponentDetailsPg95Controller',
                templateUrl: '../app/components/partials/detailspg95.html',
            }
        }
    }).state('components.componentLog', {
        url: '^/log/{component}',
        views: {
            "sub": {
                controller: 'ComponentsLogController',
                templateUrl: '../app/components/partials/log.html',
            }
        }
    }).state('components.hosts', {
        url: '^/hosts',
        views: {
            "sub": {
                controller: 'HostsController',
                templateUrl: '../app/components/partials/hosts.html',
            }
        }
    }).state('components.profiler', {
        url: '^/profiler',
        views: {
            "sub": {
                controller: 'profilerController',
                templateUrl: '../app/components/partials/profiler.html',
            }
        }
    }).state('components.loading', {
        url: '^/',
        views: {
            "sub": {
                controller: 'bamLoading',
                templateUrl: '../app/components/partials/landingPage.html',
            }
        }
    }).state('components.badger', {
        url: '^/badger',
        views: {
            "sub": {
                controller: 'badgerController',
                templateUrl: '../app/components/partials/badger.html',
            }
        }
    });
}).controller('ComponentsController', ['$scope', function ($scope) {

}]);
angular.module('bigSQL.common').directive('errSrc', function () {

    return {
    link: function(scope, element, attrs) {

      scope.$watch(function() {
          return attrs['ngSrc'];
        }, function (value) {
          if (!value) {
            element.attr('src', attrs.errSrc);  
          }
      });

      element.bind('error', function() {
        element.attr('src', attrs.errSrc);
      });
    }
  }
});
angular.module('bigSQL.common').directive('progressbar', function () {

    return {
        scope: {
            value: "="
        },
        restrict: 'E',
        template: "<div class='progressBar'><div></div></div>",
        link: function (scope, elem, attr) {

            var progressbar = jQuery(elem).contents();
            var bar = progressbar.find('div');
            scope.$watch('value', function (newVal) {
                if (newVal != undefined) {
                    var progressBarWidth = newVal * progressbar.width() / 100;
                    bar.width(progressBarWidth);
                }
            });
        }
    }
});
angular.module('bigSQL.common').directive('serverInfoDetails', function (bamAjaxCall, $rootScope) {


    return {
        scope: {
            title: '@'
        },
        restrict: 'E',
        templateUrl: '../app/common/partials/hostInfo.html',
        //template: '<div class="components-update-title-wrapper">  <h1><strong>{{title}}</strong> : {{data.host}} </h1>  <h3><strong> OS </strong> : {{data.os}} &nbsp; <strong>HW </strong>: {{data.mem}} GB, {{data.cores}} x {{data.cpu}} &nbsp; <strong>PGC</strong> : {{data.version}}</h3></div>',
        controller: ['$scope', '$http', '$window', '$cookies', function serverInfoDetailsController($scope, $http, $window, $cookies) {

            function gethostInfo(selectedHost) {
                selectedHost = typeof selectedHost !== 'undefined' ? selectedHost : "";

                if (selectedHost == "" || selectedHost == 'localhost') {
                    var infoData = bamAjaxCall.getCmdData('info');
                } else {
                    var infoData = bamAjaxCall.getCmdData('hostcmd/info/' + selectedHost);
                }

                infoData.then(function (data) {
                    $scope.data = data[0];
                });
            }

            var remote_host = $cookies.get('remote_host');
            remote_host = typeof remote_host !== 'undefined' ? remote_host : "";
            if (remote_host == "" || remote_host == undefined) {
                $scope.selecthost = 'localhost';    
            } else {
                $scope.selecthost = remote_host;
            }
            

            var hostsList = bamAjaxCall.getCmdData('hosts');

            hostsList.then(function (data) {
                if (data.length > 0 && data[0].status == "error") {
                    $scope.hosts = [];
                } else {
                    $scope.hosts = data;
                }
            });

            gethostInfo($cookies.get('remote_host'));

            $scope.hostChange = function (host) {
                $rootScope.$emit('refreshData', host);
                // $rootScope.$emit('topMenuEvent', host);
                $rootScope.remote_host = host;
                $cookies.put('remote_host', host);
                gethostInfo(host);
                // $scope.$parent.refreshData(host);
            }
        }]
    }
});
angular.module('bigSQL.common').directive('userDetailsRow', function () {
	
	return {
        scope: {
            value: "=",
            roles: "="
        },
        restrict: 'E',
        templateUrl: '../app/components/partials/userForm.html',
        controller: ['$scope', '$rootScope', '$window', '$http', function userDetailsRowController($scope, $rootScope, $window, $http) {
			var count = 1;

			$scope.deleteUser = function (user_id) {
		        var delete_url = $window.location.origin + '/admin/user_management/user/' + user_id;

		        $http.delete(delete_url)
		            .success(function (data) {
		                $rootScope.$emit('callGetList');
		            })
		            .error(function (data, status, header, config) {

		            });

		    };

		    $scope.updateRole = function() {
		    	if(!$scope.value.new){
		    		var updateData = {};
            		updateData.id = $scope.value.id;
			        updateData.role = $scope.value.role;
	            	$rootScope.$emit('updateUser', updateData);
		    	}
			}

			$scope.updateActive = function() {
		    	if(!$scope.value.new){
		    		var updateData = {};
            		updateData.id = $scope.value.id;
			        updateData.active = $scope.value.active;
	            	$rootScope.$emit('updateUser', updateData);
		    	}
			}

            $scope.formSave = function () {
            	
            	if($scope.passwordValid && count == 1 ) {
            		var userData = {};
            		userData.id = $scope.value.id;
			        userData.email = $scope.value.email;
			        userData.active = $scope.value.active;
			        userData.role = $scope.value.role;
			        userData.newPassword = $scope.userForm.password_c.$viewValue;
			        userData.confirmPassword = $scope.userForm.password_c.$viewValue;
	            	$rootScope.$emit('saveUser', userData);
	            	count += 1; 
            	}
		    }
        }]
    }

})
angular.module('bigSQL.common').directive('validPasswordC', function () {
    return {
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {
            ctrl.$parsers.unshift(function (viewValue, $scope) {
                var noMatch = viewValue != scope.initForm.password.$viewValue
                ctrl.$setValidity('noMatch', !noMatch)
            })
        }
    }
}).directive('validPort', function () {
    return {
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {
            ctrl.$parsers.unshift(function (viewValue, $scope) {
                var invalidLen = parseInt(viewValue) < 1000 || parseInt(viewValue) > 9999
                ctrl.$setValidity('invalidLen', !invalidLen)
                scope.portGood = !invalidLen
            })
        }
    }
}).directive('validUserPassword', function () {
    return {
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {
            ctrl.$parsers.unshift(function (viewValue, $scope) {
                var invalidLen = viewValue.length < 6
                ctrl.$setValidity('invalidLen', !invalidLen)
            })
        }
    }
}).directive('confirmPassword', function () {
    return {
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {
            ctrl.$parsers.unshift(function (viewValue, $scope) {
                var invalidLen = viewValue.length < 6
                var noMatch = viewValue != scope.userForm.password.$viewValue
                ctrl.$setValidity('invalidLen', !invalidLen)
                ctrl.$setValidity('noMatch', !noMatch)
                scope.passwordValid = !invalidLen && !noMatch 
            })
        }
    }
});
angular.module('bigSQL.common').factory('MachineInfo', function (PubSubService, $q, $filter) {
    var machineInfo;
    var logdir;

    //manual or auto 
    var updationMode = "";

    //Need to revise this
    var fetchDataFromService = function () {
        var subscription;
        var session = PubSubService.getSession();
        session.subscribe('com.bigsql.onInfo', function (data) {
            machineInfo = JSON.parse(data[0][0])[0];
            session.unsubscribe(subscription);
        }).then(function (sub) {
            subscription = sub;
        });
        session.call('com.bigsql.info');
    };

    var setUpdationMode = function (machineInfo) {

        try {
            var currentDate = new Date();
            var today = new Date(currentDate);
            var sevenDaysBackDate = new Date();
            sevenDaysBackDate = sevenDaysBackDate.setDate(today.getDate() - 7);
            sevenDaysBackDate = $filter('date')(sevenDaysBackDate, 'yyyy-MM-dd');
            if (machineInfo.interval == null || !machineInfo.interval) {
                updationMode = 'manual'; 
            } else {
                updationMode = 'auto';
            }
        } catch (err) {
            throw new Error(err);
        }
    };

    var getUpdationMode = function () {
        return updationMode;
    };


    var get = function (session) {
        return $q(function (resolve, reject) {
            var subscription;
            session.subscribe('com.bigsql.onInfo', function (data) {
                if (data == null || data == undefined) {
                    reject("No Data Available");
                }
                machineInfo = JSON.parse(data[0][0])[0];
                session.unsubscribe(subscription);
                setUpdationMode(machineInfo);
                resolve(machineInfo);
            }).then(function (sub) {
                subscription = sub;
            });
            session.call('com.bigsql.info');        
        });
    };


    var set = function (info) {
        machineInfo = info;
    };

    return {
        get: get,
        set: set,
        getUpdationMode: getUpdationMode,
        setUpdationMode: setUpdationMode
    }

});
'use strict';

angular.module('bigSQL.common').factory('PubSubService', function ($window, $rootScope, $q, $interval) {
    var connection;
    var session;
    var wsuri;
    var httpUri;

    if ($window.location.origin == "file://") {
        wsuri = "ws://127.0.0.1:8080";

    } else {
        wsuri = (document.location.protocol === "http:" ? "ws:" : "wss:") + "//" +
            document.location.host + "/ws";
    }

    //wsuri = "ws://192.168.10.56:8050/ws";

    function getConnection() {
        return connection;
    };

    function initConnection() {
        if (connection == undefined) {
            connection = new autobahn.Connection({
                transports: [
                    {
                        'type': 'websocket',
                        'url': wsuri
                    }
                ],
                realm: "realm1"
            });
        }
    };
    /**
     Opens a connection
     **/
    function openConnection(sessionCreated) {
        connection.open();
        connection.onopen = function (sessionObj) {
            session = sessionObj;
            sessionCreated(session);
        }
    }

    function closeConnection() {
        connection.close('closed', "Connection Closed");
        connection.onclose = function () {
            connection = undefined;
            session = undefined;
        }
    }

    function getSession() {
        return $q(function (resolve, reject) {
            if (session === undefined) {
                if (connection == undefined) {
                    connection = initConnection();
                    resolve(openConnection());
                } else if (connection.session != undefined && connection.session != null) {
                    if (connection.session.isOpen) {
                        session = connection.session;
                        resolve(session);
                    } else {

                        try {
                            var count = 0;
                            var interval = $interval(function () {
                                count++;

                                if (connection.session.isOpen) {
                                    $interval.cancel(interval);
                                    resolve(connection.session);

                                } else if (!connection.session.isOpen && count > 20) {
                                    $interval.cancel(interval);
                                    reject("connection has failed");
                                }

                            }, 100);
                        } catch (err) {
                            throw new Error(err);
                        }
                    }
                }

            } else {
                resolve(session);
                // return session;
            }

        });


    }

    return {
        getConnection: getConnection,
        initConnection: initConnection,
        openConnection: openConnection,
        getSession: getSession,
        closeConnection: closeConnection

    }

});
angular.module('bigSQL.components').controller('ComponentDetailsController', ['$scope', '$stateParams', 'PubSubService','$rootScope', '$window', '$interval', 'bamAjaxCall', '$sce', '$cookies', '$uibModalInstance', function ($scope, $stateParams, PubSubService, $rootScope, $window, $interval, bamAjaxCall, $sce, $cookies, $uibModalInstance) {

    var subscriptions = [];
    var session;
    $scope.loading = true;
    var dependentCount = 0;
    $scope.currentHost;

    var componentStatus = 0;

    $scope.alerts = [];
    $scope.startAlert = [];
    $scope.checkplProfiler = true;

    $scope.statusColors = {
        "Stopped": "orange",
        "NotInitialized": "yellow",
        "Running": "green"
    }

    $scope.cancel = function () {
        $interval.cancel(callStatus);
        $rootScope.$emit('refreshPage');
        $rootScope.$emit('updatePackageManager');
        $uibModalInstance.dismiss('cancel');
    };

    $scope.currentComponent = $uibModalInstance.component;

    var getCurrentObject = function (list, name) {
        var currentObject;
        for (var i = 0; i < list.length; i++) {
            if (list[i].component == name) {
                currentObject = list[i];
                return currentObject;
            }
        }
    };

    $scope.compAction = function (action) {
        var is_yes=false;
        if(action == 'start'){
            $scope.component.spinner = 'Starting..';
        }else if(action == 'stop'){
            $scope.component.spinner = 'Stopping..';
        }else if(action == 'remove'){
            $scope.component.spinner = 'Removing..';
        }else if(action == 'restart'){
            $scope.component.spinner = 'Restarting..';
        } else if(action == 'install'){
            is_yes=true;
            $scope.checkplProfiler = true;
        }
        var sessionKey = "com.bigsql." + action;
        session.call(sessionKey, [$scope.component.component, is_yes]);
    };

    if ($scope.currentComponent == 'pgdevops') {
        var remote_host = $cookies.get('remote_host');
        $scope.currentHost = remote_host;
        remote_host = typeof remote_host !== 'undefined' ? remote_host : "";
        if (remote_host == "" || remote_host == "localhost") {
            var pgcInfo = bamAjaxCall.getCmdData('info')
        }else{
            var pgcInfo = bamAjaxCall.getCmdData('info/' + remote_host)
        }

        pgcInfo.then(function (data) {
            $scope.PGC_HOME = data[0].home;
        })
    }

    function callInfo(argument) {
        var remote_host = $cookies.get('remote_host');
        $scope.currentHost = remote_host;
        remote_host = typeof remote_host !== 'undefined' ? remote_host : "";
        $scope.currentHost = remote_host;
        if (remote_host == "" || remote_host == "localhost") {
            $scope.currentHost = "localhost";
            // var infoData = bamAjaxCall.getCmdData('info/' + $scope.currentComponent);
            var infoData = bamAjaxCall.getCmdData('relnotes/info/' + $scope.currentComponent);
        } else {
            var infoData = bamAjaxCall.getCmdData('relnotes/info/' + $scope.currentComponent + "/" + remote_host);
        }

        //var infoData = bamAjaxCall.getCmdData('info/' + $scope.currentComponent);
        infoData.then(function(data) {
            $scope.loading = false;
            if($scope.currentComponent == data[0].component){
                $scope.component = data[0];
                $scope.component.componentImage = $scope.component.component.split('-')[0].replace(/[0-9]/g,'');
                $scope.component.release_date = new Date($scope.component.release_date).toString().split(' ',[4]).splice(1).join(' ');
                $scope.component.release_date = $scope.component.release_date.split(' ')[0] + ' ' + $scope.component.release_date.split(' ')[1].replace(/^0+/, '') + ', ' + $scope.component.release_date.split(' ')[2];
                if($scope.component.install_date){
                    var ins_date = new Date($scope.component.install_date).toString().split(' ',[4]).splice(1).join(' ');
                    $scope.component.install_date = ins_date.split(' ')[0] + ' ' + ins_date.split(' ')[1].replace(/^0+/, '') + ', ' + ins_date.split(' ')[2];
                }
                $scope.rel_notes = $sce.trustAsHtml($scope.component.rel_notes);
                // var relnotes = bamAjaxCall.getCmdData('relnotes/info/' + $scope.currentComponent )
                // relnotes.then(function (data) {
                //     var data = JSON.parse(data)[0];
                //     $scope.relnotes = $sce.trustAsHtml(data.text);
                // });
            }
        });
    };

    function callStatus(argument) {
        var statusData = bamAjaxCall.getCmdData('status')
        statusData.then(function(data) {
            componentStatus = getCurrentObject(data, $scope.currentComponent);
            if(componentStatus != undefined){
                $rootScope.$emit('componentStatus', componentStatus);
                if (componentStatus.state != $scope.component.status) {
                    callInfo();
                }
            }
        });
    }

    callInfo();
    callStatus();

    if($scope.currentComponent != 'pgdevops'){
          $interval(callStatus, 5000);  
    }

    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
        session = val;
        $scope.component = {};

        if ($scope.currentComponent == 'pgdevops') {
            session.call('com.bigsql.checkOS');
            session.subscribe('com.bigsql.onCheckOS', function (args) {
                $scope.os = args[0];
            });  
        }

        var onRemove = function (response) {
            var data = JSON.parse(response[0])[0];
            if (data.status == "error") {
                var alertObj = {
                    msg: data.msg,
                    type: "danger"
                }
                $scope.alerts.push(alertObj);
                $scope.$apply();
            }
            if (data.status == "complete") {
                // session.call('com.bigsql.infoComponent', [$scope.currentComponent]);
                var alertObj = {
                    msg: data.msg,
                    type: "danger"
                }
                $scope.alerts.push(alertObj);
                callInfo();
            }
        };

        session.subscribe('com.bigsql.onRemove', onRemove).then(
            function (sub) {
                subscriptions.push(sub);
            });

        $scope.action = function (event) {
            if (event.target.tagName === "A" && event.target.attributes.action != undefined) {
                if(event.target.attributes.action.value == 'start'){
                    $scope.component.spinner = 'Starting..';
                }else if(event.target.attributes.action.value == 'stop'){
                    $scope.component.spinner = 'Stopping..';
                }else if(event.target.attributes.action.value == 'remove'){
                    $scope.component.spinner = 'Removing..';
                }else if($scope.component.component.includes("plprofiler") && event.target.attributes.action.value == 'install'){
                    $scope.checkplProfiler = false;
                    $scope.startAlert.push({
                        msg: "After installation of plprofiler, " + $scope.component.component.split('-')[1] + " restart will be done. Continue?",
                        type: 'warning'
                    });
                }
                var sessionKey = "com.bigsql." + event.target.attributes.action.value;
                if ($scope.checkplProfiler) {
                    if($scope.currentHost == 'localhost' || $scope.currentHost == ''){
                        session.call(sessionKey, [$scope.component.component]);
                    }else {
                        if (event.target.attributes.action.value == 'install') {
                            session.call(sessionKey, [$scope.component.component, false, $scope.currentHost]);
                        }else{
                            session.call(sessionKey, [$scope.component.component, $scope.currentHost]);
                        }
                    } 
                }
            }
        };

        session.subscribe('com.bigsql.onInstall', function (response) {
            var data = JSON.parse(response[0])[0];
            // if ($scope.currentComponent == data.component || $scope.currentComponent == data.component[0]) {
            if (data.state == "deplist") {
                if (data.deps.length > 1) {
                    dependentCount = data.deps.length;
                    $scope.component.installationDependents = true;
                }
            } else if (data.status == "start") {
                $scope.component.installationStart = data;
                $scope.component.installation = true;
                if ($scope.currentComponent == data.component) {
                    delete $scope.component.installationDependents;
                } else {
                    $scope.component.installationDependents = true;   
                }
            } else if (data.status == "wip") {
                $scope.component.installationRunning = data;
                $scope.component.progress = data.pct;
            } else if (data.status == "complete" || data.status == "cancelled") {
                if (data.status == "cancelled") {
                        $scope.alerts.push({
                            msg:  data.msg,
                            type: 'danger'
                        });
                }else if (data.state == 'unpack' || data.state == 'update' || data.state == 'install'){
                    $scope.alerts.push({
                            msg:  data.msg,
                            type: 'success'
                        });
                    callInfo();
                }

                delete $scope.component.installationStart;
                delete $scope.component.installationRunning;
                delete $scope.component.installation;

            }

            if (data.state == "error") {
                $scope.alerts.push({
                    msg: data.msg,
                    type: 'danger'
                });
                delete $scope.component.installation;
            }
            $scope.$apply();
        // }
        }).then(function (sub) {
            subscriptions.push(sub);
        });
    });

    $rootScope.$on('refreshData', function (argument, host) {
        $scope.loading = true;
        callInfo(host);
    });

    $scope.cancelInstallation = function (action) {
        session.call("com.bigsql.cancelInstall", [$scope.currentHost]);
    }

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
        $scope.startAlert.splice(index, 1);
    };

    //need to destroy all the subscriptions on a template before exiting it
    $scope.$on('$destroy', function () {
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i]);
        }
    });

}]);
angular.module('bigSQL.components').controller('ComponentDetailsPg95Controller', ['$scope', '$stateParams', 'PubSubService', '$rootScope', '$interval', 'MachineInfo', '$window', 'bamAjaxCall', '$uibModal', '$sce', '$cookies', '$http', function ($scope, $stateParams, PubSubService, $rootScope, $interval, MachineInfo, $window, bamAjaxCall, $uibModal, $sce, $cookies, $http) {

    $scope.alerts = [];
    var subscriptions = [];
    var session = PubSubService.getSession();
    $scope.loading = true;

    var infoRefreshRate;
    var dependentCount = 0;
    $scope.currentHost;

    var componentStatus = 0;

    var activityTab = angular.element(document.querySelector('#activityTab'));

    function compAction(action) {
        if (action == 'init') {
            $scope.component.spinner = 'Initializing..';
        } else if (action == 'start') {
            $scope.component.spinner = 'Starting..';
        } else if (action == 'stop') {
            $scope.component.spinner = 'Stopping..';
        } else if (action == 'remove') {
            $scope.component.spinner = 'Removing..';
        } else if (action == 'restart') {
            $scope.component.spinner = 'Restarting..';
        }
        var sessionKey = "com.bigsql." + action;
        var currentHost = $cookies.get('remote_host');
        if(currentHost == 'localhost' || currentHost == ''){
            session.call(sessionKey, [$scope.component.component]).then(function (argument) {
                callInfo();
            })
        }else{
            session.call(sessionKey, [$scope.component.component, $cookies.get('remote_host')]).then(function (argument) {
                callInfo();
            })
        }
    }

    function callInfo(argument) {
        if (argument) {
            var remote_host = argument;
        }else{
            var remote_host = $cookies.get('remote_host');            
        }
        remote_host = typeof remote_host !== 'undefined' ? remote_host : "";
        $scope.currentHost = remote_host;
        if (remote_host == "" || remote_host == "localhost") {
            var checkStatus = bamAjaxCall.getCmdData('status/' + $stateParams.component);    
        }else{
            var checkStatus = bamAjaxCall.getCmdData('status/' + $stateParams.component + '/' + remote_host);
        }
        
        checkStatus.then(function (data) {

            var infoUrl = 'info/'
            if (data.state != 'Running') {
                $scope.releaseTabEvent();
            }
            if (remote_host == "" || remote_host == "localhost") {
                var infoData = bamAjaxCall.getCmdData('info/' + $stateParams.component);
            } else {
                var infoData = bamAjaxCall.getCmdData('info/' + $stateParams.component + "/" + remote_host);
            }

            infoData.then(function (data) {
                // $scope.relnotes = $sce.trustAsHtml(data[0].rel_notes);
                if( typeof data !== 'string'){
                    $scope.loading = false;
                    if (data[0]['autostart'] == "on") {
                        data[0]['autostart'] = true;
                    } else {
                        data[0]['autostart'] = false;
                    }
                    if (window.location.href.split('/').pop(-1) == data[0].component) {
                        $scope.component = data[0];
                        if ($scope.component.status != "Running") {
                            $scope.activeReleaseNotes = true;
                            $scope.activeOverview = false;
                            $scope.uibStatus = {
                                tpsChartCollapsed: false,
                                rpsChartCollapsed: false,
                                diskChartCollapsed: true,
                                cpuChartCollapsed: true,
                                connectionsCollapsed: false
                            };
                        } else {
                            $scope.activeReleaseNotes = false;
                            $scope.activeOverview = true;
                            $scope.uibStatus = {
                                tpsChartCollapsed: true,
                                rpsChartCollapsed: true,
                                diskChartCollapsed: false,
                                cpuChartCollapsed: true,
                                connectionsCollapsed: false
                            };
                        }
                    }
                }
            });
        });
    };

    function callStatus(argument) {
        var remote_host = $cookies.get('remote_host');
        remote_host = typeof remote_host !== 'undefined' ? remote_host : "";

        if (remote_host == "" || remote_host == "localhost") {
            var statusData = bamAjaxCall.getCmdData('status');
        } else {
            var statusData = bamAjaxCall.getCmdData('hostcmd/status/'+ remote_host);
        }

        // var statusData = bamAjaxCall.getCmdData('status');
        statusData.then(function (data) {
            componentStatus = getCurrentObject(data, $stateParams.component);
            $rootScope.$emit('componentStatus', componentStatus);
            if (componentStatus != undefined && componentStatus.state != $scope.component.status) {
                callInfo(remote_host);
            }
        });
    }

    // callInfo();
    callStatus();

    $interval(callStatus, 5000);

    $scope.statusColors = {
        "Stopped": "orange",
        "NotInitialized": "yellow",
        "Running": "green"
    };

    $scope.optionList = [
        {label: "Off", value: "0"},
        {label: "5", value: ""},
        {label: "10", value: "10000"},
        {label: "15", value: "15000"},
        {label: "30", value: "30000"}
    ]

    $scope.opt = {
        interval: ''
    }

    var getCurrentObject = function (list, name) {
        var currentObject;
        for (var i = 0; i < list.length; i++) {
            if (list[i].component == name) {
                currentObject = list[i];
                return currentObject;
            }
        }
    };

    $rootScope.$on('sessionCreated', function () {
        var sessPromise = PubSubService.getSession();
        sessPromise.then(function (sessParam) {
            session = sessParam;
            $rootScope.$emit('topMenuEvent');
        });
    });

    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
        session = val;
        infoRefreshRate = $interval(function(){ callInfo(); }, 60000);
        $scope.component = {};
        callInfo();

        $scope.changeOption = function (value) {
            $rootScope.$emit('refreshRateVal', $scope.opt.interval);
        };

        $scope.autostartChange = function (args) {
            var autoStartVal;
            if (args) {
                autoStartVal = 'on';
            } else {
                autoStartVal = 'off';
            }
            var currentHost = $cookies.get('remote_host');
            if(currentHost == 'localhost' || currentHost == ''){
                session.call('com.bigsql.autostart', [autoStartVal, $stateParams.component]).then(
                    function (sub) {
                        callInfo();
                    });
            }else{
                session.call('com.bigsql.autostart', [autoStartVal, $stateParams.component, currentHost]).then(
                    function (sub) {
                        // callInfo();
                    });   
            }
        }

        $scope.dataBaseTabEvent = function (args) {
            if ($scope.component.status == "Running") {
                session.call('com.bigsql.db_list', [$stateParams.component]);
            }
        };

        $scope.cancelInstallation = function (action) {
            session.call("com.bigsql.cancelInstall", [$scope.currentHost]);
        }

        $scope.openInitPopup = function (comp) {
            var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/pgInitialize.html',
                controller: 'pgInitializeController',
            });
            modalInstance.component = comp;
            modalInstance.autoStartButton = $scope.component.autostart;
            modalInstance.dataDir = '';
            modalInstance.host = $scope.currentHost;
        };

        session.subscribe('com.bigsql.ondblist', function (data) {
            if (data[0].component == $stateParams.component) {
                $scope.myData = data[0].list;
                $scope.gridOptions = {
                    data: 'myData', columnDefs: [{
                        field: "datname", displayName: "Database"
                    }, {
                        field: 'owner', displayName: "Owner"
                    }, {
                        field: 'size',
                        displayName: "Size (MB)",
                        cellClass: 'numberCell',
                        headerTooltip: 'This is the total disk space used by the database, which includes all the database objects like Tables and Indexes within that database',
                        sort: {direction: 'desc', priority: 0}
                    }], enableColumnMenus: false
                };
                $scope.$apply();
            }
        });

        $scope.configureTabEvent = function (args) {
            if ($scope.component.status == "Running") {
                session.call('com.bigsql.pg_settings', [$stateParams.component]);
            }
        };

        session.subscribe('com.bigsql.onPGsettings', function (data) {
            if (data[0].component == $stateParams.component) {
                $scope.settingsData = data[0].list;
                $scope.gridSettings = {
                    expandableRowTemplate: '<div ui-grid="row.entity.subGridOptions" style="height: 140px"></div>',
                };

                $scope.gridSettings.columnDefs = [
                    {field: "name", displayName: 'Category'}
                ];

                $scope.gridSettings.enableColumnMenus = false;

                data = data[0].list;
                for (var i = 0; i < data.length; i++) {
                    data[i].subGridOptions = {
                        columnDefs: [
                            {
                                field: "name",
                                displayName: "Parameter",
                                cellTemplate: '<div class="ui-grid-cell-contents" title="{{row.entity.short_desc}}"><a>{{ COL_FIELD }}</a></div>'
                            },
                            {field: "setting", displayName: "value"},
                            {field: "short_desc", visible: false}],
                        data: data[i].settings,
                        enableColumnMenus: false
                    }
                }
                $scope.gridSettings.data = data;

                $scope.$apply();
            }
        });

        $scope.securityTabEvent = function (args) {
            session.call('com.bigsql.read_pg_hba_conf', [$stateParams.component]);
        };

        session.subscribe('com.bigsql.onPGhba', function (data) {
            if (data[0].component == $stateParams.component) {
                $scope.securityTabContent = data[0].contents;
                $scope.$apply();
            }
        });

        session.subscribe('com.bigsql.onAutostart', function (data) {
            var res = JSON.parse(data[0])[0];
            if (res['status'] == "error") {
                $scope.alerts.push({
                    msg: res['msg'],
                    type: "danger"
                });
            } else if (res['status'] == "completed") {
                $scope.alerts.push({
                    msg: res['msg']
                });
            }
            $scope.$apply();
        }).then(function (sub) {
            subscriptions.push(sub);
        });

        var onRemove = function (response) {
            var data = JSON.parse(response[0])[0];
            if (data.status == "error") {
                var alertObj = {
                    msg: data.msg,
                    type: "danger"
                }
                $scope.alerts.push(alertObj);
                $scope.$apply();
            }
            if (data.status == "complete") {
                callInfo();
            }
        };

        session.subscribe('com.bigsql.onRemove', onRemove).then(
            function (sub) {
                subscriptions.push(sub);
            });


        session.subscribe('com.bigsql.onInit', function (data) {
            var res = JSON.parse(data[0])[0];
            if (res['status'] == 'error') {
                $scope.alerts.push({
                    msg: res['msg'],
                    type: "danger"
                });
            } else {
                $scope.alerts.push({
                    msg: res['msg']
                });
                compAction('start');
            }
            $scope.$apply();
        }).then(function (sub) {
            subscriptions.push(sub);
        });

        $scope.closeAlert = function (index) {
            $scope.alerts.splice(index, 1);
        };

        
        $scope.releaseTabEvent = function (argument) {
            if($scope.relnotes == undefined || $scope.relnotes == ''){
                var remote_host = $cookies.get('remote_host');
                remote_host = typeof remote_host !== 'undefined' ? remote_host : "";

                if (remote_host == "" || remote_host == "localhost") {
                    var relnotes = bamAjaxCall.getCmdData('relnotes/info/' + $stateParams.component );
                } else{
                    var relnotes = bamAjaxCall.getCmdData('relnotes/info/' + $stateParams.component + '/' + remote_host );
                }             
                relnotes.then(function (data) {
                    $scope.relnotes = $sce.trustAsHtml(data[0].rel_notes);
                });
            }
        }

        session.subscribe('com.bigsql.onActivity', function (data) {
            if (data[0].component == $stateParams.component) {
                var parseData = data[0].activity;
                if (parseData === undefined || parseData.length == 0) {
                    $scope.activities = '';
                    $scope.noActivities = true;
                    activityTab.empty();
                } else {
                    $scope.noActivities = false;
                    $scope.activities = parseData;
                }
            }
        }).then(function (sub) {
            subscriptions.push(sub);
        });

        $scope.openWhatsNew = function () {
        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/whatsNew.html',
            controller: 'whatsNewController',
            size: 'lg',
        });
        modalInstance.component = $stateParams.component;
        modalInstance.version = $scope.component.version;
    }

        $scope.logdirSelect = function () {
            $interval.cancel(infoRefreshRate);
        }

        session.subscribe('com.bigsql.onInstall', function (response) {
            var data = JSON.parse(response[0])[0];
            if (data.state == "deplist") {
                if (data.deps.length > 1) {
                    dependentCount = data.deps.length;
                    $scope.component.installationDependents = true;
                }
            }
            if (data.status == "start") {
                $scope.component.installationStart = data;
                $scope.component.installation = true;
            }
            if (data.status == "wip") {
                $scope.component.installationRunning = data;
                $scope.component.progress = data.pct;
            }

            if (data.status == "complete" || data.status == "cancelled") {

                if (data.status == "cancelled") {
                    $scope.alerts.push({
                        msg: data.msg,
                        type: 'danger'
                    });
                } else if (data.state == 'unpack') {
                    session.call('com.bigsql.infoComponent', [$stateParams.component]);
                    $scope.component.status = 'NotInitialized';
                    $scope.openInitPopup($stateParams.component);
                }

                if (dependentCount != 0) {
                    dependentCount = dependentCount - 1;
                    if (dependentCount == 0) {
                        delete $scope.component.installationDependents;
                    }
                }

                delete $scope.component.installationStart;
                delete $scope.component.installationRunning;
                delete $scope.component.installation;

            }
            if (data.state == "error") {
                $scope.alerts.push({
                    msg: data.msg,
                    type: 'danger'
                });
                delete $scope.component.installationStart;
                delete $scope.component.installationRunning;
                delete $scope.component.installation;
            }
            $scope.$apply();
        }).then(function (sub) {
            subscriptions.push(sub);
        });
    });

    $rootScope.$on('refreshData', function (argument, host) {
        $scope.loading = true;
        $scope.relnotes = '';
        $interval.cancel(infoRefreshRate);
        callInfo(host);
    });

    $scope.action = function (event) {
        if (event.target.tagName === "A" && event.target.attributes.action != undefined) {
            if (event.target.attributes.action.value == 'init') {
                $scope.component.spinner = 'Initializing..';
            } else if (event.target.attributes.action.value == 'start') {
                $scope.component.spinner = 'Starting..';
            } else if (event.target.attributes.action.value == 'stop') {
                $scope.component.spinner = 'Stopping..';
            } else if (event.target.attributes.action.value == 'remove') {
                $scope.component.spinner = 'Removing..';
            } else if (event.target.attributes.action.value == 'restart') {
                $scope.component.spinner = 'Restarting..';
            }
            var sessionKey = "com.bigsql." + event.target.attributes.action.value;
            $scope.currentHost = $cookies.get('remote_host');
            if($scope.currentHost == 'localhost' || $scope.currentHost == ''){
                session.call(sessionKey, [$scope.component.component]);
            }else {
                if (event.target.attributes.action.value == 'install') {
                    $scope.component.installation = true;
                    session.call(sessionKey, [$scope.component.component, false, $scope.currentHost]);
                }else{
                    session.call(sessionKey, [$scope.component.component, $scope.currentHost]);
                }
            } 
            
        }
    };

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $rootScope.$on('initComp', function (event, comp) {
        $scope.component.spinner = 'Initializing..';
    });

    //need to destroy all the subscriptions on a template before exiting it
    $scope.$on('$destroy', function () {
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i]);
        }
        $interval.cancel(infoRefreshRate);
    });

}]);
angular.module('bigSQL.components').controller('ComponentDevopsUpdateController', ['$rootScope', '$scope', '$stateParams', 'PubSubService', '$state', '$uibModalInstance', 'MachineInfo', 'UpdateBamService','$window', 'bamAjaxCall', function ($rootScope, $scope, $stateParams, PubSubService, $state, $uibModalInstance, MachineInfo, UpdateBamService,$window, bamAjaxCall) {

    var subscriptions = [];
    var session;
    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
        session = val;
    });

    var infoData = bamAjaxCall.getCmdData('info/devops');
        infoData.then(function(info) {
            var data = info[0];
            $scope.updateVersion = data.current_version;
            $scope.currentVersion = data.version;
        });

    function updateComponents(val) {

        session = val;
        $scope.component = {};

        $scope.redirect = function () {
            $uibModalInstance.dismiss('cancel');
            $window.location.reload(true);
            $rootScope.$emit("bamUpdated");
        };

        $scope.action = function (event) {

            session.call('com.bigsql.update', ['devops']).then(
                function (sub) {
                    $scope.bamUpdateIntiated = true;
                    $scope.updatingStatus = true;
                    $scope.$apply()
                }, function (err) {
                    throw new Error('failed to install comp', err);
                });
        }

    };


    updateComponents();


    $rootScope.$on('sessionCreated', function () {

        var bamUpdatePromise = UpdateBamService.getBamUpdateInfo();
        bamUpdatePromise.then(function (info) {
            if (info.is_current == 1) {
                $scope.bamUpdatedStatus = true;
            } else {
                $scope.bamNotUpdatedStatus = true;
            }
            $scope.updatingStatus = false;
        }, function () {
            throw new Error('failed to subscribe to topic updateComponents', err);
        });


    }, function (failObj) {
        throw new Error(failObj);
    });


    //need to destroy all the subscriptions on a template before exiting it
    $scope.$on('$destroy', function () {
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i]);
        }
    });

}]);
angular.module('bigSQL.components').controller('ComponentsLogController', ['$scope', 'PubSubService', '$state','$interval','$location', '$window', '$rootScope', 'bamAjaxCall', '$cookies', '$sce', '$timeout', function ($scope, PubSubService, $state, $interval, $location, $window, $rootScope, bamAjaxCall, $cookies, $sce, $timeout) {

    var subscriptions = [];
    var count = 1;
    $scope.components = {};
    var autoScroll = true;
    $scope.logfile;
    $scope.intervalPromise = null;

    var session;
    var logviewer = angular.element( document.querySelector( '#logviewer' ) );

    $rootScope.$on('sessionCreated', function () {
        var sessPromise = PubSubService.getSession();
        sessPromise.then(function (sessParam) {
            session = sessParam;
            $rootScope.$emit('topMenuEvent');
        });
    });

    var infoData = bamAjaxCall.getCmdData('info')
    infoData.then(function(data) {
        $scope.pgcInfo = data[0];
    });

    var cookieVal = $cookies.get('selectedLog');
    if(cookieVal){
        $window.location.href = cookieVal;
        $scope.selectComp = cookieVal;
    }else{
        $scope.selectComp = "#"+$location.path();
    }

    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
        session = val;
        var logComponent = $location.path().split('log/').pop(-1);
        if (logComponent != 'pgcli'){
            session.call('com.bigsql.infoComponent',[logComponent]);
        } else {
            $scope.logfile = 'pgcli';
            // $scope.intervalPromise;
            session.call('com.bigsql.selectedLog',['pgcli']);  
        }
        
        session.subscribe('com.bigsql.onInfoComponent', function (args) {
            if (count == 1) {
                var jsonD = JSON.parse(args[0][0]);
                if(window.location.href.split('/').pop(-1) == jsonD[0].component){
                    if(jsonD[0].current_logfile){
                        $scope.logfile = jsonD[0].current_logfile;
                    } 
                    session.call('com.bigsql.selectedLog',[$scope.logfile]);
                    // $scope.intervalPromise;
                }
                count += 1;
            }
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        session.subscribe("com.bigsql.pgcliDir", function (dir) {
            $scope.selectedLog = dir[0];
            $scope.$apply();
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        session.call('com.bigsql.checkLogdir');

        session.subscribe("com.bigsql.onCheckLogdir", function (components) {
            $scope.components = JSON.parse(components[0]);
            $scope.$apply();
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        session.subscribe("com.bigsql.log", function (lg) {
            $scope.logFile = $sce.trustAsHtml(lg[0]);
            $timeout(function() {
              var scroller = document.getElementById("logviewer");
              scroller.scrollTop = scroller.scrollHeight;
            }, 0, false)
            $scope.$apply();
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        session.subscribe("com.bigsql.logError", function (err) {
            $("#logviewer").empty();
            $("#logviewer").append("<h4><br />" + err[0] + "</h4>");
        }).then(function (sub) {
            subscriptions.push(sub);
        });

        // $scope.intervalPromise = $interval(function(){
        //                             if($scope.logfile != undefined){
        //                                 session.call('com.bigsql.liveLog',[$scope.logfile]);                                        
        //                             }
        //                          },5000);

        $scope.tab = 1000;

        $scope.setTab = function (tabId) {
            $scope.tab = tabId;
        };

        $scope.isSet = function (tabId) {
            return $scope.tab === tabId;
        };

        $scope.selectedButton;

        $scope.selectButton = function(id) {
            $scope.selectedButton = id;
        }

    });

    $scope.isAutoScroll = function () {
        return autoScroll;
    }

    $scope.stopScrolling = function (event) {
        if (event.target.value == "checked"){
            event.target.value = "unchecked";
            $scope.checked = false;
            autoScroll = false;
        } else{
            event.target.value = "checked";
            autoScroll = true; 
        }      
    }

    function on_log(args) {
        $("#logviewer").append("<br />" + args[0]);
        if(autoScroll){
            tailScroll();
        }           
    };

    function tailScroll() {
        var height = $("#logviewer").get(0).scrollHeight;
        $("#logviewer").animate({
            scrollTop: height
        }, 5);
    };



    $scope.action = function (event) {
        $scope.logFile = '';
        session.call('com.bigsql.logIntLines',[event, $scope.logfile]);
    };

    $scope.onLogCompChange = function () {
        $cookies.put('selectedLog', $scope.selectComp);
        // $interval.cancel($scope.intervalPromise);
        $window.location.href = $scope.selectComp;
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i]);
        }
    };

    /**
     Unsubscribe to all the apis on the template and scope destroy
     **/
    $scope.$on('$destroy', function () {
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i]);
        }
    });

}]);

angular.module('bigSQL.components').controller('ComponentsSettingsController', ['$rootScope', '$scope', '$uibModal', 'PubSubService', 'MachineInfo', 'UpdateComponentsService', '$window', 'bamAjaxCall', '$cookies', function ($rootScope, $scope, $uibModal, PubSubService, MachineInfo, UpdateComponentsService, $window, bamAjaxCall, $cookies) {
    $scope.alerts = [];

    var session;
    var subscriptions = [];
    $scope.updateSettings;
    $scope.components = {};
    $scope.currentHost;
    $scope.showPgDgFeature = false;
    $scope.settingsOptions = [{name:'Weekly'},{name:'Daily'},{name:'Monthly'}]

    $scope.open = function (manual) {
        UpdateComponentsService.set('');
        if (manual == "manual") {
            UpdateComponentsService.setCheckUpdatesManual();
        } else {
            UpdateComponentsService.setCheckUpdatesAuto();
        }

        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/updateModal.html',
            windowClass: 'comp-details-modal',
            controller: 'ComponentsUpdateController',
        });
    };

    // var infoData = bamAjaxCall.getCmdData('info')
    // infoData.then(function(data) {
    //     $scope.pgcInfo = data[0];
    //     if (data[0].last_update_utc) {
    //         $scope.lastUpdateStatus = new Date(data[0].last_update_utc.replace(/-/g, '/') + " UTC").toString().split(' ',[5]).splice(1).join(' ');
    //     }
    //     if (MachineInfo.getUpdationMode() == "manual") {
    //         $scope.settingType = 'manual';
    //     } else {
    //         $scope.settingType = 'auto';
    //         session.call('com.bigsql.get_host_settings');
    //     }

    // });

    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
        $rootScope.$emit('topMenuEvent');
        session = val;

        session.call('com.bigsql.getBetaFeatureSetting', ['hostManager']);
        session.call('com.bigsql.getBetaFeatureSetting', ['pgdg']);

        session.subscribe("com.bigsql.onGetBeataFeatureSetting", function (settings) {
            if(settings[0].setting == 'hostManager'){
                if (settings[0].value == '0' || !settings[0].value) {
                    $scope.hostManager = false; 
                }else{
                    $scope.hostManager = true;
                }
            }else if(settings[0].setting == 'pgdg'){
                if (settings[0].value == '0' || !settings[0].value) {
                    $scope.pgdg = false; 
                }else{
                    $scope.pgdg = true;
                }
            }
           $scope.$apply();
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        $scope.updateManualSettings = function () {
            session.call('com.bigsql.update_host_settings', ['localhost', "None", '']).then(
                function (subscription) {
                    session.call('com.bigsql.get_host_settings').then(
                        function (sub) {
                            MachineInfo.setUpdationMode(sub);
                            var data = "Update settings has been set to Manual";
                            $scope.alerts.push({
                                msg: data
                            });
                            $scope.$apply();
                        });
                });
        };

        $scope.onAutomaticOptionSelection = function (value) {
            session.call('com.bigsql.update_host_settings', ['localhost', $scope.automaticSettings.name, '']).then(
                function (subscription) {
                    session.call('com.bigsql.get_host_settings').then(
                        function (sub) {
                            MachineInfo.setUpdationMode(sub);
                            var data = "Update settings has been set to " + sub.interval + ", next update is on " + sub.next_update_utc;
                            $scope.alerts.push({
                                msg: data
                            });
                            $scope.$apply();
                        });
                });
        };

        $scope.closeAlert = function (index) {
            $scope.alerts.splice(index, 1);
        };

        $scope.changeBetaFeature = function (name, setting) {
            var value, msg, type;
            if(setting){
                value = '1';
                msg = name + " feature is enabled.";
                type = 'success';
            }else{
                value = '0';
                msg = name + " feature is disabled.";
                type = 'warning';
            }
            session.call('com.bigsql.setBetaFeatureSetting', [name, value]);
            $scope.alerts.push({
                msg : msg,
                type : type
            });
        }

    });

    function getInfo(argument) {
        argument = typeof argument !== 'undefined' ? argument : "";
        $scope.currentHost = argument;
        if (argument=="" || argument == 'localhost'){
            var infoData = bamAjaxCall.getCmdData('info');
            var checkpgdgSupport = bamAjaxCall.getCmdData('info');
        } else{
            var infoData = bamAjaxCall.getCmdData('hostcmd/info/'+argument);
            var checkpgdgSupport = bamAjaxCall.getCmdData('hostcmd/info/'+argument);
        }

        infoData.then(function(data) {
            $scope.pgcInfo = data[0];
            if (data[0].last_update_utc) {
                var l_date = new Date(data[0].last_update_utc.replace(/-/g, '/') + " UTC").toString().split(' ',[5]).splice(1).join(' ');
                $scope.lastUpdateStatus = l_date.split(' ')[0] + ' ' + l_date.split(' ')[1].replace(/^0+/, '') + ', ' + l_date.split(' ')[2] + ' ' + l_date.split(' ')[3]
            }
            if (MachineInfo.getUpdationMode() == "manual") {
                $scope.settingType = 'manual';
            } else {
                $scope.settingType = 'auto';
                session.call('com.bigsql.get_host_settings');
            }
        });
        checkpgdgSupport.then(function (argument) {
            var data = argument[0];
            if(data.os.split(' ')[0] == 'CentOS'){
                $scope.showPgDgFeature = true;
            }
        })
    };

    $rootScope.$on('refreshUpdateDate', function (argument) {
       $window.location.reload(); 
    });

    getInfo($cookies.get('remote_host'));

    $scope.refreshData=function(hostArgument){
        $scope.currentHost = hostArgument;
        getInfo(hostArgument);
    };

    /**
     Unsubscribe to all the apis on the template and scope destroy
     **/
    $scope.$on('$destroy', function () {
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i]);
        }

    });

}]);
angular.module('bigSQL.components').controller('ComponentsStatusController', ['$scope', 'PubSubService', 'MachineInfo', '$interval', '$rootScope', '$window', 'bamAjaxCall','$uibModal', function ($scope, PubSubService, MachineInfo, $interval, $rootScope, $window, bamAjaxCall, $uibModal) {

    var subscriptions = [];
    $scope.comps = {};
    var session;
    var refreshRate;
    var currentComponent = {};
    var graphData = [0, 1, 2, 3, 4, 5, 6, 8, 9, 10];

    function callStatus(argument) {
        var statusData = bamAjaxCall.getCmdData('status');
        statusData.then(function(data) {
            $scope.comps = data;
            if($scope.comps.length == 0){
                $scope.showMsg = true;
            } else{
                $scope.showMsg = false;
            }
        });
    }

    function callInfo(argument) {
        var infoData = bamAjaxCall.getCmdData('info');
        infoData.then(function(data) {
            $scope.pgcInfo = data[0];
        });
    }

    function compAction(action, comp) {
        var sessionKey = "com.bigsql." + action;
        session.call(sessionKey, [comp]).then(function (argument) {
            callInfo();
        })
    }

    callStatus();
    callInfo();

    $interval(callStatus, 5000);

    $scope.alerts = [];
    $scope.init = false;
    $scope.statusColors = {
        "Stopped": "orange",
        "Not Initialized": "yellow",
        "Running": "green"
    };


    var apis = {
        "Stop": "com.bigsql.stop",
        "Restart": "com.bigsql.restart",
        "Initialize": "com.bigsql.init",
        "Start": "com.bigsql.start",
        "Remove": "com.bigsql.remove"
    };

    var getCurrentComponent = function (name) {
        for (var i = 0; i < $scope.comps.length; i++) {
            if ($scope.comps[i].component == name) {
                currentComponent = $scope.comps[i];
                return currentComponent;
            }
        }
    };
    
    $scope.cpuChart = {
        chart: {
            type: 'lineChart',
            height: 150,
            margin : {
                top: 20,
                right: 40,
                bottom: 40,
                left: 55
            },
            x: function(d){ return d.x; },
            y: function(d){ return d.y; },
            noData:"Loading...",
            interactiveLayer : {
                tooltip: {
                    headerFormatter: function (d) { 
                        var point = new Date(d);
                        return d3.time.format('%Y/%m/%d %H:%M:%S')(point); 
                    },
                },
            },
            xAxis: {
                xScale: d3.time.scale(),
                    tickFormat: function(d) { 
                        var point = new Date(d); 
                        return d3.time.format('%H:%M:%S')(point) 
                    },
                },
            yAxis: {
                tickFormat: function(d) { 
                    return d3.format(',')(d);
                }
            },
            forceY: [0,100],
            useInteractiveGuideline: true,
            duration: 500
        }
    };
    $scope.ioChart = angular.copy($scope.cpuChart);
    $scope.cpuChart.chart.type = "stackedAreaChart";
    $scope.cpuChart.chart.showControls = false;

    $scope.cpuData = [{
            values: [],      
            key: 'CPU System %', 
            color: '#006994' ,
            area: true 
        },{
            values: [],      
            key: 'CPU User %', 
            color: '#FF5733',
            area: true
        }
        ];

    $scope.diskIO = [{
        values: [],
        key: 'Read Bytes (MB)',
        color: '#FF5733'
    },{
        values: [],
        key: 'Write Bytes (MB)',
        color: '#006994'
    }];

    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
        $rootScope.$emit('topMenuEvent');
        session = val;

        session.subscribe("com.bigsql.graphs", function (data) {
            if($scope.cpuData[0].values.length > 60){
                $scope.cpuData[0].values.shift();
                $scope.cpuData[1].values.shift();
                $scope.diskIO[0].values.shift();
                $scope.diskIO[1].values.shift();             
            }
            var timeVal = Math.round( (new Date(data[0]['time'] + ' UTC')).getTime() )
            $scope.cpuData[0].values.push({x:timeVal, y:data[0]['cpu_per']['system']});
            $scope.cpuData[1].values.push({x:timeVal, y:data[0]['cpu_per']['user']});
            $scope.diskIO[0].values.push({x:timeVal,y:data[0]['io']['read_bytes']});
            $scope.diskIO[1].values.push({x:timeVal,y:data[0]['io']['write_bytes']});
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        session.subscribe("com.bigsql.initgraphs", function (data) {
            var graph_data = data[0];
            $scope.cpuData[1].values.length = 0;
            $scope.cpuData[0].values.length = 0;
            $scope.diskIO[0].values.length = 0;
            $scope.diskIO[1].values.length = 0;
            for (var i=0;i<graph_data.length;i=i+1){
                var timeVal = Math.round( (new Date( graph_data[i]['time'] + ' UTC')).getTime() );
                $scope.cpuData[0].values.push({x:timeVal, y:graph_data[i]['cpu_per']['system']});
                $scope.cpuData[1].values.push({x:timeVal, y:graph_data[i]['cpu_per']['user']});
                $scope.diskIO[0].values.push({ x: timeVal,  y: graph_data[i]['io']['read_bytes']});
                $scope.diskIO[1].values.push({ x: timeVal,  y: graph_data[i]['io']['write_bytes']})
            }
            if( $scope.cpuData.length <= 2){
                $scope.cpuChart.chart.noData = "No Data Available."
            }
            if( $scope.diskIO.length <= 2){
                $scope.ioChart.chart.noData = "No Data Available."
            }

        }).then(function (subscription) {
            subscriptions.push(subscription);
             refreshRate = $interval(callGraphs,5000);
        });

        // session.call("com.bigsql.serverStatus");

        session.call("com.bigsql.initial_graphs");

        $rootScope.$on('initComp', function (event, comp) {
            currentComponent = getCurrentComponent(comp);
            currentComponent.showingSpinner = true;
        });

        session.subscribe('com.bigsql.onInit', function (data) {
            var res = JSON.parse(data[0])[0];
            if(res['status'] == 'error'){
                $scope.alerts.push({
                    msg: res['msg'],
                    type: "danger"
                });
            } else {
                $scope.alerts.push({
                    msg: res['msg']
                });
                currentComponent = getCurrentComponent(res['component']);
                compAction('start', res['component']);
            // currentComponent.showingSpinner = false;
            }
        }).then(function (sub) {
            subscriptions.push(sub);
        }); 

        $scope.closeAlert = function (index) {
            $scope.alerts.splice(index, 1);
        };

    });

    $scope.openInitPopup = function (comp) {
            var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/pgInitialize.html',
                controller: 'pgInitializeController',
            });
            modalInstance.component = comp;
        };

    $scope.action = function (event) {
        var showingSpinnerEvents = [ 'Start', 'Stop'];
        if(showingSpinnerEvents.indexOf(event.target.innerText) >= 0 ){
            currentComponent = getCurrentComponent(event.currentTarget.getAttribute('value'));
            currentComponent.showingSpinner = true;
        }
        if (event.target.tagName == "A" && event.target.attributes.action != undefined) {
            session.call(apis[event.target.innerText], [event.currentTarget.getAttribute('value')]);
        }
        ;
    };

    function handleVisibilityChange() {
      if (document.visibilityState == "hidden") {
        $interval.cancel(refreshRate);
      } else if(document.visibilityState == "visible"){
        session.call("com.bigsql.initial_graphs");
        refreshRate = $interval(callGraphs,5000);
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange, false);

    function callGraphs() {
        session.call('com.bigsql.live_graphs');
    }


    /**
     Unsubscribe to all the apis on the template and scope destroy
     **/
    $scope.$on('$destroy', function () {
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i]);
        };
        $interval.cancel(refreshRate);
    });


}]);
angular.module('bigSQL.components').controller('ComponentsUpdateController', ['$scope', '$uibModalInstance', 'PubSubService', 'UpdateComponentsService', 'MachineInfo', '$window', 'bamAjaxCall', '$rootScope', '$cookies', '$uibModal', '$sce', function ($scope, $uibModalInstance, PubSubService, UpdateComponentsService, MachineInfo, $window, bamAjaxCall, $rootScope, $cookies, $uibModal, $sce) {

    var session;
    var subscriptions = [];
    $scope.components = {};

    var updateSelectedList = [];
    var currentComponent = {};
    var checkUpdates;
    $scope.currentHost = $cookies.get('remote_host');
    $scope.showText = "More";   
    $scope.alerts = [];
    $scope.updateAll = false;
    $scope.hideNewComponents = true;

    function getList(argument) {
        argument = typeof argument !== 'undefined' ? argument : "";
        $scope.currentHost = argument;
        if (argument=="localhost" || argument == ''){
            var listData = bamAjaxCall.getCmdData('relnotes/list');
        } else{
            var listData = bamAjaxCall.getCmdData('hostcmd/list/'+argument);
        }
        $scope.loadingSpinner = true;
        $scope.body = false;
        listData.then(function(data) {
            data = $(data).filter(function(i,n){ return n.component != 'bam2' && n.component != 'pgdevops'  ;})
            $scope.loadingSpinner = false;
            $scope.body = true;
            $scope.body = true;
            $scope.noUpdates = true;

            $scope.allComponents = data;
            $scope.hideLatestInstalled = true;

            $scope.components = $(data).filter(function(i,n){ return n.updates>0 ;});
            
            for (var i = 0; i < $scope.components.length; i++) {
                if($scope.components[i].is_current == 0 && $scope.components[i].current_version){
                    $scope.noUpdates = false;
                }
            }

            for (var i = 0; i < $scope.allComponents.length; i++) {
                if ($scope.allComponents[i].category_desc == "Extensions") {
                    $scope.allComponents[i].componentImage = $scope.allComponents[i].component.split('-')[0].replace(/[0-9]/g,'')                    
                }
                $scope.allComponents[i].rel_notes = $sce.trustAsHtml($scope.allComponents[i].rel_notes);
                $scope.allComponents[i].curr_release_date = new Date($scope.allComponents[i].curr_release_date).toString().split(' ',[4]).splice(1).join(' ');
                $scope.allComponents[i].curr_release_date = $scope.allComponents[i].curr_release_date.split(' ')[0] + ' ' + $scope.allComponents[i].curr_release_date.split(' ')[1].replace(/^0+/, '') + ', ' + $scope.allComponents[i].curr_release_date.split(' ')[2];
                if ($scope.allComponents[i].install_date) {
                    $scope.allComponents[i].install_date = new Date($scope.allComponents[i].install_date).toString().split(' ',[4]).splice(1).join(' ');
                    $scope.allComponents[i].install_date = $scope.allComponents[i].install_date.split(' ')[0] + ' ' + $scope.allComponents[i].install_date.split(' ')[1].replace(/^0+/, '') + ', ' + $scope.allComponents[i].install_date.split(' ')[2];
                }
                if($scope.allComponents[i].is_new == 1){
                    $scope.hideNewComponents = true;
                }
                if($scope.allComponents[i].is_updated == 1){
                    $scope.hideLatestInstalled = false;
                }
                if ($scope.noUpdates) {
                    $scope.uibStatus = {
                        newComponents : true,
                        installedComponents : true
                    }
                }else{
                    $scope.uibStatus = {
                        newComponents : false,
                        installedComponents : false
                    }
                }
            }
        });
    };

    var hostsList = bamAjaxCall.getCmdData('hosts');

    hostsList.then(function (data) {
        if (data.length > 0 && data[0].status == "error") {
            $scope.hosts = [];
        } else {
            $scope.hosts = data;
        }
    });

    var remote_host = $cookies.get('remote_host');
    remote_host = typeof remote_host !== 'undefined' ? remote_host : "";
    if (remote_host == "" || remote_host == undefined) {
        $scope.selecthost = 'localhost';    
    } else {
        $scope.selecthost = remote_host;
    }

    if (UpdateComponentsService.get()) {
        $scope.selectedComp = UpdateComponentsService.get();
    }
    ;

    if (UpdateComponentsService.getCheckUpdates()) {
        checkUpdates = true;
    } else {
        checkUpdates = false;
    }
    
    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
        $scope.updateSettings = MachineInfo.getUpdationMode();
        session = val;
        if (!checkUpdates) {
            $scope.body = true;
            getList($scope.currentHost);
        } else {
            $scope.loadingSpinner = true;
            $scope.body = false;
            session.call('com.bigsql.updatesCheck').then(
                function (sub) {
                    $scope.loadingSpinner = false;
                    $scope.body = true;
                    getList($scope.currentHost);
                });
        }

        $scope.ok = function () {
            $uibModalInstance.close();
        };

        $scope.cancel = function () {
            $rootScope.$emit('refreshUpdateDate');
            $uibModalInstance.dismiss('cancel');
        };

        var getCurrentComponent = function (name) {
            for (var i = 0; i < $scope.components.length; i++) {
                if ($scope.components[i].component == name) {
                    currentComponent = $scope.components[i];
                    return currentComponent;
                }
            }
        };

        session.subscribe("com.bigsql.onInstall", function (installStream) {
            var data = JSON.parse(installStream[0])[0];
            if (data.status == "start") {
                currentComponent = getCurrentComponent(data.component);
                currentComponent.installationStart = data;
                currentComponent.installation = true;
            } else if (data.status == "wip") {
                currentComponent = getCurrentComponent(data.component);
                currentComponent.installationRunning = data;
                currentComponent.progress = data.pct;
            } else if (data.status == "complete" && data.state == "download") {
                currentComponent = getCurrentComponent(data.component);
                delete currentComponent.installationStart;
                delete currentComponent.installationRunning;
                delete currentComponent.installation;
            } else if (data.status == "complete" && data.state == "update" || data.status == "cancelled") {
                delete currentComponent.installationStart;
                delete currentComponent.installationRunning;
                delete currentComponent.installation;
                if (data.state == 'unpack' || data.state == 'update') {
                    console.log("In complete");
                    // session.call('com.bigsql.infoComponent', [$scope.currentComponent])
                    $scope.alerts.push({
                            msg:  data.msg,
                            type: 'success'
                        });
                } 
                if (data.status == "cancelled") {
                        $scope.alerts.push({
                            msg:  data.msg,
                            type: 'danger'
                        });
                }
                angular.element(document.querySelector('#' + currentComponent.component)).remove();
                if ($scope.components.length == 1 ) {
                    // session.call("com.bigsql.getBamConfig");
                    $uibModalInstance.dismiss('cancel');
                    $rootScope.$emit('updatesCheck');
                }
                if($scope.updateAll){
                    $scope.components.splice(0,1);
                }
            }
            $scope.$apply();
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        $scope.compAction = function (action, compName) {
            var sessionKey = "com.bigsql." + action;
            if($scope.currentHost == 'localhost' || $scope.currentHost == ''){
                session.call(sessionKey, [compName]);
            }else {
                currentComponent = getCurrentComponent(compName);
                currentComponent.init = true;
                var event_url = action + '/' + compName + '/' + $scope.currentHost ;
                var eventData = bamAjaxCall.getCmdData(event_url);
                eventData.then(function(data) {
                    getList($scope.currentHost);
                });
            }
        };

        // var selUpdatedComp = [];

        $scope.selectedUpdate = function (comp) {
            if (comp) {
                $scope.compAction('update', comp);
            }else{
                $scope.compAction('update', '');
                $scope.updateAll = true;
            }
        };

    });

    $scope.changeHeight = function (argument) {
       var myDiv = document.getElementById('relnotesId_'+argument);
       var text = document.getElementById('showText_'+argument);
       if(myDiv.style.height == '100px'){
            myDiv.style.height = '300px';
            text.innerHTML = "Less..."
       }else{
            myDiv.style.height = '100px';
            text.innerHTML = "More..."
       }
       // $scope.showText = "Less";
    }

    $scope.changeHeightInstalled = function (argument) {
       var myDiv = document.getElementById('installedRelnotes_'+argument);
       var text = document.getElementById('installedshowText_'+argument);
       if(myDiv.style.height == '100px'){
            myDiv.style.height = '300px';
            text.innerHTML = "Less..."
       }else{
            myDiv.style.height = '100px';
            text.innerHTML = "More..."
       }
       // $scope.showText = "Less";
    }

    $scope.changeHeightReleased = function (argument) {
       var myDiv = document.getElementById('releasedRelnotesId_'+argument);
       var text = document.getElementById('releasedShowText_'+argument);
       if(myDiv.style.height == '100px'){
            myDiv.style.height = '300px';
            text.innerHTML = "Less..."
       }else{
            myDiv.style.height = '100px';
            text.innerHTML = "More..."
       }
       // $scope.showText = "Less";
    }

    $scope.openDetailsModal = function (comp) {
        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/details.html',
            // windowClass: 'comp-details-modal',
            size : 'lg',
            controller: 'ComponentDetailsController',
            keyboard  : false,
            backdrop  : 'static',
        });
        modalInstance.component = comp;
        modalInstance.isExtension = true;
    };

    $scope.hostChange = function (host) {
        $scope.loadingSpinner = true;
        $scope.body = false;
        getList(host);
    };

    $scope.cancelInstallation = function (action) {
        session.call("com.bigsql.cancelInstall", [$scope.currentComponent]);
        getList($scope.currentHost);
    }

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };


    /**
     Unsubscribe to all the apis on the template and scope destroy
     **/
    $scope.$on('$destroy', function () {
        $rootScope.$emit('refreshUpdateDate');
        $rootScope.$emit('topMenuEvent');
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i]);
        }

    });

}]);

angular.module('bigSQL.components').controller('ComponentsViewController', ['$scope', '$uibModal', 'PubSubService', '$state', 'UpdateComponentsService', '$filter', '$rootScope', '$timeout', '$window', 'bamAjaxCall', '$http', '$cookies', function ($scope, $uibModal, PubSubService, $state, UpdateComponentsService, $filter, $rootScope, $timeout, $window, bamAjaxCall, $http, $cookies) {

    $scope.alerts = [];

    var subscriptions = [];
    $scope.components = {};

    var currentComponent = {};
    var parentComponent = {};
    var dependentCount = 0;
    var depList = [];
    var session;
    var pid;
    var getListCmd = false;
    $scope.currentHost;
    $scope.updateSettings;
    $scope.loading = true;
    $scope.retry = false;
    $scope.disableShowInstalled = false;
    $scope.extensionsList = [];
    $scope.showPgDgTab = false;
    $scope.gettingPGDGdata = false;

    var getCurrentComponent = function (name) {
        for (var i = 0; i < $scope.components.length; i++) {
            if ($scope.components[i].component == name) {
                currentComponent = $scope.components[i];
                return currentComponent;
            }
        }
    };

    function changePostgresOrder(data) {
        var comps = data;
        var pgComps = [];
        var nonPgComps = [];

        for (var i = 0; i < comps.length; i++) {
            if(comps[i]['category_desc'] == 'PostgreSQL'){
                pgComps.push(comps[i]);
            }else{
                nonPgComps.push(comps[i]);
            };
        }
        return  pgComps.reverse().concat(nonPgComps);
    }

    $scope.getExtensions = function( comp, idx) {
        if ($scope.components[idx].extensionOpened) {
            $window.location = '#/details-pg/' + comp
        }
        $cookies.putObject('openedExtensions', {'component': comp, 'index': idx});
        for (var i = 0; i < $scope.components.length; i++) {
            $scope.components[i].extensionOpened = false;           
        }
        $scope.components[idx].extensionOpened = true;
        if ($scope.currentHost=="" || $scope.currentHost == 'localhost'){
            var extensionsList = bamAjaxCall.getCmdData('extensions/' + comp);
        } else{
            var extensionsList = bamAjaxCall.getCmdData('extensions/' + comp + '/' + $scope.currentHost);
        }
        // var extensionsList = bamAjaxCall.getCmdData('extensions/' + comp);
        extensionsList.then(function (argument) {
            if (argument[0].state != 'error') {
                $scope.extensionsList = argument;
                if ($scope.showInstalled) {
                    $scope.extensionsList = $($scope.extensionsList).filter(function(i,n){ return n.status != "NotInstalled" ;})   
                }
                for (var i = $scope.extensionsList.length - 1; i >= 0; i--) {
                    $scope.extensionsList[i].modifiedName = $scope.extensionsList[i].component.split('-')[0].replace(/[0-9]/g,'');
                }
            }
        })   
    }

    function getList(argument) {
        argument = typeof argument !== 'undefined' ? argument : "";
        $scope.currentHost = argument;
        if (argument=="" || argument == 'localhost'){
            var listData = bamAjaxCall.getCmdData('list');
            var checkpgdgSupport = bamAjaxCall.getCmdData('info');
        } else{
            var listData = bamAjaxCall.getCmdData('hostcmd/list/'+argument);
            var checkpgdgSupport = bamAjaxCall.getCmdData('hostcmd/info/'+argument);
        }

        listData.then(function (data) {
            $rootScope.$emit('showUpdates');
            if(data == "error" || data[0].state == 'error'){
                $timeout(wait, 5000);
                $scope.loading = false;
                $scope.retry = true;
                $cookies.remove('remote_host');
            } else {
                $scope.nothingInstalled = false;
                data = $(data).filter(function(i,n){ return n.component != 'bam2' && n.component != 'pgdevops'});
                if ($scope.showInstalled) {
                    $scope.components = changePostgresOrder($(data).filter(function(i,n){ return n.status != "NotInstalled" ;}));
                    if($scope.components.length == 0){
                        $scope.components = [];
                        $scope.nothingInstalled = true;
                    }
                } else{
                        $scope.components = changePostgresOrder(data);
                }
                $scope.loading = false;
                for (var i = 0; i < $scope.components.length; i++) {
                    $scope.components[i].extensionOpened = false;                    
                }
                var Checkupdates = 0;
                for (var i = 0; i < $scope.components.length; i++) {
                    Checkupdates += $scope.components[i].updates;
                } 
            }
            if($cookies.get('openedExtensions')){
                var extensionCookie = JSON.parse($cookies.get('openedExtensions'));
                $scope.getExtensions( extensionCookie.component, extensionCookie.index);
            }else{
                $scope.getExtensions( $scope.components[0].component, 0);                
            }
        });
        checkpgdgSupport.then(function (argument) {
            var data = argument[0];
            if(data.os.split(' ')[0] == 'CentOS'){
                $scope.showPgDgTab = true;
            }
        })
    };

    getList($cookies.get('remote_host'));

    $rootScope.$on('updatePackageManager', function (argument) {
        getList($cookies.get('remote_host'));
    });

    $rootScope.$on('refreshData', function (argument, host) {
        $scope.loading = true;
        $scope.currentHost = host;
        getList(host);
    });

    $rootScope.$on('sessionCreated', function () {
        var sessPromise = PubSubService.getSession();
        sessPromise.then(function (sessParam) {
            session = sessParam;
        });
    });

    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
        session = val;

        // session.call('com.bigsql.info');

         session.call('com.bigsql.getBetaFeatureSetting', ['pgdg']);

        session.subscribe("com.bigsql.onGetBeataFeatureSetting", function (settings) {
            if(settings[0].setting == 'pgdg'){
                if(settings[0].value == '0' || !settings[0].value){
                    $scope.checkpgdgSetting = false;
                }else{
                    $scope.checkpgdgSetting = true;
                }
            }
           $scope.$apply();
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        $scope.open = function (manual) {

            try {
                UpdateComponentsService.set(this.c);
            } catch (err) {};

            if (manual == "manual") {
                UpdateComponentsService.setCheckUpdatesManual();
            } else {
                UpdateComponentsService.setCheckUpdatesAuto();
            }
            var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/updateModal.html',
                windowClass: 'comp-details-modal',
                controller: 'ComponentsUpdateController',
            });
        };

        $scope.openInitPopup = function (comp) {
            var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/pgInitialize.html',
                controller: 'pgInitializeController',
            });
            modalInstance.component = comp;
            modalInstance.autoStartButton = true;
            modalInstance.dataDir = '';
            modalInstance.host = $scope.currentHost;

        };

        $scope.openDetailsModal = function (comp) {
            var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/details.html',
                // windowClass: 'comp-details-modal',
                size: 'lg',
                controller: 'ComponentDetailsController',
                keyboard  : false,
                backdrop  : 'static',
            });
            modalInstance.component = comp;
            modalInstance.isExtension = true;
        };

        session.call('com.bigsql.getBamConfig', ['showInstalled']);
        session.subscribe("com.bigsql.onGetBamConfig", function (settings) {
           $scope.showInstalled = settings[0];
           $scope.$apply();
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        session.call('com.bigsql.getTestSetting');
        session.subscribe("com.bigsql.onGetTestSetting", function (settings) {
            if(settings[0] == "test"){
               $scope.isList = true;
            }else{
                $scope.isList = false;
            }
           $scope.$apply();
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        function wait() {
            $window.location.reload();
        };

        var infoData = bamAjaxCall.getCmdData('info');
        infoData.then(function (data) {
            $scope.machineInfo =  data[0];
            var myDate = new Date();
            var previousDay = new Date(myDate);
            previousDay.setDate(myDate.getDate() - 7);
            $scope.prevWeek = $filter('date')(previousDay, 'yyyy-MM-dd');
            for (var i = 0; i < $scope.machineInfo.length; i++) {
                if ($scope.machineInfo[i].interval == null) {
                    if ($scope.machineInfo[i].last_update_utc == null || $scope.machineInfo[i].last_update_utc < $scope.prevWeek) {
                        $scope.updateBtn = true;
                    }
                }
            }
            if ($scope.machineInfo.interval == null || !$scope.machineInfo.interval) {
                $scope.updateSettings = 'manual'; 
            } else {
                $scope.updateSettings = 'auto';
            }
        });
    
        $scope.setTest = function (event) {
            var param;
            if($scope.isList){
                param = 'test';
            }else{
                param = 'prod'
            }
            session.call('com.bigsql.setTestSetting',[param]);
            getList();
            // session.call('com.bigsql.list');
        };

    });

    $scope.installedComps = function (event) {
        session.call('com.bigsql.setBamConfig',['showInstalled', $scope.showInstalled]);
        getList($scope.currentHost); 
        // session.call('com.bigsql.list');
    }

    $scope.repoChange = function (repo) {
        $scope.gettingPGDGdata = true;
        $scope.repoNotRegistered = false;
        localStorage.setItem('cacheRepo', repo);
        if ($scope.currentHost == 'localhost' || $scope.currentHost == '') {
            var getRepoList =  bamAjaxCall.getCmdData('pgdg/'+ repo + '/list');
        }else{
            var getRepoList = bamAjaxCall.getCmdData('pgdghost/'+ repo + '/list/' + $scope.currentHost)
        }        
        getRepoList.then(function (argument) {
            $scope.gettingPGDGdata = false;
            if(argument[0].state == 'error' || argument == 'error'){
                $scope.errorMsg = argument[0].msg;
                if(!$scope.errorMsg){
                    $scope.errorMsg = "Selected Repository is not registered."
                }
                $scope.repoNotRegistered = true;
            }else{
                $scope.repoNotRegistered = false;
                $scope.repoList = argument;
                $scope.showRepoList = true;
            }
        })      
    }

    $scope.refreshRepoList = function (repo) {
        if ($scope.currentHost == 'localhost' || $scope.currentHost == '') {
            var getRepoList =  bamAjaxCall.getCmdData('pgdg/'+ repo + '/list');
        }else{
            var getRepoList = bamAjaxCall.getCmdData('pgdghost/'+ repo + '/list/' + $scope.currentHost)
        }
        getRepoList.then(function (argument) {
            if(argument != 'error' || argument != 'error'){
                $scope.repoList = argument;
            }
        }) 
    }

    $scope.selectPgDg = function (argument) {
        $scope.noRepoFound = false;
        $scope.gettingPGDGdata = true;
        $scope.showRepoList = false;
        $scope.repoNotRegistered = false;
        if ($scope.currentHost == 'localhost' || $scope.currentHost == '') {
            var pgdgComps = bamAjaxCall.getCmdData('repolist')
        }else{
            var pgdgComps = bamAjaxCall.getCmdData('hostcmd/repolist/'+$scope.currentHost)
        }
        pgdgComps.then(function (data) {
            $scope.gettingPGDGdata = false;
            $scope.showRepoList = true;
            $scope.pgdgRepoList = [];
            $scope.pgdgInstalledRepoList = [];
            for (var i = data.length - 1; i >= 0; i--) {
                if (data[i].status == 'Installed') {
                    $scope.pgdgInstalledRepoList.push(data[i]);                    
                }
            }
            $scope.pgdgRepoList = data;
            if ($scope.pgdgInstalledRepoList.length < 1) {
                $scope.noRepoFound = true;
                $scope.availRepos = data;
                $scope.selectAvailRepo = data[0].repo;
                localStorage.setItem('cacheRepo', '');
            }else{
                $scope.noRepoFound = false;
                var selectedRepo, cookieData;
                cookieData = localStorage.getItem('cacheRepo');
                if (cookieData){
                    selectedRepo = cookieData;
                }else{
                    selectedRepo = $scope.pgdgRepoList[0].repo;
                }
                $scope.selectRepo = selectedRepo;
                $scope.repoChange(selectedRepo);
            }
        })
    }

    $scope.registerRepo = function (argument) {
        $scope.registeringRepo = true;
        var registerRepository = bamAjaxCall.getCmdData('pgdg/' + argument + '/register' )
        registerRepository.then(function (data) {
            $scope.registeringRepo = false;
            $scope.repoNotRegistered = false;
            // localStorage.setItem('cacheRepo', '');
           $scope.selectPgDg(); 
        });
    }

    $scope.compAction = function (action, compName) {
        var sessionKey = "com.bigsql." + action;
        $scope.disableShowInstalled = true;
        if(action == "init"){
            currentComponent = getCurrentComponent(compName);
            currentComponent.init = true;
        } else if(action == "remove"){
            currentComponent = getCurrentComponent(compName);
            currentComponent.removing = true;
        }
        if($scope.currentHost == 'localhost' || $scope.currentHost == ''){
            session.call(sessionKey, [compName]);
        }else {
            currentComponent = getCurrentComponent(compName);
            currentComponent.init = true;
            var event_url = action + '/' + compName + '/' + $scope.currentHost ;
            var eventData = bamAjaxCall.getCmdData(event_url);
            eventData.then(function(data) {
                getList($scope.currentHost);
            });
        }
        if (action == 'update' && compName == 'bam2') {
            var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/bamUpdateModal.html',
                windowClass: 'bam-update-modal modal',
                controller: 'bamUpdateModalController',
            });
        } 
    };

    $scope.pgdgAction = function (action, compName) {
        var cur_comp = {};
        for (var i = 0; i < $scope.repoList.length; i++) {
            if ($scope.repoList[i].component == compName) {
                $scope.repoList[i].showingSpinner = true;
            }
        }
        var pgdgCompAction = bamAjaxCall.getCmdData('pgdg/' + $scope.selectRepo + '/'+ action + '/' + compName);
        pgdgCompAction.then(function (argument) {
            $scope.refreshRepoList($scope.selectRepo);
        })
    }

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $rootScope.$on('initComp', function (event, comp) {
        currentComponent = getCurrentComponent(comp);
        currentComponent.init = true;
    });

    function wait() {
        $window.location.reload();
    };

    $timeout(function() {
        if ($scope.loading) {
            $window.location.reload();
        };
    }, 10000);

    //need to destroy all the subscriptions on a template before exiting it
    $scope.$on('$destroy', function () {
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i])
        }
    });
}]);
angular.module('bigSQL.components').controller('HostsController', ['$scope', '$uibModal', 'PubSubService', '$state', 'UpdateComponentsService', '$filter', '$rootScope', '$timeout', '$window', '$http', '$location', 'bamAjaxCall', '$interval', '$cookies', '$cookieStore', function ($scope, $uibModal, PubSubService, $state, UpdateComponentsService, $filter, $rootScope, $timeout, $window, $http, $location, bamAjaxCall, $interval, $cookies, $cookieStore) {

    $scope.alerts = [];

    var subscriptions = [];
    $scope.components = {};

    var currentComponent = {};
    var parentComponent = {};
    var dependentCount = 0;
    var depList = [];
    var session;
    var pid;
    var stopStatusCall;
    var stopPGCall;
    var getListCmd = false;
    $scope.updateSettings;
    $scope.loading = true;
    $scope.retry = false;
    $scope.disableShowInstalled = false;
    var previousTopData = "";
    $scope.openedHostIndex = '';
    $scope.openedGroupIndex = '';
    $scope.addedNewHost = false;
    // $scope.groupOpen = true;
    // $scope.hostOpen = true;

    $scope.statusColors = {
        "Stopped": "orange",
        "Not Initialized": "yellow",
        "Running": "green"
    };

    var apis = {
        "Stop": "com.bigsql.stop",
        "Restart": "com.bigsql.restart",
        "Initialize": "com.bigsql.init",
        "Start": "com.bigsql.start",
        "Remove": "com.bigsql.remove"
    };

    var host_info ;

    $scope.cpuChart = {
        chart: {
            type: 'lineChart',
            height: 150,
            margin: {
                top: 20,
                right: 40,
                bottom: 40,
                left: 55
            },
            x: function (d) {
                return d.x;
            },
            y: function (d) {
                return d.y;
            },
            noData: "Loading...",
            interactiveLayer: {
                tooltip: {
                    headerFormatter: function (d) {
                        var point = new Date(d);
                        return d3.time.format('%Y/%m/%d %H:%M:%S')(point);
                    },
                    gravity : 'n',
                },
            },
            xAxis: {
                xScale: d3.time.scale(),
                tickFormat: function (d) {
                    var point = new Date(d);
                    return d3.time.format('%H:%M:%S')(point)
                },
            },
            yAxis: {
                tickFormat: function (d) {
                    return d3.format(',')(d);
                }
            },
            showLegend: false,
            forceY: [0, 100],
            useInteractiveGuideline: true,
            duration: 500
        }
    };
    $scope.ioChart = angular.copy($scope.cpuChart);
    $scope.networkChart = angular.copy($scope.cpuChart);
    $scope.cpuChart.chart.type = "stackedAreaChart";
    $scope.cpuChart.chart.showControls = false;

    $scope.cpuData = [{
        values: [],
        key: 'CPU System %',
        color: '#006994',
        area: true
    }, {
        values: [],
        key: 'CPU User %',
        color: '#FF5733',
        area: true
    }
    ];

    $scope.diskIO = [{
        values: [],
        key: 'Read Bytes (kB)',
        color: '#FF5733'
    }, {
        values: [],
        key: 'Write Bytes (kB)',
        color: '#006994'
    }];

    $scope.NetworkIO = [{
        values: [],
        key: 'Sent Bytes (kB)',
        color: '#FF5733'
    }, {
        values: [],
        key: 'Received Bytes (kB)',
        color: '#006994'
    }];

    var sessionPromise = PubSubService.getSession();

    sessionPromise.then(function (val) {
        session = val;

        session.call('com.bigsql.getBetaFeatureSetting', ['hostManager']);

        session.subscribe("com.bigsql.onGetBeataFeatureSetting", function (settings) {
            if(settings[0].setting == 'hostManager'){
                if(settings[0].value == '0' || !settings[0].value){
                    $scope.betaFeature = false;
                }else{
                    $scope.betaFeature = true;
                }
            }
           $scope.$apply();
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });
    });

    var getCurrentComponent = function (name, host) {
        for (var i = 0; i < $scope.hostsList.length; i++) {
            if($scope.hostsList[i].host == host){
                for (var j = 0; j < $scope.hostsList[i].comps.length; j++) {
                    if ($scope.hostsList[i].comps[j].component == name) {
                        currentComponent = $scope.hostsList[i].comps[j];
                        return currentComponent;
                    }
                }
            }
        }
    };

    function changePostgresOrder(data) {
        var comps = data;
        var pgComps = [];
        var nonPgComps = [];

        for (var i = 0; i < comps.length; i++) {
            if (comps[i]['category_desc'] == 'PostgreSQL') {
                pgComps.push(comps[i]);
            } else {
                nonPgComps.push(comps[i]);
            }
            ;
        }
        return pgComps.reverse().concat(nonPgComps);
    }

    $scope.updateComps =  function (p_idx, idx) {
        var remote_host = $scope.groupsList[p_idx].hosts[idx].host;
        var status_url = 'hostcmd/status/' + remote_host;

        if (remote_host == "localhost") {
            status_url = 'status';
            remote_host = "";
        }

        var statusData = bamAjaxCall.getCmdData(status_url);
        statusData.then(function(data) {
                data = $(data).filter(function(i,n){ return n.category == '1' });
                $scope.groupsList[p_idx].hosts[idx].comps = data;
                if ($scope.groupsList[p_idx].hosts[idx].comps.length == 0) {
                    $scope.groupsList[p_idx].hosts[idx].showMsg = true;
                } else {
                    $scope.groupsList[p_idx].hosts[idx].showMsg = false;
                }
            });
    }

    $scope.getGraphValues = function (remote_host) {
        if (remote_host == "localhost" || remote_host == "") {
            var infoData = bamAjaxCall.getCmdData('top');
        } else {
            var infoData = bamAjaxCall.getCmdData('hostcmd/top/' + remote_host);
        }
        if (previousTopData == "") {
            var timeVal = new Date(Date.now());
            $scope.cpuData[0].values.push({x: timeVal, y: 0});
            $scope.cpuData[1].values.push({x: timeVal, y: 0});

            $scope.diskIO[0].values.push({x: timeVal, y: 0});
            $scope.diskIO[1].values.push({x: timeVal, y: 0});

            $scope.NetworkIO[0].values.push({x: timeVal, y: 0});
            $scope.NetworkIO[1].values.push({x: timeVal, y: 0});
        }
        infoData.then(function (data) {

            if (previousTopData != "") {
                var diff = data[0].current_timestamp - previousTopData.current_timestamp;
                var kb_read_diff = data[0].kb_read - previousTopData.kb_read;
                var kb_write_diff = data[0].kb_write - previousTopData.kb_write;
                var kb_sent_diff = data[0].kb_sent - previousTopData.kb_sent;
                var kb_recv_diff = data[0].kb_recv - previousTopData.kb_recv;

                var read_bytes = Math.round(kb_read_diff / diff);

                var write_bytes = Math.round(kb_write_diff / diff);

                var kb_sent = Math.round(kb_sent_diff / diff);
                var kb_recv = Math.round(kb_recv_diff / diff);

                if ($scope.cpuData[0].values.length > 20) {
                    $scope.cpuData[0].values.shift();
                    $scope.cpuData[1].values.shift();
                    $scope.diskIO[0].values.shift();
                    $scope.diskIO[1].values.shift();
                    $scope.NetworkIO[0].values.shift();
                    $scope.NetworkIO[1].values.shift();
                }

                var timeVal = new Date(data[0].current_timestamp*1000) ;
                var offset = new Date().getTimezoneOffset();
                timeVal.setMinutes(timeVal.getMinutes() - offset);
                if (read_bytes >= 0 ) {
                    $scope.cpuData[0].values.push({x: timeVal, y: parseFloat(data[0].cpu_system)});
                    $scope.cpuData[1].values.push({x: timeVal, y: parseFloat(data[0].cpu_user)});

                    $scope.diskIO[0].values.push({x: timeVal, y: read_bytes});
                    $scope.diskIO[1].values.push({x: timeVal, y: write_bytes});

                    $scope.NetworkIO[0].values.push({x: timeVal, y: kb_sent});
                    $scope.NetworkIO[1].values.push({x: timeVal, y: kb_recv});
                }
            }
            previousTopData = data[0];
        });

    }

    function clear() {
        previousTopData = '';
        $scope.cpuData[0].values.splice(0, $scope.cpuData[0].values.length);
        $scope.cpuData[1].values.splice(0, $scope.cpuData[1].values.length);
        
        $scope.NetworkIO[0].values.splice(0, $scope.NetworkIO[0].values.length);
        $scope.NetworkIO[1].values.splice(0, $scope.NetworkIO[1].values.length);
        
        $scope.diskIO[0].values.splice(0, $scope.diskIO[0].values.length);
        $scope.diskIO[1].values.splice(0, $scope.diskIO[1].values.length);
    }

    // $scope.loadGroup = function (index) {

        // if ($scope.groupsList[index]['state'] == undefined || $scope.groupsList[index]['state'] == false) {
        //     $scope.groupsList[index]['state'] = true;
        // } else{
        //     $scope.groupsList[index]['state'] = false;
        // }
    // }

    $scope.loadHost = function (p_idx, idx, refresh) {
        // if ($scope.groupsList[p_idx].hosts[idx]['state'] == undefined || $scope.groupsList[p_idx].hosts[idx]['state'] == false) {
        //     $scope.groupsList[p_idx].hosts[idx]['state'] = true;
        // } else{
        //     $scope.groupsList[p_idx].hosts[idx]['state'] = false;   
        // }
        $interval.cancel(stopPGCall);
        $interval.cancel(stopStatusCall);
        $scope.openedHostIndex = idx;
        $scope.openedGroupIndex = p_idx;
        $scope.hostsList = $scope.groupsList[p_idx].hosts;
        previousTopData = '';
        $scope.hostsList[idx].comps = '';
        $scope.hostStatus = true;
        $scope.retry = false;
        var isOpened = false;
        if (typeof $scope.hostsList[idx].open == "undefined") {
            isOpened = true;

        } else if ($scope.hostsList[idx].open) {
            isOpened = false;

        } else {
            isOpened = true;
        }
        if (refresh) {
            isOpened = refresh;
        }
        if($scope.cpuData[0].values.length > 0){
            clear();
        }

        if (isOpened) {
            var remote_host = $scope.hostsList[idx].host;
            var status_url = 'hostcmd/status/' + remote_host;


            if (remote_host == "localhost") {
                status_url = 'status';
                remote_host = "";
            }

            var statusData = bamAjaxCall.getCmdData(status_url);
            statusData.then(function(data) {
                $scope.hostStatus = false;
                data = $(data).filter(function(i,n){ return n.category == '1' });
                    if(data.length <= 0){
                        $scope.groupsList[p_idx].hosts[idx].comps = data;
                        $scope.groupsList[p_idx].hosts[idx].showMsg = true;
                    }else if(data == "error" || data[0].state == 'error' && $scope.hostsList[idx].state == true){
                        $interval.cancel(stopPGCall);
                        stopPGCall = $interval(function (argument) {
                            $scope.loadHost(p_idx, idx, true);
                        } , 3000);
                        $scope.retry = true;
                    }else{
                        $scope.groupsList[p_idx].hosts[idx].comps = data;
                        $scope.groupsList[p_idx].hosts[idx].showMsg = false;
                    }
                });
            $interval.cancel(stopStatusCall);

            var timeVal = new Date(Date.now());
            $scope.cpuData[0].values.push({x: timeVal, y: 0});
            $scope.cpuData[1].values.push({x: timeVal, y: 0});

            $scope.diskIO[0].values.push({x: timeVal, y: 0});
            $scope.diskIO[1].values.push({x: timeVal, y: 0});

            $scope.NetworkIO[0].values.push({x: timeVal, y: 0});
            $scope.NetworkIO[1].values.push({x: timeVal, y: 0});

            stopStatusCall = $interval(function (){
                if ($scope.groupsList[p_idx].hosts[idx].comps) {
                    $scope.updateComps(p_idx, idx);
                    $scope.getGraphValues(remote_host);
                }
            }, 5000);
        }
    };

    $scope.UpdateManager = function (idx) {
        var remote_host = $scope.hostsList[idx].host;
        if (remote_host == "localhost") {
            remote_host = "";
        }
        $cookies.put('remote_host', remote_host);
        $rootScope.remote_host = remote_host;
        $location.path('/components/view');


    };

    $scope.openInitPopup = function (comp) {
        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/pgInitialize.html',
            controller: 'pgInitializeController',
        });
        modalInstance.component = comp;
        modalInstance.dataDir = '';
        modalInstance.autoStartButton = true;
        modalInstance.host = $scope.hostsList[$scope.openedHostIndex].host;
    };

    $scope.changeHost = function (host) {
        $cookies.put('remote_host', host);
    }

    $scope.deleteHost = function (idx) {
        $interval.cancel(stopStatusCall);
        var hostToDelete = $scope.hostsList[idx].host;
        if($cookies.get('remote_host') == hostToDelete){
            $cookies.put('remote_host', 'localhost');
        }
        session.call('com.bigsql.deleteHost', [hostToDelete]);
        session.subscribe("com.bigsql.onDeleteHost", function (data) {
            getGroupsList(false);
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });
    }

    $scope.stopServerCall = function (argument) {
        $interval.cancel(stopStatusCall);
    }

    $scope.startServerCall = function (p_idx, idx) {
        var remote_host = $scope.hostsList[idx].host;
        if (remote_host == "localhost") {
            remote_host = "";
        }
        stopStatusCall = $interval(function (){
            if ($scope.groupsList[p_idx].hosts[idx].comps) {
                $scope.updateComps(p_idx, idx);
                $scope.getGraphValues(remote_host);
            }
        }, 5000);
    }

    $scope.deleteGroup = function (idx){
        $interval.cancel(stopStatusCall);
        var groupToDelete = $scope.groupsList[idx].group;
        session.call('com.bigsql.deleteGroup', [groupToDelete]);
        session.subscribe("com.bigsql.onDeleteGroup", function (data) {
            getGroupsList(false);
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });
    }

    function hostsInfo(){
        $scope.hostsInfoData = [];
        for (var i = $scope.hostsList.length - 1; i >= 0; i--) {
            $scope.loadHostsInfo(i);
        }
    }

    $rootScope.$on('showAddedHost', function (argument) {
        $scope.loadHost(0, $scope.groupsList[0].hosts.length - 1 , true);
    });

    function getGroupsList(checkStorage) {
        $http.get($window.location.origin + '/api/groups')
            .success(function (data) {
                var storageData;
                try{
                    storageData = JSON.parse(localStorage.getItem('groupsListCookie'));
                }catch(err){
                    storageData = '';
                }
                if(storageData && checkStorage && data.length == storageData.length && data[0].hosts.length == storageData[0].hosts.length){
                    $scope.groupsList = storageData;
                    for (var i = $scope.groupsList.length - 1; i >= 0; i--) {
                        if ($scope.groupsList[i].state == true) {
                            for (var j = $scope.groupsList[i].hosts.length - 1; j >= 0; j--) {
                                if($scope.groupsList[i].hosts[j].state == true){
                                    $scope.loadHost(i, j, false);
                                }
                            }
                        };
                    }   
                } else{
                    localStorage.clear();
                    $scope.groupsList = data;
                    for (var i = $scope.groupsList.length - 1; i >= 0; i--) {
                        $scope.groupsList[i].state = true;
                    } 
                    if($scope.addedNewHost){
                        var hostNumber = $scope.groupsList[0].hosts.length - 1;
                        $scope.loadHost(0, hostNumber, false);
                        $scope.groupsList[0].hosts[hostNumber]['state'] = true;
                    }else{
                        $scope.loadHost(0, 0, false);  
                        $scope.groupsList[0].hosts[0]['state'] = true;                      
                    }
                }
                $rootScope.$emit('hideUpdates');
                $scope.nothingInstalled = false;
                $scope.loading = false;
            }).error(function (error) {
                $timeout(wait, 5000);
                $scope.loading = false;
                $scope.retry = true;
            });
    };

    getGroupsList(true);

    $rootScope.$on('addedHost', function () {
        getGroupsList(false);
        $scope.addedNewHost = true;
    });

    $scope.action = function ( event, host) {
        var showingSpinnerEvents = ['Initialize', 'Start', 'Stop', 'Restart'];
        if(showingSpinnerEvents.indexOf(event.target.innerText) >= 0 ){
            currentComponent = getCurrentComponent( event.currentTarget.getAttribute('value'), host);
            currentComponent.showingSpinner = true;
        }
        if (event.target.tagName == "A") {
            if(host == 'localhost'){
                if(event.target.innerText.toLowerCase() != 'initialize'){
                    session.call(apis[event.target.innerText], [event.currentTarget.getAttribute('value')]); 
                }
            }else{
                if(event.target.innerText.toLowerCase() != 'initialize'){
                    session.call(apis[event.target.innerText], [event.currentTarget.getAttribute('value'), host]);
                }
                // var event_url = cmd + '/' + event.currentTarget.getAttribute('value') + '/' + host;
                // var eventData = bamAjaxCall.getCmdData(event_url);
            }
        }
        ;
    };

    $scope.installedComps = function (event) {
        session.call('com.bigsql.setBamConfig', ['showInstalled', $scope.showInstalled]);
    };


    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $timeout(function () {
        if ($scope.loading) {
            $window.location.reload();
        }
        ;
    }, 5000);

    function wait() {
        $window.location.reload();
    };

    $scope.open = function (p_idx, idx) {
            if ($scope.betaFeature) {
                $scope.editHost = '';
                if(idx >= 0){
                    $scope.editHost = $scope.groupsList[p_idx].hosts[idx];
                }

                var modalInstance = $uibModal.open({
                    templateUrl: '../app/components/partials/addHostModal.html',
                    windowClass: 'modal',
                    controller: 'addHostController',
                    scope: $scope,
                });
            }else{
                $scope.alerts.push({
                    type: 'warning'
                });
            }
        };

    $scope.openGroupsModal = function (idx) {
            if($scope.betaFeature){
                var modalInstance = $uibModal.open({
                    templateUrl: '../app/components/partials/addServerGroupsModal.html',
                    windowClass: 'modal',
                    controller: 'addServerGroupsController',
                    scope: $scope,
                });
                $scope.editGroup = '';
                if(idx){
                    $scope.editGroup = $scope.groupsList[idx];
                    for (var i = $scope.groupsList.length - 1; i >= 0; i--) {
                        if($scope.groupsList[i].group == $scope.editGroup.group){
                            modalInstance.groupServers = $scope.groupsList[i].hosts;
                        }
                    }
                }
            }else{
                $scope.alerts.push({
                    type: 'warning'
                });
            }
        };

    $scope.showTop = function (idx) {
        var remote_host = $scope.hostsList[idx].host;
        if (remote_host == "localhost") {
            remote_host = "";
        }

        $scope.top_host = remote_host;
        $scope.host_info = $scope.hostsList[idx].hostInfo;


        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/topModal.html',
            windowClass: 'modal',
            size: 'lg',
            controller: 'topController',
            scope : $scope
        });
    };

    $scope.openDetailsModal = function (comp) {
        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/details.html',
            // windowClass: 'comp-details-modal',
            size: 'lg',
            controller: 'ComponentDetailsController',
            keyboard  : false,
            backdrop  : 'static',
        });
        modalInstance.component = comp;
        modalInstance.isExtension = true;
    };

    $scope.openGraphModal = function (chartName) {
        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/hostGraphModal.html',
            windowClass: 'modal',
            size: 'lg',
            controller: 'hostGraphModalController',
            scope : $scope
        });
        if(chartName == 'CPU Load'){
            modalInstance.data = $scope.cpuData;
            modalInstance.chart = angular.copy($scope.cpuChart);
        } else if(chartName == 'Disk IO'){
            modalInstance.data = $scope.diskIO;
            modalInstance.chart = angular.copy($scope.ioChart);
        } else {
            modalInstance.data = $scope.NetworkIO;
            modalInstance.chart = angular.copy($scope.networkChart);
        }
        modalInstance.chartName = chartName;
        modalInstance.hostName = $scope.hostsList[$scope.openedHostIndex].host;
    }

    $rootScope.$on('updateGroups', function (argument) {
        getGroupsList();
    })
    
    // Handle page visibility change events
    function handleVisibilityChange() {
        if (document.visibilityState == "hidden") {
            $interval.cancel(stopStatusCall);
            clear();
        } else if (document.visibilityState == "visible") {
            clear();
            $scope.loadHost($scope.openedGroupIndex, $scope.openedHostIndex, true);
        }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange, false);

    //need to destroy all the subscriptions on a template before exiting it
    $scope.$on('$destroy', function () {
        localStorage.clear();
        localStorage.setItem('groupsListCookie', JSON.stringify($scope.groupsList));
        $interval.cancel(stopStatusCall);
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i])
        }
    });
}]);


angular.module('bigSQL.components').controller('addHostController', ['$scope', '$uibModalInstance', 'PubSubService', '$rootScope', '$uibModal', 'bamAjaxCall', function ($scope, $uibModalInstance, PubSubService, $rootScope, $uibModal, bamAjaxCall) {

    var session;
	var sessPromise = PubSubService.getSession();
	var subscriptions = [];
	$scope.tryToConnect = false;
	$scope.connectionStatus = false;
	$scope.installingStatus = false;
	$scope.registerResponse;
	$scope.type = 'Add';

	$scope.hostName = '';
	$scope.pgcDir = '';
	$scope.userName = '';

	if($scope.editHost){
		$scope.type = 'Edit';
		$scope.hostName = $scope.editHost.host;
		$scope.pgcDir = $scope.editHost.pgc_home;
		$scope.userName = $scope.editHost.user;
		$scope.connectionName = $scope.editHost.name;
	}

	$scope.firstPhase = true;
	$scope.secondPhase = false;

	$scope.refreshHostManager = function (argument) {
		$rootScope.$emit('addedHost');
	}

    sessPromise.then(function (sessParam) {
        session = sessParam;
        $scope.addHost = function () {
        	$scope.connectionError = false;
        	$scope.registerResponse = '';
	        session.call('com.bigsql.registerHost',[$scope.hostName, $scope.pgcDir, $scope.userName, $scope.password, $scope.connectionName]);
	    	$scope.tryToConnect = true;
	    	
	    	session.subscribe("com.bigsql.onRegisterHost", function (data) {
	    		$scope.registerResponse = data[0];
	    		
	    		var jsonData =  JSON.parse(data[0]);
	    		if(jsonData[0].state == 'completed'){
	    			// $rootScope.$emit('addedHost'); 
	    			// $uibModalInstance.dismiss('cancel');
	    			var listData = bamAjaxCall.getCmdData('hostcmd/list/'+$scope.hostName);
	    			listData.then(function(data) {
	    				$scope.tryToConnect = false;
	    				$scope.connectionStatus = false;
	    				var comps = $(data).filter(function(i,n){ return n.category == 1 });
	    				$scope.availablePgComps = [];
	    				for (var i = comps.length - 1; i >= 0; i--) {
	    					$scope.availablePgComps.push(comps[i]);
	    				}
	    				// $scope.availablePgComps = pgComps;
	    				$scope.selectedPgComp = $scope.availablePgComps[0];
	    				$scope.secondPhase = false;
    					$scope.thirdPhase = true;
	    			})
	    		}else if (jsonData[0].state == 'progress') {
	    			$scope.tryToConnect = false;
	    			$scope.connectionStatus = true;
	    			$scope.message = jsonData[0].msg;
	    		} else if(jsonData[0].state == 'error'){
	    			$scope.tryToConnect = false;
	    			$scope.connectionError = true;
	    			$scope.message = jsonData[0].msg;
	    			// $uibModalInstance.dismiss('cancel');
	    		}
	    		$scope.$apply();
	        }).then(function (subscription) {
	            subscriptions.push(subscription);
	        });
	    }
    });

    $scope.next = function (argument) {
    	if($scope.firstPhase){
    		$scope.tryToConnect = true;
    		$scope.connectionError = false;
    		var checkUser = bamAjaxCall.getCmdData('checkUser/'+ $scope.hostName + '/' + $scope.userName + '/' + $scope.password);
    		checkUser.then(function (argument) {
    			var jsonData = JSON.parse(argument)[0];
    			if (jsonData.state == 'success') {
    				$scope.isSudo =  jsonData.isSudo;
    				if($scope.isSudo){
    					$scope.serviceUser = 'Postgres';
    					$scope.pgcDir = '/opt'
    				}else{
    					$scope.serviceUser = $scope.userName;
    					$scope.pgcDir = '~/bigsql'
    				}
    				$scope.tryToConnect = false;
    				$scope.firstPhase = false;
    				$scope.secondPhase = true;
    			} else{
	    			$scope.connectionError = true;
	    			$scope.tryToConnect = false;
    				$scope.message = jsonData.msg;
    			}
    		})
    	}else if($scope.secondPhase){
    		$scope.secondPhase = false;
    		$scope.thirdPhase = true;
    	}else if($scope.thirdPhase){
    			$scope.installingStatus = true;
    			$scope.thirdPhase = false;
    			var event_url =  'install/' + $scope.selectedPgComp.component + '/' + $scope.hostName ;
	            var eventData = bamAjaxCall.getCmdData(event_url);
	            eventData.then(function(data) {
	            	$scope.installingStatus = false;
	                $uibModalInstance.dismiss('cancel');
			        var modalInstance = $uibModal.open({
			            templateUrl: '../app/components/partials/pgInitialize.html',
			            controller: 'pgInitializeController',
			        });
			        modalInstance.component = $scope.selectedPgComp.component;
			        modalInstance.dataDir = $scope.pgcDir + '/data/' + $scope.selectedPgComp.component;
			        modalInstance.autoStartButton = false;
			        modalInstance.host = $scope.hostName;
			        modalInstance.userName = $scope.userName;
			        modalInstance.password = $scope.password;
	            });
    	}
    }

    $scope.back = function (argument) {
    	if($scope.secondPhase){
    		$scope.secondPhase = false;
    		$scope.firstPhase = true;
    	}else if($scope.thirdPhase){
    		$scope.thirdPhase = false;
    		$scope.secondPhase = true;
    	}
    }

	$scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i]);
        }
    };

}]);
angular.module('bigSQL.components').controller('addServerGroupsController', ['$scope', '$uibModalInstance', 'PubSubService', '$rootScope', '$http', '$window', function ($scope, $uibModalInstance, PubSubService, $rootScope, $http, $window) {

    var session;
	var sessPromise = PubSubService.getSession();
	var subscriptions = [];
	$scope.type = 'Add';
	$scope.CreatingGroup = false;

	$scope.hostName = '';
	$scope.pgcDir = '';
	$scope.userName = '';
	$scope.availableServers = [];
	$scope.groupServers = [];
	if($scope.editGroup){
		$scope.type = 'Edit';
		$scope.name = $scope.editGroup.group;
		$scope.groupId = $scope.editGroup.group_id;
		$scope.groupServers = $uibModalInstance.groupServers;
	}

	$http.get($window.location.origin + '/api/hosts')
	    .success(function (data) {
	    	if($scope.groupServers.length > 0){
	    		for (var i = 0 ; i < data.length; i++) {
	    			for (var j = 0; j < $scope.groupServers.length; j++) {
	    				if($scope.groupServers[j].host_id == data[i].host_id){
	    					data.splice(i, 1);
	    				}
	    			}
	    		}
	    	} 
		    $scope.availableServers = data;	    		
	    	
	    })
	    .error(function (error) {
	        
	    });

	
	$scope.addToGroup = function (argument) {
		for (var i = argument.length - 1; i >= 0; i--) {
			var data = JSON.parse(argument[i])
			$scope.availableServers = $scope.availableServers.filter(function(arg) { 
			   return arg.host_id !== data.host_id;  
			});
			$scope.groupServers.push(data);
		}
	}

	$scope.removeFromGroup = function (argument) {
		for (var i = argument.length - 1; i >= 0; i--) {
			var data = JSON.parse(argument[i])
			$scope.groupServers = $scope.groupServers.filter(function(arg) { 
			   return arg.host_id !== data.host_id;  
			});
			$scope.availableServers.push(data);
		}
	}

    sessPromise.then(function (sessParam) {
        session = sessParam;
        session.subscribe('com.bigsql.onRegisterServerGroup', function (data) {
		    	var jsonData = JSON.parse(data[0][0]);
		    	if(jsonData[0].state == "completed"){
		    		$scope.message = jsonData[0].msg;
		    		$scope.$apply();
		    		$uibModalInstance.dismiss('cancel');
		    		$rootScope.$emit('updateGroups');
		    	}
		    }).then(function (data) {
		    })
    });

    

    $scope.addServerGroup = function(argument) {
		$scope.CreatingGroup = true;
		var hosts_id = [];
		$scope.message = "Creating Group...";
		for (var i =0; i < $scope.groupServers.length ; i++) {
			hosts_id.push(parseInt($scope.groupServers[i].host_id));
		}
		session.call('com.bigsql.registerServerGroup',[argument, hosts_id]);
	}

	$scope.updateServerGroup = function(argument) {
		$scope.updatingGroup = true;
		var hosts_id = [];
		$scope.message = "Updating Group...";
		for (var i =0; i < $scope.groupServers.length ; i++) {
			hosts_id.push(parseInt($scope.groupServers[i].host_id));
		}
		session.call('com.bigsql.updateServerGroup',[argument, hosts_id, $scope.groupId]);
		$uibModalInstance.dismiss('cancel');
		$rootScope.$emit('updateGroups');
	}

	$scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i]);
        }
    };

}]);
angular.module('bigSQL.components').controller('badgerController', ['$scope', '$uibModal', 'PubSubService', '$state', 'UpdateComponentsService', '$filter', '$rootScope', '$timeout', '$window', '$http', '$location', 'bamAjaxCall', function ($scope, $uibModal, PubSubService, $state, UpdateComponentsService, $filter, $rootScope, $timeout, $window, $http, $location, bamAjaxCall) {

    $scope.alerts = [];
    $scope.checkedFirst = false;

    var subscriptions = [];
    $scope.components = {};
    $scope.disableLog = true;
    $scope.generatingReportSpinner = false;
    $scope.autoSelectLogFile;
    $scope.selectedCurrentLogfile;
    $scope.refreshMsg= false;
    $scope.checked = false;

    var session;
    $scope.updateSettings;
    $scope.loading = true;
    $scope.retry = false;
    $scope.disableShowInstalled = false;
    $scope.badgerInstalled = false;
    $scope.disableGenrate = false;

    $rootScope.$on('sessionCreated', function () {
        var sessPromise = PubSubService.getSession();
        sessPromise.then(function (sessParam) {
            session = sessParam;
        });
    });

    $rootScope.$on('refreshPage',function (argument) {
        $window.location.reload();
    } );

    var serverStatus = bamAjaxCall.getCmdData('status');
        serverStatus.then(function (data) {
            var noPostgresRunning = false;
            for (var i = data.length - 1; i >= 0; i--) {
                if (data[i].state == "Running") {
                    noPostgresRunning = true;
                }
            }
            if(!noPostgresRunning){
                $scope.disableGenrate = true;
                $scope.alerts.push({
                    msg:  "No Postgres component Installed/ Initialized.",
                    type: 'danger',
                    pgComp: true
                });
            }else{
                var compStatus = bamAjaxCall.getCmdData('status/pgbadger');
                compStatus.then(function (data) {
                    if (data.state == "Installed") {
                        $scope.badgerInstalled = true;
                    }else{
                        $scope.disableGenrate = true;
                        $scope.alerts.push({
                            msg:  'pgBadger is not Installed. ',
                            type: 'danger',
                            pgComp: false
                        });
                    }
                });
            }
        });    

    $scope.logFileChecked = function () {
        $scope.selectedLog = false;
        angular.forEach($scope.logfiles, function (item) {
            if(item.selected){
                $scope.selectedLog = true;
            }
        });
    }

    $scope.onSelectChange = function (comp) {
        if(comp){
            session.call('com.bigsql.get_log_files_list', [comp]);
            session.call('com.bigsql.infoComponent', [comp]);
            session.subscribe('com.bigsql.onInfoComponent', function (args) {
                $scope.logDir = JSON.parse(args[0][0])[0].logdir;
                $scope.$apply();
            });
            localStorage.setItem('selectedDB', comp);  
        }else{
            $scope.disableLog = true;
            $scope.logfiles = [];
            $scope.logDir = '';
            localStorage.setItem('selectedDB', '');
        }
        
    };

    function getReports(argument) {

        var infoData = bamAjaxCall.getCmdData('getrecentreports/badger');
        infoData.then(function (data) {
            var files_list = data.data;
            if(files_list.length == 0){
                $scope.showReports = false;
            }else{
                $scope.files_list=files_list; 
                $scope.showReports = true; 
                for (var i = $scope.files_list.length - 1; i >= 0; i--) {
                    $scope.files_list[i].selected = false;
                }              
            }
        });

    }

    getReports();

    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
        session = val;
        
        session.call('com.bigsql.checkLogdir');

        session.subscribe("com.bigsql.onCheckLogdir", function (components) {
            $scope.components = JSON.parse(components[0]);
            var selectedDB = localStorage.getItem('selectedDB');
            if($scope.components.length == 1){
                $scope.selectComp = $scope.components[0].component;
                $scope.onSelectChange($scope.selectComp);
            }else if (selectedDB) {
                $scope.selectComp = selectedDB;
                $scope.onSelectChange(selectedDB);
            }
            $scope.$apply();
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        session.subscribe("com.bigsql.log_files_list", function (data) {
            $scope.logfiles = JSON.parse(data[0]);
            $scope.disableLog = false;
            for (var i = 0; i <= $scope.logfiles.length; i++) {
                $scope.logfiles[i]['selected'] = false;
                if(i==0){
                    $scope.logfiles[i]['selected'] = true;
                    $scope.selectedLog = true;  
                }
            }
            $scope.apply();

        });
    });

    $scope.openLoggingParam = function (argument) {
        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/loggingParam.html',
            controller: 'loggingParamController',
            windowClass: 'app-modal-window'
        });
        modalInstance.comp=$scope.selectComp;
    };

    $scope.openSwitchlog = function (argument) {
        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/switchLogfile.html',
            controller: 'switchLogfileController',
            windowClass: 'switch-modal-window'
        });
        modalInstance.comp=$scope.selectComp;
        modalInstance.currentLogfile = $scope.logfiles[0].file;
    };


    $scope.openGenerateModal = function (argument) {
        $scope.report_file = "";
        $scope.report_url = "";
        var selectedFiles = [];
        var totalSize = 0;
        var smallFiles = [];
        var selectLog = document.getElementsByName("selectLog");
        for (var i=0;i<selectLog.length; i++){
            if(selectLog[i].checked){
                var units = selectLog[i].value.split('; ')[1].split(' ')[1];
                totalSize += parseInt(selectLog[i].value.split('; ')[1].split(' ')[0]);
                if (units == 'B' || (units == 'KB' && totalSize<=2)) {
                    smallFiles.push(selectLog[i].value.split('; ')[0])
                } 
                selectedFiles.push(selectLog[i].value.split('; ')[0]);
            }
        }
        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/generateBadgerReport.html',
            controller: 'generateBadgerReportController',
            windowClass: 'switch-modal-window',
            backdrop  : 'static',
            keyboard  : false
        });
        modalInstance.selectedFiles = selectedFiles;
        modalInstance.pgTitle = $scope.pgTitle;
        modalInstance.pgDB = $scope.pgDB;
        modalInstance.pgJobs = $scope.pgJobs;
        modalInstance.pgLogPrefix = $scope.pgLogPrefix;
        modalInstance.smallFiles = smallFiles;
    };

    $scope.toggleAll = function() { 
        if($scope.isAllSelected){
            $scope.isAllSelected = false;
        }else{
            $scope.isAllSelected = true;
        }
        angular.forEach($scope.files_list, function(itm){ itm.selected = $scope.isAllSelected; });
    }
      
    $scope.optionToggled = function(){
        $scope.checked = false;
        angular.forEach($scope.files_list, function (item) {
            if(item.selected){
                $scope.checked = true;
            }
        });
    }

    $scope.deleteReports = function (files, selectAll) {
        var deleteFiles = [];
        if(selectAll){
            for (var i = files.length - 1; i >= 0; i--) {
                deleteFiles.push(files[i].file);
            }
        }else{
            for (var i = files.length - 1; i >= 0; i--) {
                if(files[i].selected){
                    deleteFiles.push(files[i].file);
                }
            }            
        }
        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/confirmDeletionModal.html',
            controller: 'confirmDeletionModalController',
        });
        modalInstance.deleteFiles = deleteFiles;
        modalInstance.comp = 'pgbadger';
    }

    $rootScope.$on('updateReports', function (argument) {
        getReports();
    })

    $scope.refreshLogfiles = function (comp) {
        $scope.refreshMsg = true;
        $timeout(function() {
            session.call('com.bigsql.get_log_files_list', [comp]);
            $scope.refreshMsg = false;
        }, 1000);
    }

    $rootScope.$on('switchLogfile', function (argument, fileName, comp) {
        $scope.autoSelectLogFile = fileName;
        session.call('com.bigsql.get_log_files_list', [comp]);
    });

    $rootScope.$on('updateReports', function (argument) {
        getReports();
    })

    $rootScope.$on('switchLogfileError', function (argument, error) {
        $scope.badgerError = error.status;
    });

    $scope.openDetailsModal = function (comp) {
        $scope.alerts.splice(0, 1);
        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/details.html',
            // windowClass: 'comp-details-modal',
            size : 'lg',
            controller: 'ComponentDetailsController',
            keyboard  : false,
            backdrop  : 'static',
        });
        modalInstance.component = 'pgbadger';
        modalInstance.isExtension = true;
    };

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    //need to destroy all the subscriptions on a template before exiting it
    $scope.$on('$destroy', function () {
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i])
        }
    });
}]);


angular.module('bigSQL.components').controller('confirmDeletionModalController', ['$scope','$rootScope', '$uibModalInstance','MachineInfo', 'PubSubService', '$window', '$http', function ($scope, $rootScope, $uibModalInstance, MachineInfo, PubSubService, $window, $http) {

	var session;

    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
    	session = val;
    });

    var deleteFiles = $uibModalInstance.deleteFiles;
    $scope.comp = $uibModalInstance.comp;

    $scope.removeReports = function (argument) {
        if($scope.comp == 'pgbadger'){
            var removeFiles = $http.post($window.location.origin + '/api/remove_reports/badger', deleteFiles);
            removeFiles.then(function (data) {
                if(data.data.error == 0){
                    $rootScope.$emit("updateReports");
                    $uibModalInstance.dismiss('cancel');
                }
            });    
        }else{
            var removeFiles = $http.post($window.location.origin + '/api/remove_reports/profiler', deleteFiles);
            removeFiles.then(function (data) {
                if(data.data.error == 0){
                    $rootScope.$emit('refreshPage');
                    $uibModalInstance.dismiss('cancel');
                }
            });
        }
    }

    $scope.deleteFilesLength = deleteFiles.length;

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

}]);
angular.module('bigSQL.components').controller('generateBadgerReportController', ['$scope','$rootScope', '$uibModalInstance', 'PubSubService', 'bamAjaxCall', '$sce', function ($scope, $rootScope, $uibModalInstance, PubSubService, bamAjaxCall, $sce) {

	var session;

    var subscriptions = [];
    var sessionPromise = PubSubService.getSession();

    sessionPromise.then(function (val) {
    	session = val;

        session.subscribe("com.bigsql.badgerReports", function (data) {
            var result = data[0];
            $scope.generatingReportSpinner = false;
            if (result.error == 0) {
                $scope.report_file = result.report_file;
                $scope.report_url = "/reports/" + result.report_file;
            } else {
                $scope.badgerError = result.msg;
                $scope.generatingReportSpinner = false;
            }
            $scope.$apply();

        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        if($uibModalInstance.smallFiles.length > 0){
            $scope.badgerError = $uibModalInstance.smallFiles + '. There is insufficient number of entries in the file(s) to deduce line format.'
        }else if ($uibModalInstance.selectedFiles.length > 0) {
            $scope.generatingReportSpinner = true;
            session.call('com.bigsql.pgbadger', [
                $uibModalInstance.selectedFiles, $uibModalInstance.pgDB,
                $uibModalInstance.pgJobs, $uibModalInstance.pgLogPrefix,
                $uibModalInstance.pgTitle
            ]);
        }
    });

    $scope.cancel = function () {
        $rootScope.$emit('updateReports');
        $uibModalInstance.dismiss('cancel');
    };

    //need to destroy all the subscriptions on a template before exiting it
    $scope.$on('$destroy', function () {
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i])
        }
    });


    
}]);
angular.module('bigSQL.components').controller('globalProfilingController', ['$scope','$rootScope', '$uibModalInstance','MachineInfo', 'PubSubService', '$window', '$location', function ($scope, $rootScope, $uibModalInstance, MachineInfo, PubSubService, $window, $location) {

	var session;
    $scope.alerts = [];
    $scope.hostName = $uibModalInstance.hostName;
    $scope.pgUser = $uibModalInstance.pgUser;
    $scope.pgPass = $uibModalInstance.pgPass;
    $scope.pgDB = $uibModalInstance.pgDB;
    $scope.pgPort = $uibModalInstance.pgPort;
    $scope.enableProfiler = false;
    $scope.comp = $uibModalInstance.comp;

    $scope.showResult = false;
    $scope.showStatus =  true;
    var subscriptions = [];
    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
    	session = val;

        session.call('com.bigsql.plprofiler', [
            $scope.hostName, $scope.pgUser,
            $scope.pgPort, $scope.pgDB,
            $scope.pgPass, $scope.pgQuery,
            $scope.pgTitle, $scope.pgDesc,
            "check", $scope.comp
        ]);

        session.subscribe("com.bigsql.profilerReports", function (data) {

            $scope.generatingReportSpinner=false;
            if(data[0].action == 'check'){
                $scope.status = data[0];
            } else{
                $scope.result=data[0];
            }
            $scope.showResult = true;
            
            var result=data[0];
            if (result.error != 0 && result.action =="generate") {
                $scope.alerts.push({
                            msg:  result.msg,
                            type: 'danger',
                        });
                $scope.showResult = false;
            }else if (result.error == 0 && result.action =="generate"){
                $uibModalInstance.dismiss('cancel');   
            }

            $scope.$apply();

        }).then(function (sub) {
            subscriptions.push(sub);
        });

    });

    $scope.enableProfiler = function (argument) {
        $scope.showStatus = false;
    	session.call('com.bigsql.plprofiler', [
            $scope.hostName, $scope.pgUser,
            $scope.pgPort, $scope.pgDB,
            $scope.pgPass, $scope.pgQuery,
            $scope.pgTitle, $scope.pgDesc,
            "enable", $scope.comp

        ]).then(function (argument) {
            session.call('com.bigsql.plprofiler', [
                $scope.hostName, $scope.pgUser,
                $scope.pgPort, $scope.pgDB,
                $scope.pgPass, $scope.pgQuery,
                $scope.pgTitle, $scope.pgDesc,
                "check", $scope.comp
            ]);
        }) ;
    };



    $scope.disableProfiler = function (argument) {
        $scope.showStatus = false;
    	session.call('com.bigsql.plprofiler', [
            $scope.hostName, $scope.pgUser,
            $scope.pgPort, $scope.pgDB,
            $scope.pgPass, $scope.pgQuery,
            $scope.pgTitle, $scope.pgDesc,
            "disable", $scope.comp

        ]).then(function (argument) {
            session.call('com.bigsql.plprofiler', [
                $scope.hostName, $scope.pgUser,
                $scope.pgPort, $scope.pgDB,
                $scope.pgPass, $scope.pgQuery,
                $scope.pgTitle, $scope.pgDesc,
                "check", $scope.comp
            ]);
        });
    };

    $scope.resetProfiler = function (argument) {
    	session.call('com.bigsql.plprofiler', [
            $scope.hostName, $scope.pgUser,
            $scope.pgPort, $scope.pgDB,
            $scope.pgPass, $scope.pgQuery,
            $scope.pgTitle, $scope.pgDesc,
            "reset", $scope.comp
        ]);
    };

    $scope.generateReport = function (argument) {
    	session.call('com.bigsql.plprofiler', [
            $scope.hostName, $scope.pgUser,
            $scope.pgPort, $scope.pgDB,
            $scope.pgPass, $scope.pgQuery,
            $scope.pgTitle, $scope.pgDesc,
            "generate", $scope.comp
        ]).then(function (sub) {
            // $uibModalInstance.dismiss('cancel');
        });
    };


    $scope.cancel = function () {
        $rootScope.$emit('refreshPage');
        $uibModalInstance.dismiss('cancel');
    };

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    //need to destroy all the subscriptions on a template before exiting it
    $scope.$on('$destroy', function () {
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i])
        }
    });

}]);
angular.module('bigSQL.components').controller('graphsTabController', ['$scope', '$stateParams', 'PubSubService', '$rootScope', '$interval','MachineInfo', function ($scope, $stateParams, PubSubService, $rootScope, $interval, MachineInfo) {
	var session, subscriptions=[], componentStatus, refreshRate;
    $scope.showGraphs = false;

    $scope.transctionsPerSecondChart = {
        chart: {
            type: 'lineChart',
            height: 150,
            margin : {
                top: 20,
                right: 40,
                bottom: 40,
                left: 55
            },
            x: function(d){ return d.x; },
            y: function(d){ return d.y; },
            noData:"Loading...",
            interactiveLayer : {
                tooltip: {
                    headerFormatter: function (d) { 
                        var point = new Date(d);
                        return d3.time.format('%Y/%m/%d %H:%M:%S')(point); 
                    },
                },
            },

            xAxis: {
                xScale: d3.time.scale(),
                    tickFormat: function(d) { 
                        var point = new Date(d);
                        return d3.time.format('%H:%M:%S')(point) 
                    },
                },
            yAxis: {
                tickFormat: function(d) { 
                    return d3.format(',')(d);
                }
            },
            forceY: [0,5],
            useInteractiveGuideline: true,
            legend: { margin : {
                top: 10, right: 0, left: 0, bottom: 0
            }}
        }
    };


    $scope.cpuChart = angular.copy($scope.transctionsPerSecondChart);
    $scope.cpuChart.chart['forceY'] = [0,100];
    $scope.cpuChart.chart.type = "stackedAreaChart";
    $scope.cpuChart.chart.showControls = false;

    $scope.rowsChart = angular.copy($scope.transctionsPerSecondChart);
    $scope.rowsChart.chart['forceY'] = [0,1000];

    $scope.connectionsChart = angular.copy($scope.transctionsPerSecondChart);
    $scope.connectionsChart.chart.type = "stackedAreaChart";
    $scope.connectionsChart.chart.showControls = false;

    $scope.diskIOChart = angular.copy($scope.transctionsPerSecondChart);
    $scope.transctionsPerSecondChart.chart['forceY'] = [0,50];

    $scope.commitRollbackData = [
        {
            values: [],
            key: 'Commit',
            color: '#FF5733'
        },
        {
            values: [],      
            key: 'Rollback', 
            color: '#006994'  
        }];

    $scope.cpuData = [{
            values: [],      
            key: 'CPU System %', 
            color: '#FF5733',
        },
        {
            values: [],      
            key: 'CPU User %', 
            color: '#006994' ,
        }];

    $scope.diskIOData = [{
        values: [],
        key: 'Read Bytes (MB)',
        color: '#FF5733'
    },{
        values: [],
        key: 'Write Bytes (MB)',
        color: '#006994'
    }];

    $scope.rowsData = [{
        values: [],
        key: 'Insert',
        color: '#006400'
    },{
        values: [],
        key: 'Update',
        color: '#FF5733'
    },{
        values: [],
        key: 'Delete',
        color: '#006994'
    },{
        values: [],
        key: 'Select',
        color: '#9932CC'
    }]

    $scope.connectionsData = [{
            values: [],      
            key: 'Active', 
            color: '#FF5733',
        },{
            values: [],
            key: 'Idle',
            color: '#006994',
        },{
            values: [],
            key: 'Idle Transactions',
            color: '#9932CC',
        }];

    function clear() {
        $scope.rowsData[0].values.splice(0, $scope.rowsData[0].values.length);
        $scope.rowsData[1].values.splice(0, $scope.rowsData[1].values.length);
        $scope.rowsData[2].values.splice(0, $scope.rowsData[2].values.length);
        $scope.rowsData[3].values.splice(0, $scope.rowsData[3].values.length);


        $scope.commitRollbackData[0].values.splice(0, $scope.commitRollbackData[0].values.length);
        $scope.commitRollbackData[1].values.splice(0, $scope.commitRollbackData[1].values.length);


        $scope.connectionsData[0].values.splice(0, $scope.connectionsData[0].values.length);
        $scope.connectionsData[1].values.splice(0, $scope.connectionsData[1].values.length);
        $scope.connectionsData[2].values.splice(0, $scope.connectionsData[2].values.length);

        $scope.cpuData[0].values.splice(0, $scope.cpuData[0].values.length);
        $scope.cpuData[1].values.splice(0, $scope.cpuData[1].values.length);

        $scope.diskIOData[0].values.splice(0, $scope.diskIOData[0].values.length);
        $scope.diskIOData[1].values.splice(0, $scope.diskIOData[1].values.length);
    }

    $rootScope.$on('sessionCreated', function () {
        var sessPromise = PubSubService.getSession();
        sessPromise.then(function (sessParam) {
            session = sessParam;
            $rootScope.$emit('topMenuEvent');
        });
    });

    $rootScope.$on('componentStatus', function (argument) {
    	componentStatus = arguments[1];
    })

    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
    	session = val;
    	session.call('com.bigsql.initial_dbstats',[$stateParams.component]);
	    session.call("com.bigsql.initial_graphs");

	    $scope.tabClick = function (argument) {
	        session.call('com.bigsql.live_graphs');
	        session.call('com.bigsql.live_dbstats', [$stateParams.component]);
	    }

	    session.subscribe("com.bigsql.initdbstats", function (data) {
        var graph_data = data[0];
        if(graph_data['component'] == $stateParams.component){
            $scope.commitRollbackData[0].values.length = 0;
            $scope.commitRollbackData[1].values.length = 0;
            $scope.rowsData[0].values.length = 0;
            $scope.rowsData[1].values.length = 0;
            $scope.rowsData[2].values.length = 0;
            $scope.rowsData[3].values.length = 0;
            $scope.connectionsData[0].values.length = 0;
            $scope.connectionsData[1].values.length = 0;
            $scope.connectionsData[2].values.length = 0;
	        for (var i=0;i<graph_data.stats.length;i=i+1){
	            var timeData = Math.round( (new Date( graph_data.stats[i]['time'] + ' UTC')).getTime() );
	            $scope.commitRollbackData[0].values.push({ x: timeData,  y: graph_data.stats[i]['xact_commit']});
	            $scope.commitRollbackData[1].values.push({ x: timeData,  y: graph_data.stats[i]['xact_rollback']});
	            $scope.connectionsData[0].values.push({ x: timeData, y: graph_data.stats[i]['connections']['active']});
                $scope.connectionsData[1].values.push({ x: timeData, y: graph_data.stats[i]['connections']['idle']});
	            $scope.connectionsData[2].values.push({x: timeData, y: graph_data.stats[i]['connections']['idle in transaction']});
                $scope.rowsData[0].values.push({x:timeData, y:graph_data.stats[i]['tup_inserted']});
	            $scope.rowsData[1].values.push({x:timeData, y:graph_data.stats[i]['tup_updated']});
	            $scope.rowsData[2].values.push({x:timeData, y:graph_data.stats[i]['tup_deleted']});
	            $scope.rowsData[3].values.push({x:timeData, y:graph_data.stats[i]['tup_fetched']});
	        }
            $scope.connectionsChart.chart['forceY'] = [0, graph_data.stats[1]['connections']['max']];
	        $scope.$apply();
	    }
	    }).then(function (subscription) {
	        subscriptions.push(subscription);
	    });

	    session.subscribe('com.bigsql.dbstats', function (data) {
	    	if(data[0].component == $stateParams.component){
		        if($scope.commitRollbackData[0].values.length > 60){
		            $scope.commitRollbackData[0].values.shift();
		            $scope.commitRollbackData[1].values.shift();
		            $scope.rowsData[0].values.shift();
		            $scope.rowsData[1].values.shift();
		            $scope.rowsData[2].values.shift();
		            $scope.rowsData[3].values.shift();
                    $scope.connectionsData[0].values.shift();
                    $scope.connectionsData[1].values.shift();
                    $scope.connectionsData[2].values.shift();         
		        }
		        var timeVal = Math.round( (new Date(data[0].stats['time'] + ' UTC')).getTime())
		        $scope.commitRollbackData[0].values.push({ x: timeVal,  y: data[0].stats['xact_commit']});
		        $scope.commitRollbackData[1].values.push({ x: timeVal,  y: data[0].stats['xact_rollback']});
		        $scope.connectionsData[0].values.push({ x: timeVal, y: data[0].stats['connections']['active']});
		        $scope.connectionsData[1].values.push({x: timeVal, y: data[0].stats['connections']['idle']});
                $scope.connectionsData[2].values.push({x : timeVal, y: data[0].stats['connections']['idle in transaction']});
                $scope.rowsData[0].values.push({x: timeVal, y: data[0].stats['tup_inserted']});
		        $scope.rowsData[1].values.push({x: timeVal, y: data[0].stats['tup_updated']});
		        $scope.rowsData[2].values.push({x: timeVal, y: data[0].stats['tup_deleted']});
		        $scope.rowsData[3].values.push({x: timeVal, y: data[0].stats['tup_fetched']});
                $scope.$apply();
	    	}

	    });


	    function callStatus(argument) {
		    session.call('com.bigsql.live_graphs');
	        if($scope.commitRollbackData.length <= 2){
	            $scope.transctionsPerSecondChart.chart.noData = "No Data Available."
	        }
	        if($scope.connectionsData.length <= 3){
	            $scope.connectionsChart.chart.noData = "No Data Available."
	        }
	        if($scope.rowsData.length <= 4){
	            $scope.rowsChart.chart.noData = "No Data Available."
	        }
	        if(componentStatus == undefined){
	        }else if (componentStatus.state == "Running"){
	            session.call("com.bigsql.live_dbstats",[$stateParams.component]);
                session.call('com.bigsql.activity',[$stateParams.component]);
	        }
    	};

	    refreshRate = $interval(callStatus, 5000);

	    $rootScope.$on('refreshRateVal', function () {
	    	$interval.cancel(refreshRate);
	    	if(arguments[1] == "" || arguments[1] == undefined){
	    		refreshRate = $interval(callStatus, 5000);
	    	} else if (arguments[1] == '0'){
                $interval.cancel(refreshRate);
            } else {
		    	refreshRate = $interval(callStatus, arguments[1]);    		
	    	}
	    });

        session.subscribe("com.bigsql.initgraphs", function (data) {
	        var graph_data = data[0];
            $scope.cpuData[0].values.length = 0;
            $scope.cpuData[1].values.length = 0;
            $scope.diskIOData[0].values.length = 0;
            $scope.diskIOData[1].values.length = 0;
	        for (var i=0;i<graph_data.length;i=i+1){
	            var timeVal = Math.round( (new Date( graph_data[i]['time'] + ' UTC')).getTime() );
	            $scope.cpuData[0].values.push({x: timeVal, y: graph_data[i]['cpu_per']['system']});
	            $scope.cpuData[1].values.push({x: timeVal, y: graph_data[i]['cpu_per']['user']});
	            $scope.diskIOData[0].values.push({x: timeVal, y: graph_data[i]['io']['read_bytes']});
	            $scope.diskIOData[1].values.push({x: timeVal, y: graph_data[i]['io']['write_bytes']});
	        }
	        if($scope.cpuData.length <= 2){
	            $scope.cpuChart.chart.noData = "No Data Available."
	        }
	        if($scope.diskIOData.length <= 2){
	            $scope.diskIOChart.chart.noData = "No Data Available."
	        }
	       	$scope.$apply();
	    }).then(function (subscription) {
	        subscriptions.push(subscription);
	    });

	    session.subscribe("com.bigsql.graphs", function (data) {
	        if($scope.cpuData[0].values.length > 60){
	            $scope.cpuData[0].values.shift();
	            $scope.cpuData[1].values.shift(); 
	            $scope.diskIOData[0].values.shift();
	            $scope.diskIOData[1].values.shift();    
	        }
	        var timeVal = Math.round( (new Date(data[0]['time'] + ' UTC')).getTime() )
	        $scope.cpuData[0].values.push({x: timeVal, y: data[0]['cpu_per']['system']});
	        $scope.cpuData[1].values.push({x: timeVal, y: data[0]['cpu_per']['user']});
	        $scope.diskIOData[0].values.push({x:timeVal,y:data[0]['io']['read_bytes']});
            $scope.diskIOData[1].values.push({x:timeVal,y:data[0]['io']['write_bytes']});
	        $scope.showGraphs = true;
            $scope.$apply();
	    }).then(function (subscription) {
	        subscriptions.push(subscription);
	    });

        // Handle page visibility change events
        function handleVisibilityChange() {
            if (document.visibilityState == "hidden") {
                $interval.cancel(refreshRate);
                clear();
            } else if (document.visibilityState == "visible") {
                clear();
                session.call('com.bigsql.initial_dbstats', [$stateParams.component]);
                session.call("com.bigsql.initial_graphs");
                refreshRate = $interval(callStatus, 5000);
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange, false);
	});

	//need to destroy all the subscriptions on a template before exiting it
    $scope.$on('$destroy', function () {
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i]);
        }
        clear();
        $interval.cancel(refreshRate);
    });

}]);
angular.module('bigSQL.components').controller('hostGraphModalController', ['$scope', '$uibModalInstance', 'PubSubService', 'UpdateComponentsService', 'MachineInfo', '$http', '$window', '$interval', '$rootScope', 'bamAjaxCall', function ($scope, $uibModalInstance, PubSubService, UpdateComponentsService, MachineInfo, $http, $window, $interval, $rootScope, bamAjaxCall) {

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    $scope.chartName = $uibModalInstance.chartName;
    $scope.data = $uibModalInstance.data;
    $scope.hostName = $uibModalInstance.hostName;

    var chart = $uibModalInstance.chart;
    chart.chart['showLegend'] = true;
    $scope.chart = chart;

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };
    
}]);

angular.module('bigSQL.components').controller('bamLoading', ['$scope', 'PubSubService', '$rootScope', '$window', '$timeout', 'bamAjaxCall', function ($scope, PubSubService, $rootScope, $window, $timeout, bamAjaxCall) {

	$scope.bamLoading = true;
	var subscriptions = [];
	var session;

  var sessPromise = PubSubService.getSession();
  sessPromise.then(function (sessPram) {
  	session = sessPram;
  	session.call('com.bigsql.serverStatus');
      session.subscribe("com.bigsql.onServerStatus", function (args) {
      	$scope.bamLoading = false;
        $window.location.href = "#/"
        $scope.$apply();
   			var components = $(JSON.parse(args[0])).filter(function(i,n){ return n.category === 1;});
    		if(components.length != 0){
    			$scope.pgComp = components;
    		}
    }).then(function (subscription) {
        subscriptions.push(subscription);
    });
  });

	$timeout(function() {
        if ($scope.bamLoading) {
            $window.location.reload();
        };
    }, 10000);

	$scope.$on('$destroy', function () {
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i]);
        }
    });

}]);
angular.module('bigSQL.components').controller('loggingParamController', ['$scope','$rootScope', '$uibModalInstance', 'PubSubService', '$sce', function ($scope, $rootScope, $uibModalInstance, PubSubService, $sce) {

    var session;

    $scope.showResult = false;
    $scope.showStatus =  true;
    $scope.changedVales = {};
    $scope.initialValues = {};
    var subscriptions = [];
    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
        session = val;

        session.call('com.bigsql.get_logging_parameters', [
            $scope.comp
        ]);

        session.subscribe("com.bigsql.logging_settings", function (data) {
            var result = data[0];
            $scope.data = result.settings;
            for (var i = $scope.data.length - 1; i >= 0; i--) {
                $scope.initialValues[$scope.data[i].name] = $scope.data[i].setting;
            }
            $scope.$apply();
            if(result.error==0){
                $scope.logging_params=result.settings;

            }else{
                $scope.logging_params="";
            }

        }).then(function (sub) {
            subscriptions.push(sub);
        });

    });

    $scope.comp = $uibModalInstance.comp;


    $scope.changeSetting = function (value, setting) {

        if(value != undefined){
            $scope.changedVales[value] = setting;
        }
        
    }

    $scope.save = function (changedVales, comp) {
        if(Object.keys(changedVales).length > 0 && $scope.initialValues != $scope.changedVales){
            session.call('com.bigsql.change_log_params', [comp, changedVales] )
        }

        session.subscribe("com.bigsql.on_change_log_params", function (data) {
            $uibModalInstance.dismiss('cancel');
        }).then(function (sub) {
            subscriptions.push(sub);
        });
    }

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    //need to destroy all the subscriptions on a template before exiting it
    $scope.$on('$destroy', function () {
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i])
        }
    });


    
}]);
angular.module('bigSQL.components').controller('pgInitializeController', ['$scope','$rootScope', '$uibModalInstance','MachineInfo', 'PubSubService', 'bamAjaxCall', '$http', '$window', function ($scope, $rootScope, $uibModalInstance, MachineInfo, PubSubService, bamAjaxCall, $http, $window) {

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

    function getInfoComp(argument) {
        var infoData = bamAjaxCall.getCmdData('info/' + $scope.comp)
        infoData.then(function(args) {
            var data = args[0];
            if (data.component == $scope.comp) {
                if(data['autostart'] == "on" ){
                    $scope.autostart = true;
                }else if(data['autostart'] == "off" ){
                    $scope.autostart = false;
                }
            }
        });
    }

    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
    	session = val;
        session.call('com.bigsql.checkOS');
        session.subscribe('com.bigsql.onCheckOS', function (args) {
            if(args[0] != 'Linux'){
                if (!$scope.autoStartButton) {
                    $scope.autostartChange(true);
                    $scope.autoStartButton = true;
                }else{
                    getInfoComp();
                }
            }else{
                $scope.autostartDisable = true;
            }
        });
        session.call('com.bigsql.getAvailPort',[$scope.comp,'']);
        if($scope.host == 'localhost' || $scope.host == '' || !$scope.host ){
            var hostInfo = bamAjaxCall.getCmdData('info');
        } else{
            var hostInfo = bamAjaxCall.getCmdData('hostcmd/info/' + $scope.host);
        }
        hostInfo.then(function (argument) {
            var data = argument[0];
            if(!$scope.dataDir){
                $scope.dataDir = data.home + '/data/' + $scope.comp;      
            }
            if($scope.dataDir.length > 40){
                $scope.dataDir = "..." + $scope.dataDir.substring(17, $scope.dataDir.length)
            }
            $scope.dataDirVal = data.home + '/data/' + $scope.comp;
        });

        $scope.portNumber = '';

        $scope.autostartChange = function (args) {
            var autoStartVal;
            if(args){
                autoStartVal = 'on';
            } else {
                autoStartVal = 'off';       
            }
            if($scope.host == 'localhost' || $scope.host == '' || !$scope.host ){
                session.call('com.bigsql.autostart',[autoStartVal,$scope.comp]).then(function (argument) {
                getInfoComp();
            });
            } else{
                session.call('com.bigsql.autostart',[autoStartVal,$scope.comp, $scope.host]).then(function (argument) {
                    getInfoComp();
                });
            }
        }


        session.subscribe('com.bigsql.onPortSelect', 
            function (data) {
                $scope.portNumber = data.join();
            }).then(
            function (subscription){
                subscriptions.push(subscription);
            });

        session.subscribe('com.bigsql.onInit',
        function (data) {
                var compStatus = JSON.parse(data[0]);
                if(compStatus[0].status == 'complete'){
                    $scope.addToMetaData();
                }else{
                    $uibModalInstance.dismiss('cancel');
                }
            }).then(function (subscription){
                subscriptions.push(subscription);
            });
    });

    $scope.addToMetaData = function (comp, remote_host) {
        if($scope.host == 'localhost' || $scope.host == '' || !$scope.host){
            var infoComp = bamAjaxCall.getCmdData('info/' + $scope.comp)
        }else{
            var infoComp = bamAjaxCall.getCmdData('info/' + $scope.comp + '/' + $scope.host)
        }
        infoComp.then(function(args) { 
            args[0]['host'] = $scope.host;
            var addToMetaData = $http.post($window.location.origin + '/api/add_to_metadata', args[0]);
            addToMetaData.then(function (argument) {
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
            session.call('com.bigsql.init', [ $scope.comp, $scope.formData.password, $scope.dataDirVal, $scope.portNumber ] );
        } else {
            if ($scope.userName == undefined || $scope.password == undefined) {
                var event_url =  'initpg/'  + $scope.host + '/' + $scope.comp + '/' +$scope.formData.password ;
            }else{
                var event_url =  'initpg/'  + $scope.host + '/' + $scope.comp + '/' +$scope.formData.password + '/' + $scope.userName +'/' + $scope.userPassword;
            }
            var eventData = bamAjaxCall.getCmdData(event_url);
            eventData.then(function(data) {
                $scope.addToMetaData();                     
            });
        }

    }

    $scope.$on('$destroy', function () {
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i])
        }
    });

}]);
angular.module('bigSQL.components').controller('profilerController', ['$scope', '$uibModal', 'PubSubService', '$state', 'UpdateComponentsService', '$filter', '$rootScope', '$timeout', '$window', '$http', '$location', 'bamAjaxCall', function ($scope, $uibModal, PubSubService, $state, UpdateComponentsService, $filter, $rootScope, $timeout, $window, $http, $location, bamAjaxCall) {

    $scope.alerts = [];
    $scope.successAlerts = [];
    $scope.extensionAlerts = [];

    var subscriptions = [];
    $scope.components = {};

    var session;
    $scope.updateSettings;
    $scope.loading = true;
    $scope.retry = false;
    $scope.disableShowInstalled = false;
    $scope.component;
    $scope.enableBtns = false;
    $scope.disableAbout = false;
    $scope.refreshingFields = false;

    $rootScope.$on('sessionCreated', function () {
        var sessPromise = PubSubService.getSession();
        sessPromise.then(function (sessParam) {
            session = sessParam;
        });
    });

    var infoData = bamAjaxCall.getCmdData('getrecentreports/profiler');
    infoData.then(function (data) {
        var files_list = data.data;
        if(files_list.length > 0){
            $scope.report_file = files_list[0].file_link.replace('reports/','');
            $scope.report_url = files_list[0].file_link;
        }
    });

    function getInstanceInfo(comp) {
    
        var instanceInfo = bamAjaxCall.getCmdData('status/'+ comp);
        instanceInfo.then(function (argument) {
            $scope.pgPort = argument.port;
        })
    }

    function checkplProfilerStatus(argument) {
        var compStatus = bamAjaxCall.getCmdData('status/'+ $scope.component);
            compStatus.then(function (data) {
                if (data.state != "Installed") {
                    $scope.alerts.push({
                        msg:  $scope.component + ' is not Installed yet. ',
                        type: 'danger',
                        pgComp: false
                    });
                }else{
                    $scope.enableBtns = true;
                    session.call('com.bigsql.db_list', [$scope.selectComp]);
                }
            });
    }

    $scope.onSelectChange = function (argument) {
        $scope.extensionAlerts.splice(0,1);
        $scope.successAlerts.splice(0,1);
        localStorage.setItem('selectedCluster', argument);
        $scope.alerts.splice(0, 1);
        $scope.selectDatabase = '';
        if(argument){
            $scope.component = 'plprofiler3-'+argument;
            checkplProfilerStatus();
            getInstanceInfo(argument);
        }
    }

    $scope.onDatabaseChange = function (argument) {
        $scope.extensionAlerts.splice(0,1);
        if (argument) {
            localStorage.setItem('selectedDatabase', JSON.stringify({'database': argument, 'component': $scope.selectComp}));   
            session.call('com.bigsql.checkExtension', [
                argument, $scope.selectComp, 'plprofiler'
            ]);
            session.call('com.bigsql.plprofiler', [
                $scope.hostName, '',
                $scope.pgPort, argument,
                '', $scope.pgQuery,
                $scope.pgTitle, $scope.pgDesc,
                "check", $scope.selectComp
            ]);
        }
    }

    $scope.createExtension = function (argument) {
        $scope.extensionAlerts.splice(0,1);
        session.call('com.bigsql.createExtension', [
                $scope.selectDatabase, $scope.selectComp, 'plprofiler'
            ]);
    }

    $rootScope.$on('refreshPage',function (argument) {
        $window.location.reload();
    } );

    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
        session = val;

        session.call('com.bigsql.checkLogdir');


        session.subscribe("com.bigsql.onCheckLogdir", function (components) {
            var selectedCluster = localStorage.getItem('selectedCluster');
            $scope.components = JSON.parse(components[0]);
            if($scope.components.length == 1){
                $scope.selectComp = $scope.components[0].component;
                $scope.onSelectChange($scope.selectComp);
                $scope.component = 'plprofiler3-'+ $scope.selectComp;
                session.call('com.bigsql.db_list', [$scope.selectComp]);
                getInstanceInfo($scope.selectComp);
                // localStorage.setItem('runningPostgres');
            }else if($scope.components.length > 1 && selectedCluster){
                $scope.selectComp = selectedCluster;
                $scope.onSelectChange(selectedCluster);
            }else if($scope.components.length <= 0){
                $scope.disableAbout = true;
                $scope.alerts.push({
                    msg:  "No Postgres component Installed/ Initialized.",
                    type: 'danger',
                    pgComp: true
                });
            }
            $scope.refreshingFields = false;
            $scope.$apply();
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        session.subscribe("com.bigsql.onCheckExtension", function (data) {
            if (!data[0].status) {
                $scope.extensionAlerts.push({
                        msg:  'plprofiler extension is not enabled on ' + $scope.selectDatabase + ' database. Do you want to enable?',
                        type: 'warning',
                        showBtns : true,
                    });
                $scope.$apply();
            }
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        session.subscribe("com.bigsql.onCreateExtension", function (data) {
            if (data[0].status) {
                $scope.extensionAlerts.push({
                        msg:  'Successfully created plprofiler extension.',
                        type: 'success',
                        showBtns: false,
                    });
                $scope.$apply();
            }
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        session.subscribe('com.bigsql.ondblist', function (data) {
            try{
                var selectedDatabase = JSON.parse(localStorage.getItem('selectedDatabase'));
            }catch(e){
                var selectedDatabase = '';
            }
            if (data[0].error) {
                $scope.successAlerts.push({
                    msg: data[0].error,
                    type: 'danger',
                });
            }
            for (var i = data.length - 1; i >= 0; i--) {
                if ($scope.selectComp == data[i].component) {
                    $scope.databases = data[i].list;
                    if (selectedDatabase.database && data[i].component == selectedDatabase.component) {
                        for (var i = $scope.databases.length - 1; i >= 0; i--) {
                            if (selectedDatabase.database == $scope.databases[i].datname) {
                                $scope.onDatabaseChange(selectedDatabase.database);
                                $scope.selectDatabase = selectedDatabase.database;
                            }
                        }
                    }
                }
            }
            $scope.$apply();
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        session.subscribe("com.bigsql.profilerReports", function (data) {
            $scope.generatingReportSpinner=false;
            $scope.errorMsg = '';
            var result=data[0];
            if(data[0].action == 'check'){
                $scope.status = data[0];
            }
            if (result.error == 0) {

                if(result.action == "profile_query" || result.action == "generate"){
                    $scope.report_file = result.report_file;
                    $scope.report_url = "/reports/" + result.report_file;
                    $scope.successAlerts.push({
                        msg:  'Your report has been generated, please see below.',
                        type: 'success',
                        pgComp: false
                    });
                }
                else{
                    // $scope.errorMsg = result.msg;

                }
            } else {
                // $scope.errorMsg = result.msg;
            }
            $scope.$apply();

        }).then(function (subscription) {
            subscriptions.push(subscription);
        });
    });

    $scope.refreshFields = function (argument) {
        $scope.refreshingFields = true;
        $timeout( refreshFields, 1000);
    }

    function refreshFields(argument) {
        session.call('com.bigsql.checkLogdir');
    }
    $scope.hostName = 'localhost';

    $scope.generateReport = function () {
        $scope.report_file = "";
        $scope.report_url = "";

        $scope.generatingReportSpinner=true;


        session.call('com.bigsql.plprofiler', [
            $scope.hostName, $scope.pgUser,
            $scope.pgPort, $scope.pgDB,
            $scope.pgPass, $scope.pgQuery,
            $scope.enableProfiler, $scope.enableProfiler,
            $scope.pgTitle, $scope.pgDesc
        ]);

    };

    $scope.openRecentReports = function (argument) {
        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/recentReports.html',
            controller: 'recentReportsController',
            windowClass: 'switch-modal-window'
        });
        modalInstance.reportsType="profiler";
        modalInstance.comp = $scope.selectComp;
    };

    $scope.queryProfiler = function (hostName, pgUser, pgPass, pgDB, pgPort) {
        $scope.alerts.splice(0, 1);
        $scope.extensionAlerts.splice(0,1);
        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/statementProfilingModal.html',
            controller: 'statementProfilingController',
        });
        modalInstance.hostName = hostName;
        modalInstance.pgUser = '';
        modalInstance.pgPass = '';
        modalInstance.pgDB = $scope.selectDatabase;
        modalInstance.pgPort = pgPort;
        modalInstance.comp = $scope.selectComp;
    };

    $scope.globalProfiling = function (hostName, pgUser, pgPass, pgDB, pgPort) {
        $scope.alerts.splice(0, 1);
        $scope.extensionAlerts.splice(0,1);
        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/globalProfilingModal.html',
            controller: 'globalProfilingController',
        });
        modalInstance.hostName = hostName;
        modalInstance.pgUser = '';
        modalInstance.pgPass = '';
        modalInstance.pgDB = $scope.selectDatabase;
        modalInstance.pgPort = pgPort;
        modalInstance.comp = $scope.selectComp;
    };

    $scope.openDetailsModal = function (comp) {
        if(!$scope.disableAbout){
            $scope.alerts.splice(0, 1);
            $scope.extensionAlerts.splice(0,1);
            var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/details.html',
                // windowClass: 'comp-details-modal',
                size: 'lg',
                controller: 'ComponentDetailsController',
                keyboard  : false,
                backdrop  : 'static',
            });
            modalInstance.component = $scope.component;
            modalInstance.isExtension = true;
        }
    };

    $scope.closeAlert = function (index) {
        $scope.successAlerts.splice(index, 1);
        $scope.alerts.splice(index, 1);
        $scope.extensionAlerts.splice(index,1);
    };

    //need to destroy all the subscriptions on a template before exiting it
    $scope.$on('$destroy', function () {
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i])
        }
    });
}]);


angular.module('bigSQL.components').controller('recentReportsController', ['$scope','$rootScope', '$uibModalInstance', 'PubSubService', 'bamAjaxCall', '$sce', '$http', '$window', '$uibModal', function ($scope, $rootScope, $uibModalInstance, PubSubService, bamAjaxCall, $sce, $http, $window, $uibModal) {

    $scope.showResult = false;
    $scope.showStatus =  true;
    $scope.autoSelect = false;
    $scope.logAction = false;
    $scope.showError = false;
    $scope.comp = $uibModalInstance.comp;
    $scope.reportsType = $uibModalInstance.reportsType;

    function getReports(argument) {
        var reportsType = $scope.reportsType;
        var infoData = bamAjaxCall.getCmdData('getrecentreports/' + reportsType);
        infoData.then(function (data) {
            var files_list = data.data;
            if(files_list.length == 0){
                $scope.showError = true;
            }else{
                $scope.files_list=files_list;                
            }
        });
    }

    getReports();

    $rootScope.$on('refreshReports', function (argument) {
        $uibModalInstance.dismiss('cancel');
        // getReports();
    })

    $scope.toggleAll = function() { 
        if($scope.isAllSelected){
            $scope.isAllSelected = false;
        }else{
            $scope.isAllSelected = true;
        }
        angular.forEach($scope.files_list, function(itm){ itm.selected = $scope.isAllSelected; });
    }
      
    $scope.optionToggled = function(){
        $scope.checked = false;
        angular.forEach($scope.files_list, function (item) {
            if(item.selected){
                $scope.checked = true;
            }
        });
    }

    $scope.removeFiles = function (files, selectAll) {
        var deleteFiles = [];
        if(selectAll){
            for (var i = files.length - 1; i >= 0; i--) {
                deleteFiles.push(files[i].file);
            }
        }else{
            for (var i = files.length - 1; i >= 0; i--) {
                if(files[i].selected){
                    deleteFiles.push(files[i].file);
                }
            }            
        }
        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/confirmDeletionModal.html',
            controller: 'confirmDeletionModalController',
        });
        modalInstance.deleteFiles = deleteFiles;
        modalInstance.comp = $scope.comp;
    }

    $scope.cancel = function () {
        $rootScope.$emit('refreshPage');
        $uibModalInstance.dismiss('cancel');
    };

    //need to destroy all the subscriptions on a template before exiting it
    $scope.$on('$destroy', function () {
        
    });


    
}]);
angular.module('bigSQL.components').controller('statementProfilingController', ['$scope','$rootScope', '$uibModalInstance','MachineInfo', 'PubSubService', function ($scope, $rootScope, $uibModalInstance, MachineInfo, PubSubService) {

	var session;

    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
    	session = val;
    });

    var subscriptions = [];

    $scope.hostName = $uibModalInstance.hostName;
    $scope.pgUser = $uibModalInstance.pgUser;
    $scope.pgPass = $uibModalInstance.pgPass;
    $scope.pgDB = $uibModalInstance.pgDB;
    $scope.pgPort = $uibModalInstance.pgPort;
    $scope.enableProfiler = false;
    $scope.comp = $uibModalInstance.comp;
    $scope.alerts = [];

    $scope.generateReport = function (argument) {

        if(!$scope.pgTitle){
            $scope.pgTitle = $scope.comp+':'+$scope.pgDB;
        }
    	session.call('com.bigsql.plprofiler', [
            $scope.hostName, $scope.pgUser,
            $scope.pgPort, $scope.pgDB,
            $scope.pgPass, $scope.pgQuery,
            $scope.pgTitle, $scope.pgDesc,
            'profile_query', $scope.comp
        ]).then(function (sub) {
            // $rootScope.$emit('refreshPage');
        	// $uibModalInstance.dismiss('cancel');
        });

        session.subscribe("com.bigsql.profilerReports", function (data) {
            $scope.generatingReportSpinner=false;
            $scope.errorMsg = '';
            var result=data[0];
            if (result.error == 0) {

                if(result.action == "profile_query" || result.action == "generate"){
                    $uibModalInstance.dismiss('cancel');
                }
                else{
                    $scope.alerts.push({
                            msg:  result.msg,
                            type: 'danger',
                        });
                    
                }
            } else {
                $scope.alerts.push({
                            msg:  result.msg,
                            type: 'danger',
                        });
            }
            $scope.$apply();

        }).then(function (subscription) {
            subscriptions.push(subscription);
        });
    };

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.cancel = function () {
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i])
        }
        $rootScope.$emit('refreshPage');
        $uibModalInstance.dismiss('cancel');
    };

}]);
angular.module('bigSQL.components').controller('switchLogfileController', ['$scope','$rootScope', '$uibModalInstance', 'PubSubService', '$sce', function ($scope, $rootScope, $uibModalInstance, PubSubService, $sce) {

	var session;

    $scope.showResult = false;
    $scope.showStatus =  true;
    $scope.autoSelect = false;
    $scope.logAction = false;
    $scope.logFile = 'pgbadger-%Y%m%d_%H.log';
    var subscriptions = [];
    var sessionPromise = PubSubService.getSession();
    sessionPromise.then(function (val) {
    	session = val;

    });

    $scope.comp = $uibModalInstance.comp;
    $scope.currentLogfile = $uibModalInstance.currentLogfile;

    $scope.switchFile = function (fileName) {
        $scope.logAction = true;
        session.call('com.bigsql.switch_log_file', [
            $scope.comp, fileName
        ]);

        session.subscribe("com.bigsql.onSwitchLogfile", function (data) {
            var result = data[0];

            if(result.error == 0){
                $scope.logAction = true;
                $scope.$apply();

                window.setTimeout(function() {
                    $rootScope.$emit('switchLogfile', fileName, $scope.comp);
                }, 2000);
            }else{
                $rootScope.$emit('switchLogfileError', result);
                $uibModalInstance.dismiss('cancel');
            }

        }).then(function (sub) {
            subscriptions.push(sub);
        }); 

        session.subscribe("com.bigsql.log_files_list", function (data) {
            $uibModalInstance.dismiss('cancel');
        });       
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    //need to destroy all the subscriptions on a template before exiting it
    $scope.$on('$destroy', function () {
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i])
        }
    });


    
}]);
angular.module('bigSQL.components').controller('topController', ['$scope', '$uibModalInstance', 'PubSubService', 'UpdateComponentsService', 'MachineInfo', '$http', '$window', '$interval', '$rootScope', 'bamAjaxCall', function ($scope, $uibModalInstance, PubSubService, UpdateComponentsService, MachineInfo, $http, $window, $interval, $rootScope, bamAjaxCall) {

    var session;
    var subscriptions = [];
    $scope.components = {};
    $scope.alerts = [];

    var updateSelectedList = [];
    var currentComponent = {};
    var checkUpdates;

    var topRefresh;

    var previousTopData = "";

    function getTopCmdData() {

        //console.log($scope.top_host);

        var selectedHost = $scope.top_host;
        $scope.loadingSpinner = true;
        $scope.body = false;
        $scope.hostinfo = $scope.host_info;


        if (selectedHost == "") {
            $scope.host = "localhost";
            var infoData = bamAjaxCall.getCmdData('top');
        } else {
            $scope.host = selectedHost;
            var infoData = bamAjaxCall.getCmdData('hostcmd/top/' + selectedHost);
        }

        infoData.then(function (data) {
            $scope.topProcess = data[0];
            $scope.topProcess.kb_read_sec = 0;
            $scope.topProcess.kb_write_sec = 0;
        });


        $scope.loadingSpinner = false;
        $scope.body = true;

    }


    topRefresh = $interval(getTopCmdData, 2000);
    $scope.cancel = function () {
        $interval.cancel(topRefresh);
        $uibModalInstance.dismiss('cancel');
    };


    var sessionPromise = PubSubService.getSession();

    sessionPromise.then(function (val) {
        getTopCmdData();
    });

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };
    /**
     Unsubscribe to all the apis on the template and scope destroy
     **/
    $scope.$on('$destroy', function () {
        $interval.cancel(topRefresh);

        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i]);
        }

    });

}]);

angular.module('bigSQL.components').controller('usersController', ['$scope', '$uibModalInstance', 'PubSubService', 'UpdateComponentsService', 'MachineInfo', '$http', '$window', '$interval', '$rootScope', function ($scope, $uibModalInstance, PubSubService, UpdateComponentsService, MachineInfo, $http, $window, $interval, $rootScope) {

    var session;
    var subscriptions = [];
    $scope.components = {};
    $scope.alerts = [];

    var updateSelectedList = [];
    var currentComponent = {};
    var checkUpdates;
    $scope.users;

    // new user url = /admin/user_management/user/
    // post data format {email: "test@test.com", active: true, role: "2", newPassword: "password", confirmPassword: "password"}
    // reponse : {"active": true, "role": 2, "id": 4, "email": "tt@tt.com"}

    //delete a user : http://localhost:8050/admin/user_management/user/4
    // responce : {"info": "User Deleted.", "errormsg": "", "data": {}, "result": null, "success": 1}

    //update password : /admin/user_management/user/1
    // request method : PUT
    // data for password : {id: 1, newPassword: "123456", confirmPassword: "123456"}
    // data for status change : {id: 2, active: false}
    // data for role change : {id: 2, role: "1"}
    //response {"active": true, "role": 1, "id": 1, "email": "mahesh.balumuri@openscg.com"}

    function getList() {

        $scope.loadingSpinner = true;
        $scope.body = false;

        $http.get($window.location.origin + '/admin/user_management/role/')
            .success(function (data) {
                $scope.roles = data;

            });

        $http.get($window.location.origin + '/admin/user_management/user/')
            .success(function (data) {
                $scope.users = data;

            });

        $scope.loadingSpinner = false;
        $scope.body = true;

    }

    // $interval(saveUser, 10000);

    $http.get($window.location.origin + '/api/userinfo')
                .success(function(data) {
                    $scope.userInfo = data;

                });

    $scope.cancel = function () {

        $uibModalInstance.dismiss('cancel');

    };

    $scope.addAuserForm = function () {
        if ($scope.users[$scope.users.length - 1].email || $scope.users.length == 1) {
            var newUser = {
                id : $scope.users.length + 1,
                active: true,
                email: '',
                role: 2,
                new: true,
            };
        $scope.users.push(newUser);
        }
    };

    $scope.deleteUser = function (user_id) {

        var delete_url = $window.location.origin + '/admin/user_management/user/' + user_id;

        $http.delete(delete_url)
            .success(function (data) {
                getList();
            })
            .error(function (data, status, header, config) {

            });

    };

    $rootScope.$on('updateUser' ,function (event, updateData) {

        var url = $window.location.origin + '/admin/user_management/user/' + updateData.id;
        $http.put(url, updateData)
            .success(function (data) {
                $scope.alerts.push({
                    msg: data.email + " updated sucessfully."
                });
                getList();
            })
            .error(function (data, status, header, config) {
                $scope.alerts.push({
                    msg: JSON.stringify({data: data})
                });
            });

    });

    $rootScope.$on('saveUser', function(event, userData) {

        var isUpdate = true;

        //checking new filed in $scope.user for new users
        for(var i=0; i < $scope.users.length ; i++){
            if($scope.users[i].new){
                isUpdate = false;
                var res = $http.post($window.location.origin + '/admin/user_management/user/', userData);

                res.success(function (data, status, headers, config) {

                    $scope.statusMsg = data;
                    $scope.alerts.push({
                        msg: data.email + " has been added sucessfully."

                    });
                    getList();

                });

                res.error(function (data, status, headers, config) {
                    $scope.statusMsg = data;
                    $scope.alerts.push({
                        msg: JSON.stringify({data: data})
                    });
                });
            }
        }

        //update already exists user
        if(isUpdate){
            var url = $window.location.origin + '/admin/user_management/user/' + userData.id;
            $http.put(url, userData)
            .success(function (data) {
                $scope.alerts.push({
                    msg: data.email + " updated sucessfully."
                });
                getList();
            })
            .error(function (data, status, header, config) {
                $scope.alerts.push({
                    msg: JSON.stringify({data: data})
                });
            });

        }

    });

    $rootScope.$on('callGetList', function(event) {
        getList();
    })

    var sessionPromise = PubSubService.getSession();

    sessionPromise.then(function (val) {
        getList();
    });

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };
    /**
     Unsubscribe to all the apis on the template and scope destroy
     **/
    $scope.$on('$destroy', function () {

        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i]);
        }

    });

}]);

angular.module('bigSQL.components').controller('whatsNewController', ['$scope','$rootScope', '$uibModalInstance', 'PubSubService', '$sce', 'bamAjaxCall', function ($scope, $rootScope, $uibModalInstance, PubSubService, $sce, bamAjaxCall) {

	$scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    var whatNew = bamAjaxCall.getCmdData('utilRelnotes/' + $uibModalInstance.component )
    whatNew.then(function (data) {
    	var data = JSON.parse(data)
        $scope.whatsNewText = $sce.trustAsHtml(data[0].relnotes);
    });

}]);
angular.module('bigSQL.components').directive('bigsqlInstallComponent', function () {
    var directive = {};

    directive.restrict = 'E';
    /* restrict this directive to elements */
    directive.transclude = true;
    directive.template = "<div class='bigsqlInstallComponent' ng-transclude></div>";

    return directive;
});
angular.module('bigSQL.components').factory('UpdateBamService', function (PubSubService, $q) {

    var bamUpdateInfo;
    var info;


    var getBamUpdateInfo = function () {

        return $q(function (resolve, reject) {

            var subscription;
            var sessionPromise = PubSubService.getSession();
            sessionPromise.then(function (session) {
                session.call('com.bigsql.infoComponent', ['devops']);

                session.subscribe("com.bigsql.onInfoComponent", function (components) {
                    var components = JSON.parse(components[0][0]);
                    session.unsubscribe(subscription);
                    resolve(components[0]);

                }).then(function (sub) {
                    subscription = sub;
                }, function (msg) {
                    reject();
                });
            });

        });
    }

    return {
        getBamUpdateInfo: getBamUpdateInfo,
    }
})

angular.module('bigSQL.components').factory('UpdateComponentsService', function () {
    var components = [];
    var manualUpdateSettings;

    var set = function (comp) {
        components = comp;
    }

    var get = function () {
        return components;
    }

    var setCheckUpdatesManual = function () {
        manualUpdateSettings = true;
    }

    var setCheckUpdatesAuto = function () {
        manualUpdateSettings = false;
    }

    var getCheckUpdates = function () {
        return manualUpdateSettings;
    }


    return {
        get: get,
        set: set,
        setCheckUpdatesManual: setCheckUpdatesManual,
        getCheckUpdates: getCheckUpdates,
        setCheckUpdatesAuto: setCheckUpdatesAuto
    }
})

angular.module('bigSQL.components').factory('bamAjaxCall', function ($q, $http, $window) {


    var getCmdData = function (cmd) {

        return $q(function (resolve, reject) {
            $http.get($window.location.origin + '/api/' + cmd)
            .success(function(data) {
                resolve(data);
            }).error(function (data) {
                resolve('error');
            });
            

        });
    };

    return {
        getCmdData: getCmdData,
    }
});

angular.module('bigSQL.menus').component('devOpsUpdate', {
    bindings: {},
    controller: function ($rootScope, $scope, PubSubService, MachineInfo, $uibModal, UpdateComponentsService, UpdateBamService, bamAjaxCall) {

        var subscriptions = [];

        var session;

        /**Below function is for displaying update badger on every page.
         **/
        var infoData = bamAjaxCall.getCmdData('info/devops');
        infoData.then(function(info) {
            var data = info[0];
            if ( data.component == "devops" && data.is_current == 0 && data.current_version ) {
                $scope.bamUpdate = true;
            } else {
                $scope.bamUpdate = false;
            }
        });

        $scope.open = function () {

            var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/devOpsUpdate.html',
                windowClass: 'bam-update-modal modal',
                controller: 'ComponentDevopsUpdateController',
            });
        };

        /**
         Unsubscribe to all the apis on the template and scope destroy
         **/
        $scope.$on('$destroy', function () {
            for (var i = 0; i < subscriptions.length; i++) {
                session.unsubscribe(subscriptions[i]);
            }
        });


    },
    templateUrl: "../app/menus/partials/bamHeaderUpdate.html"
});
angular.module('bigSQL.menus').component('leftMenu', {
    bindings: {},
    controller: function ($scope, PubSubService) {
    },
    templateUrl: "../app/menus/partials/leftMenu.html"
});
angular.module('bigSQL.menus').component('topMenu', {
    bindings: {},
    controller: function ($rootScope, $scope, $uibModal, UpdateComponentsService, bamAjaxCall, $cookies) {

        /**Below function is for displaying update badger on every page.
         **/

        $scope.hideUpdates = false;
        $scope.currentHost = $cookies.get('remote_host');
        function callList(argument) {
            argument = typeof argument !== 'undefined' ? argument : "";

            $scope.currentHost = argument;
            // var listData = bamAjaxCall.getCmdData('list');
            if (argument=="" || argument == 'localhost'){
                var listData = bamAjaxCall.getCmdData('list');
            } else{
                var listData = bamAjaxCall.getCmdData('hostcmd/list/'+argument);
            }
            listData.then(function(data) {
                var Checkupdates = 0;
                $scope.components = data;
                $scope.pgdevopsUpdate = false;
                for (var i = 0; i < $scope.components.length; i++) {
                    if ($scope.components[i].component != 'pgdevops') {
                        Checkupdates += $scope.components[i].updates;
                    }
                    if ($scope.components[i].component == 'pgdevops' && $scope.components[i].updates == 1) {
                        $scope.pgdevopsUpdate = true;
                    }
                }
                if(!$scope.hideUpdates){
                    $scope.updates = Checkupdates;
                }else{
                    $scope.updates = '';
                }
            });
        }
        
        // callList($scope.currentHost);

        $rootScope.$on('refreshData', function (argument, host) {
            callList(host);
        });

        $rootScope.$on('updatesCheck', function (argument, host) {
            callList(host);
        });

        $rootScope.$on('hideUpdates', function (argument, host) {
            $scope.hideUpdates = true;
            callList($scope.currentHost);
        });

        $rootScope.$on('showUpdates', function (argument) {
            $scope.hideUpdates = false; 
            callList($scope.currentHost);   
        });

        var infoData = bamAjaxCall.getCmdData('info');
        infoData.then(function(data) {
            $scope.pgcInfo = data[0];
        });

        var userInfoData = bamAjaxCall.getCmdData('userinfo');
        userInfoData.then(function(data) {
            $scope.userInfo = data;
        });

        $scope.open = function () {

            UpdateComponentsService.setCheckUpdatesAuto();

            var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/updateModal.html',
                // windowClass: 'bam-update-modal modal',
                windowClass: 'comp-details-modal',
                controller: 'ComponentsUpdateController',
            });
        };

        $scope.openDetailsModal = function (comp) {
            var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/details.html',
                // windowClass: 'comp-details-modal',
                size: 'lg',
                controller: 'ComponentDetailsController',
                keyboard  : false,
                backdrop  : 'static',
            });
            modalInstance.component = 'pgdevops';
            modalInstance.isExtension = true;
        };

        $scope.usersPopup = function () {

            UpdateComponentsService.setCheckUpdatesAuto();

            var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/usersModal.html',
                windowClass: 'modal',
                size: 'lg',
                controller: 'usersController',
            });
        };

    },
    templateUrl: "../app/menus/partials/topMenu.html"
});