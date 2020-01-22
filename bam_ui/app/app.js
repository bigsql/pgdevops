//All the modules will be created him , all the developers would have create there modules here
"use strict";
if (!window.location.origin) {
    window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
}

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