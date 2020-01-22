angular.module('bigSQL.menus').component('topMenu', {
    bindings: {},
    controller: function ($rootScope, $scope, $uibModal, UpdateComponentsService, pgcRestApiCall, bamAjaxCall, $cookies, htmlMessages, $window, $http, userInfoService) {

        /**Below function is for displaying update badger on every page.
         **/

        $scope.alerts = [];

        $rootScope.$on('emailSucessMsg', function (event, msg, state) {
            $scope.alerts.push({
                msg:  $scope.successMsg = msg,
                type: state
            });
        });
        $scope.supported = true;
        $scope.closeAlert = function (index) {
            $scope.alerts.splice(index, 1);
        };

        $scope.checkVersion = function (){
            $scope.notSupported = htmlMessages.getMessage('windows7-not-supported');
            if(!$scope.pgcInfo){
                $scope.supported = false;
            }
            else{
                var os = $scope.pgcInfo['os'];
                if(os.toLowerCase().contains('windows 7')){
                    $scope.alerts.push({
                        msg : $scope.notSupported,
                        type : 'warning'
                    });
                    $scope.supported = false;
                }
            }
        };

        $scope.devRole = false;
        var checkUserRole = userInfoService.getUserRole();
        checkUserRole.then(function (data) {
          if(data.data.code == 1){
            $scope.devRole = true;
          }
        })

        $scope.hideUpdates = false;
        $scope.currentHost = $cookies.get('remote_host');
        function callList(argument) {
            argument = typeof argument !== 'undefined' ? argument : "";

            $scope.currentHost = argument;
            // var listData = pgcRestApiCall.getCmdData('list');
            if (argument=="" || argument == 'localhost'){
                var listData = pgcRestApiCall.getCmdData('list');
            } else{
                var listData = pgcRestApiCall.getCmdData('list --host "' + argument + '"');
            }
            listData.then(function(data) {
                var Checkupdates = 0;
                $scope.components = data;
                $scope.pgdevopsUpdate = false;
                for (var i = 0; i < $scope.components.length; i++) {
                    if ($scope.components[i].component != 'pgdevops') {
                        Checkupdates += $scope.components[i].updates;
                    }
                    if ($scope.components[i].component == 'pgdevops' && $scope.components[i].updates == 1 && ($scope.currentHost == '' || $scope.currentHost == 'localhost')) {
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
        
        callList($scope.currentHost);

        $scope.openFeedbackForm = function () {
            var modalInstance = $uibModal.open({
                templateUrl: '../app/components/partials/feedbackForm.html',
                controller: 'feedbackFormController',
            });
        };
        
        $rootScope.$on('refreshData', function (argument, host) {
            callList(host);
        });

        $rootScope.$on('refreshUpdates', function (argument, host) {
            callList($scope.currentHost);
        });

        $rootScope.$on('updatesCheck', function (argument, host) {
            callList(host);
        });

        $rootScope.$on('hideUpdates', function (argument, host) {
            $scope.hideUpdates = true;
            callList($scope.currentHost);
        });

        // $rootScope.$on('showUpdates', function (argument) {
        //     $scope.hideUpdates = false; 
        //     callList($scope.currentHost);   
        // });

        var infoData = pgcRestApiCall.getCmdData('info');
        infoData.then(function(data) {
            $scope.pgcInfo = data[0];
            $rootScope.pgcInfo = $scope.pgcInfo;
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

        $scope.logOut = function (){
            var cookies = $cookies.getAll();
            angular.forEach(cookies, function (v, k) {
                $cookies.remove(k);
            });
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