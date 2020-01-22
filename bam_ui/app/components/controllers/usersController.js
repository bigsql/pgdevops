angular.module('bigSQL.components').controller('usersController', ['$scope', '$uibModalInstance', 'PubSubService', 'UpdateComponentsService', 'MachineInfo', '$http', '$window', '$interval', '$rootScope', function ($scope, $uibModalInstance, PubSubService, UpdateComponentsService, MachineInfo, $http, $window, $interval, $rootScope) {

    var session;
    var subscriptions = [];
    $scope.components = {};
    $scope.alerts = [];

    var updateSelectedList = [];
    var currentComponent = {};
    var checkUpdates;
    $scope.users;
    $rootScope.userInfoGlobal;

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
                    $rootScope.userInfoGlobal = data;

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
