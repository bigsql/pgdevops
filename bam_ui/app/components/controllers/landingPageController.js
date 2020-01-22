angular.module('bigSQL.components').controller('bamLoading', ['$scope', '$rootScope', '$window', '$timeout', 'pgcRestApiCall', '$http', '$uibModal','htmlMessages', 'userInfoService', function ($scope,  $rootScope, $window, $timeout, pgcRestApiCall, $http, $uibModal,htmlMessages, userInfoService) {

  $scope.bamLoading = true;
  $scope.showSplash = false;
  $scope.supported = true;
  $scope.alerts = [];

  $scope.closeAlert = function (index) {
    $scope.alerts.splice(index, 1);
  };
  var getLablist = pgcRestApiCall.getCmdData('lablist');
  getLablist.then(function function_name(lablist) {
      for (var i = lablist.length - 1; i >= 0; i--) {
          if (lablist[i].lab == 'aws' && lablist[i].enabled == 'on') {
              var checkInitLogin = $http.get($window.location.origin + '/check_init_login')
              checkInitLogin.then(function (arg) {
                if (arg.data) {
                  $scope.showSplash = true;
                }
              })
          }
      }
  })

  $scope.checkVersion = function (){
    $scope.notSupported = htmlMessages.getMessage('windows7-not-supported');
    var os = $rootScope.pgcInfo['os'];
    if(os.toLowerCase().contains('windows 7')){
        $scope.alerts.push({
            msg : $scope.notSupported,
            type : 'warning'
        });
        $scope.supported = false;
    }
  };

  $scope.devRole = false;
  var checkUserRole = userInfoService.getUserRole();
  checkUserRole.then(function (data) {
    if(data.data.code == 1){
      $scope.devRole = true;
    }
  })


  var serverStatus = pgcRestApiCall.getCmdData('status');
  serverStatus.then(function (args) {
    $scope.bamLoading = false;
    $window.location.href = "#/";
    var components = $(args).filter(function(i,n){ return n.category === 1;});
    if(components.length != 0){
      $scope.pgComp = components;
    }
  })


  $scope.hideBackupRestore = false;
  var getLablist = pgcRestApiCall.getCmdData('lablist');
  getLablist.then(function (argument) {
    for (var i = argument.length - 1; i >= 0; i--) {
            if (argument[i].lab == 'dumprest' && argument[i].enabled == 'on') {
                $scope.hideBackupRestore = true;
            }
        }
  });

  $rootScope.$on('hideBackupRestoreNav', function (event, value) {
      if (value == 'on') {
        $scope.hideBackupRestore = true;
      }else{
        $scope.hideBackupRestore = false;
      }
    });

	$timeout(function() {
        if ($scope.bamLoading) {
            $window.location.reload();
        };
    }, 10000);

}]);