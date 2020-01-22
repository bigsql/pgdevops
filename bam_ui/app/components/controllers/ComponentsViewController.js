angular.module('bigSQL.components').controller('ComponentsViewController', ['$scope', '$uibModal', 'PubSubService', '$state', 'UpdateComponentsService', '$filter', '$rootScope', '$timeout', '$window', 'bamAjaxCall', '$http', '$cookies', 'pgcRestApiCall', function ($scope, $uibModal, PubSubService, $state, UpdateComponentsService, $filter, $rootScope, $timeout, $window, bamAjaxCall, $http, $cookies, pgcRestApiCall) {

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
    $scope.ExtensionsLoading = false;
    $scope.showComps = {test:false};
    $scope.selectRepo = {value:''};
    $scope.os = {ubuntu: false};
    $scope.noExtension = {found: false};
    $scope.sudo_pwd=false;
    $scope.cmd_str = ""
    $scope.host_pwd="";
    $scope.pwd = {text: ''};
    $scope.previous_repo = "";

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
            if(comps[i]['category_desc'] == 'PostgreSQL' && comps[i]['stage'] == 'prod' && comps[i]['component'] != 'pg10'){
                pgComps.push(comps[i]);
            }else if(comps[i]['category_desc'] != 'PostgreSQL'){
                nonPgComps.push(comps[i]);
            };
        }
        // For displaying pg10 component as first Item in package manager using below condition
        if(comps.length > 0 && comps[0]['component'] == 'pg10'){
            pgComps.push(comps[0]);
        }
        return  pgComps.reverse().concat(nonPgComps);
    }

    $scope.getExtensions = function( comp, idx) {
        $scope.ExtensionsLoading = true;
        if ($scope.components[idx].extensionOpened) {
            $window.location = '#/details-pg/' + comp
        }
        $cookies.putObject('openedExtensions', {'component': comp, 'index': idx});
        for (var i = 0; i < $scope.components.length; i++) {
            $scope.components[i].extensionOpened = false;           
        }
        $scope.components[idx].extensionOpened = true;
        $scope.currentHost = typeof $scope.currentHost !== 'undefined' ? $scope.currentHost : "";
        if ($scope.currentHost=="" || $scope.currentHost == 'localhost'){
            var extensionsList = pgcRestApiCall.getCmdData('list --extensions ' + comp);
        } else{
            var extensionsList = pgcRestApiCall.getCmdData('list --extensions ' + comp + ' --host "' + $scope.currentHost + '"');
        }
        // var extensionsList = bamAjaxCall.getCmdData('extensions/' + comp);
        extensionsList.then(function (argument) {
            if (argument.length > 0) {
                if ( argument[0].state != 'error' ) {
                    $scope.ExtensionsLoading = false;
                    $scope.noExtension.found = false;
                    $scope.extensionsList = argument;
                    if ($scope.showInstalled) {
                        $scope.extensionsList = $($scope.extensionsList).filter(function(i,n){ return n.status != "NotInstalled" ;})   
                    }
                    for (var i = $scope.extensionsList.length - 1; i >= 0; i--) {
                        $scope.extensionsList[i].modifiedName = $scope.extensionsList[i].component.split('-')[0].replace(/[0-9]/g,'');
                    }
                }
            }else{
                $scope.noExtension.found = true;
                $scope.ExtensionsLoading = false;
            }
        })   
    }

    function getList(argument) {
        argument = typeof argument !== 'undefined' ? argument : "";
        $scope.currentHost = argument;
        if (argument=="" || argument == 'localhost'){
            var listData = pgcRestApiCall.getCmdData('list');
            var pgcInfo = pgcRestApiCall.getCmdData('info');
        } else{
            var listData = pgcRestApiCall.getCmdData('list --host "' + argument + '"');
            var pgcInfo = pgcRestApiCall.getCmdData('info --host "' + argument + '"');
        }

        listData.then(function (data) {
            // $rootScope.$emit('showUpdates');
            $scope.pgcNotAvailable = false;
            if(data == "error"){
                $timeout(wait, 5000);
                $scope.loading = false;
                $scope.retry = true;
                // $cookies.remove('remote_host');
            }else if (data[0].state == 'error') {
                $scope.loading = false;
                $scope.pgcNotAvailable = true;
                $scope.errorData = data[0];
                $scope.components = [];
            } else {
                $scope.pgcNotAvailable = false;
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
                if($cookies.get('openedExtensions')){
                    var extensionCookie = JSON.parse($cookies.get('openedExtensions'));
                    $scope.getExtensions( extensionCookie.component, extensionCookie.index);
                }else{
                    $scope.getExtensions( $scope.components[0].component, 0);                
                }
            } 
        });

        pgcInfo.then(function(data){
            if (data!="error" && data[0].state != 'error') {
                var os = data[0].os;
                if(os.indexOf("Mac") > -1 || os.indexOf("Windows") > -1){
                    $scope.osSupport = false;
                    $scope.os.ubuntu = false;
                }else if (os.indexOf("Ubuntu") > -1) {
                    $scope.osSupport = true;
                    $scope.os.ubuntu = true;
                }else{
                    $scope.osSupport = true;
                    $scope.os.ubuntu = false;
                }
            }
        });
    };

    getList($cookies.get('remote_host'));

    $scope.currentHost = $cookies.get('remote_host');
    $scope.currentHost = typeof $scope.currentHost !== 'undefined' ? $scope.currentHost : "";

    var getLabList = pgcRestApiCall.getCmdData('lablist');

    $scope.showPG10 = false;
    $scope.checkpgdgSetting = false;
    getLabList.then(function (argument) {
        for (var i = argument.length - 1; i >= 0; i--) {
            if(argument[i].lab == "pg10-beta" && argument[i].enabled == "on"){
                $scope.showPG10 = true;
            }
            if(argument[i].lab == "pgdg-repos" && argument[i].enabled == "on"){
                $scope.checkpgdgSetting = true;
            }
        }
    })


    $rootScope.$on('updatePackageManager', function (argument) {
        getList($cookies.get('remote_host'));
    });

    $rootScope.$on('refreshData', function (argument, host) {
        $scope.gettingPGDGdata = true;
        $scope.pgdgNotAvailable = false;
        $cookies.remove('openedExtensions');
        localStorage.removeItem('cacheRepo');
        $scope.loading = true;
        $scope.currentHost = host;
        getList(host);
        $scope.selectPgDg();
        if ($scope.currentHost=='' || $scope.currentHost=='localhost') {
            session.call('com.bigsql.getSetting', ['STAGE']);
        }else{
            session.call('com.bigsql.getSetting', ['STAGE', $scope.currentHost]);
        }
    });

    $rootScope.$on('refreshUpdates', function (argument, host) {
        getList($scope.currentHost);
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

        // session.call('com.bigsql.getBetaFeatureSetting', ['pgdg']);

        // session.subscribe("com.bigsql.onGetBeataFeatureSetting", function (settings) {
        //     if(settings[0].setting == 'pgdg'){
        //         if(settings[0].value == '0' || !settings[0].value){
        //             $scope.checkpgdgSetting = false;
        //         }else{
        //             $scope.checkpgdgSetting = true;
        //         }
        //     }
        //    $scope.$apply();
        // }).then(function (subscription) {
        //     subscriptions.push(subscription);
        // });

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

        if ($scope.currentHost=='' || $scope.currentHost=='localhost') {
            session.call('com.bigsql.getSetting', ['STAGE']);
        }else{
            session.call('com.bigsql.getSetting', ['STAGE', $scope.currentHost]);
        }
        session.subscribe("com.bigsql.onGetSetting", function (settings) {
            if(settings[0] == "test" || settings[0].contains('test')){
               $scope.showComps.test = true
            }else{
                $scope.showComps.test = false;
            }
           $scope.$apply();
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        function wait() {
            $window.location.reload();
        };

        // var infoData = bamAjaxCall.getCmdData('info');
        // infoData.then(function (data) {
        //     $scope.machineInfo =  data[0];
        //     var myDate = new Date();
        //     var previousDay = new Date(myDate);
        //     previousDay.setDate(myDate.getDate() - 7);
        //     $scope.prevWeek = $filter('date')(previousDay, 'yyyy-MM-dd');
        //     for (var i = 0; i < $scope.machineInfo.length; i++) {
        //         if ($scope.machineInfo[i].interval == null) {
        //             if ($scope.machineInfo[i].last_update_utc == null || $scope.machineInfo[i].last_update_utc < $scope.prevWeek) {
        //                 $scope.updateBtn = true;
        //             }
        //         }
        //     }
        //     if ($scope.machineInfo.interval == null || !$scope.machineInfo.interval) {
        //         $scope.updateSettings = 'manual'; 
        //     } else {
        //         $scope.updateSettings = 'auto';
        //     }
        // });
    
        $scope.setTest = function (pgdg) {
            $cookies.remove('openedExtensions');
            $scope.loading = true;
            if ($scope.selectRepo.value) {
                $scope.gettingPGDGdata = true;                
            }
            var param;
            if($scope.showComps.test){
                param = 'test';
            }else{
                param = 'prod';
            }
            $scope.currentHost = typeof $scope.currentHost !== 'undefined' ? $scope.currentHost : "";
            if (pgdg) {
                session.call('com.bigsql.setSetting',['STAGE', param,  $scope.currentHost]).then(function (argument) {
                    if ($scope.selectRepo.value) {
                        $scope.repoChange($scope.selectRepo.value);  
                    }     
                })
            }else{
                session.call('com.bigsql.setSetting',['STAGE', param, $scope.currentHost]).then(function (argument) {
                    getList($scope.currentHost);
                })
            }
        };

    });

    $scope.installedComps = function (event) {
        if ($scope.showInstalled) {
            $scope.showInstalled = false;
        }else{
            $scope.showInstalled = true;
        }
        session.call('com.bigsql.setBamConfig',['showInstalled', $scope.showInstalled]);
        getList($scope.currentHost); 
        // session.call('com.bigsql.list');
    }

    $scope.selectedBigsqlRepo = function (argument) {
        $scope.pgdgSelected = false;
        $scope.loading = true;
        $scope.components = '';
        getList($scope.currentHost);
    }

    $scope.repoChange = function (repo, status) {
        if (repo && repo != "undefined") {
            localStorage.setItem('cacheRepo', repo);
            var isInstalled = false;
            for (var i = $scope.pgdgRepoList.length - 1; i >= 0; i--) {
                if($scope.pgdgRepoList[i].repo == repo && $scope.pgdgRepoList[i].status=="Installed"){
                    isInstalled = true;
                }
            }
            
            $scope.selectRepo.value = repo;
            $scope.sudo_pwd=false;
            if (status == "Installed" || isInstalled) {
                $scope.sudo_pwd=false;
                $scope.noRepoSelected = false;
                $scope.gettingPGDGdata = true;
                $scope.previous_repo = repo;
                if ($scope.currentHost == 'localhost' || $scope.currentHost == '') {
                    var getRepoList =  bamAjaxCall.getCmdData('pgdg/'+ repo + '/list');
                }else{
                if ($scope.host_pwd == ""){
                    var getRepoList = bamAjaxCall.getCmdData('pgdg/'+ repo + '/list/' + $scope.currentHost)
                    } else{
                    var getRepoList = bamAjaxCall.getCmdData('pgdg/'+ repo + '/list/' + $scope.currentHost + "/" + $scope.host_pwd)
                    }
                }
                $scope.host_pwd="";
                $scope.pwd.text="";
                getRepoList.then(function (argument) {
                    $scope.gettingPGDGdata = false;
                    if(argument[0].state == 'error' || argument == 'error'){
                        if (argument[0].msg == "Password required" ){
                            $scope.cmd_str = 'pgdg';
                            $scope.sudo_pwd=true;
                        } else{
                            $scope.errorMsg = argument[0].msg;
                        }

                        $scope.errorMsg = argument[0].msg;
                        $scope.repoList = [];
                        localStorage.removeItem('cacheRepo');
                        $scope.selectRepo.value = '';
                    }else{
                        for (var i = $scope.pgdgRepoList.length - 1; i >= 0; i--) {
                            if($scope.pgdgRepoList[i].repo == $scope.selectRepo.value){
                                $scope.pgdgRepoList[i].status = "Installed";
                            }
                        }
                        $scope.repoList = argument;
                        $scope.showRepoList = true;
                    }
                }) 
            }else{
                $scope.registerRepo(repo);
            }
        }else{
            $scope.noRepoSelected = true;
        }    
    }


    $scope.showPGDGExtraComps = function (argument) {
        $scope.repoChange(argument);
    }

    $scope.refreshRepoList = function (repo) {
        if ($scope.currentHost == 'localhost' || $scope.currentHost == '') {
            var getRepoList =  bamAjaxCall.getCmdData('pgdg/'+ repo + '/list');
        }else{
            var getRepoList = bamAjaxCall.getCmdData('pgdg/'+ repo + '/list/' + $scope.currentHost)
        }
        getRepoList.then(function (argument) {
            if(argument != 'error' || argument != 'error'){
                $scope.repoList = argument;
            }
            if (argument[0].state == 'error') {
                if (argument[0].msg == "Password required" ){
                $scope.sudo_pwd=true;
                } else{
                $scope.pgdgNotAvailableMsg = data[0].msg;
                }
            }
        }) 
    }

    $scope.continueAction = function(argument){
    if ($scope.cmd_str == "repolist"){
        $scope.host_pwd=$scope.pwd.text;

        $scope.selectPgDg();
     }
        else if ($scope.cmd_str == "pgdg"){
        $scope.host_pwd=$scope.pwd.text;
        $scope.repoChange($scope.previous_repo);
        }
    }

    $scope.selectPgDg = function (argument) {
    $scope.sudo_pwd=false;
        $scope.pgdgSelected = true;
        $scope.gettingPGDGdata = true;
        $scope.showRepoList = false;
        $scope.cmd_str = 'repolist';
        if ($scope.currentHost == 'localhost' || $scope.currentHost == '') {
            if ($scope.host_pwd == ""){
                var pgdgComps = pgcRestApiCall.getCmdData('repolist')
            } else {
                var params = {};
                params.pwd = $scope.host_pwd;
                var pgdgComps = pgcRestApiCall.getCmdData('repolist', params)
            }
        }else{
            if ($scope.host_pwd == ""){
                var pgdgComps = bamAjaxCall.getCmdData('hostcmd/repolist/'+$scope.currentHost);
            } else{
                var pgdgComps = bamAjaxCall.getCmdData('hostcmd/repolist/'+$scope.currentHost + "/" + $scope.host_pwd);
            }
            var data = {
                 hostname:$scope.currentHost,
                 cmd:"repolist"
                         };
            //var pgdgComps = bamAjaxCall.getCmdData('pgdglist',data)
        }
        $scope.host_pwd="";
        $scope.pwd.text="";
        pgdgComps.then(function (data) {
            if (data[0].state == 'error') {
                $scope.pgdgNotAvailable = true;
                if (data[0].msg == "Password required" ){
                $scope.sudo_pwd=true;
                } else{
                if (data[0].msg == "Failed to authenticate with password provided."){
                $scope.sudo_pwd=true;
                }
                $scope.pgdgNotAvailableMsg = data[0].msg;
                }

                $scope.gettingPGDGdata = false;
            }else{
                $scope.pgdgNotAvailable = false;
                $scope.gettingPGDGdata = false;
                $scope.showRepoList = true;
                $scope.pgdgRepoList = [];
                $scope.pgdgInstalledRepoList = [];
                $scope.pgdgRepoList = data;
                var selectedRepo, cookieData;
                cookieData = localStorage.getItem('cacheRepo');
                if (cookieData){
                    selectedRepo = cookieData;
                    $scope.selectRepo.value = selectedRepo;
                    $scope.repoChange(selectedRepo);
                    $scope.noRepoSelected = false;
                }else{
                    $scope.noRepoSelected = true;
                    $scope.selectRepo.value = '';
                }
            }
        })
    }

    $scope.registerRepo = function (repo) {
        if($scope.pgdgSelected){
            var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/pgdgActionModal.html',
                controller: 'pgdgActionModalController',
                keyboard  : false,
                backdrop  : 'static',
                size: 'lg'
            });
            modalInstance.pgdgRepo = repo;
            modalInstance.pgdgComp = '';
            modalInstance.host = $cookies.get('remote_host');
        }
    };

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

        var modalInstance = $uibModal.open({
            templateUrl: '../app/components/partials/pgdgActionModal.html',
            controller: 'pgdgActionModalController',
            keyboard  : false,
            backdrop  : 'static',
            size: 'lg'
        });
        modalInstance.pgdgRepo = $scope.selectRepo.value;
        modalInstance.pgdgComp = compName;
        modalInstance.action = action;
        modalInstance.host = $cookies.get('remote_host');
    }

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $rootScope.$on('initComp', function (event, comp) {
        currentComponent = getCurrentComponent(comp);
        currentComponent.init = true;
    });

    $rootScope.$on('refreshRepo', function (event, repo, status) {
        $scope.repoChange(repo, status);
    })

    function wait() {
        $window.location.reload();
    };

    $timeout(function() {
        if ($scope.loading) {
            $window.location.reload();
        };
    }, 15000);

    //need to destroy all the subscriptions on a template before exiting it
    $scope.$on('$destroy', function () {
        for (var i = 0; i < subscriptions.length; i++) {
            session.unsubscribe(subscriptions[i])
        }
    });
}]);