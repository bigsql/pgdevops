angular.module('bigSQL.components').factory('bamAjaxCall', function ($q, $http, $window) {


    var getCmdData = function (cmd, params) {

        var isObject = function(a) {
            return (!!a) && (a.constructor === Object);
        };
        if (isObject(params)){
        var data_params = params;    
        } else{
            var data_params={};
        }

        return $q(function (resolve, reject) {
            var config = {};
            data_params['_pgd'] = Math.floor(Date.now() / 1000);
            if(Object.keys(data_params).length>0){
                config = {
                params: data_params,
                headers : {'Accept' : 'application/json'}

                };
            }
            $http.get($window.location.origin + '/api/' + cmd, config)
            .success(function(data) {
                resolve(data);
            }).error(function (data) {
                resolve('error');
            });
            

        });
    };

    var postData = function (cmd, params) {

        var isObject = function(a) {
            return (!!a) && (a.constructor === Object);
        };
        if (isObject(params)){
        var data_params = params;
        } else{
            var data_params={};
        }

        return $q(function (resolve, reject) {
            var config = {};
            data_params['_pgd'] = Math.floor(Date.now() / 1000);
            if(Object.keys(data_params).length>0){
                config = {
                params: data_params,
                headers : {'Accept' : 'application/json'}

                };
            }
            $http.post($window.location.origin + cmd, config)
            .success(function(data) {
                resolve(data);
            }).error(function (data) {
                resolve('error');
            });


        });
    };

    var putData = function (cmd, params) {

        var isObject = function(a) {
            return (!!a) && (a.constructor === Object);
        };
        if (isObject(params)){
        var data_params = params;
        } else{
            var data_params={};
        }

        return $q(function (resolve, reject) {
            var config = {};
            data_params['_pgd'] = Math.floor(Date.now() / 1000);
            if(Object.keys(data_params).length>0){
                config = {
                params: data_params,
                headers : {'Accept' : 'application/json'}

                };
            }
            $http.put($window.location.origin + cmd, config)
            .success(function(data) {
                resolve(data);
            }).error(function (data) {
                resolve('error');
            });


        });
    };

    var deleteData = function (cmd, params) {

        var isObject = function(a) {
            return (!!a) && (a.constructor === Object);
        };
        if (isObject(params)){
        var data_params = params;
        } else{
            var data_params={};
        }

        return $q(function (resolve, reject) {
            var config = {};
            data_params['_pgd'] = Math.floor(Date.now() / 1000);
            if(Object.keys(data_params).length>0){
                config = {
                params: data_params,
                headers : {'Accept' : 'application/json'}

                };
            }
            console.log(config);
            $http.delete($window.location.origin + cmd, config)
            .success(function(data) {
                resolve(data);
            }).error(function (data) {
                resolve('error');
            });


        });
    };

    var getData = function (cmd, params) {

        var isObject = function(a) {
            return (!!a) && (a.constructor === Object);
        };
        if (isObject(params)){
        var data_params = params;
        } else{
            var data_params={};
        }

        return $q(function (resolve, reject) {
            var config = {};
            data_params['_pgd'] = Math.floor(Date.now() / 1000);
            if(Object.keys(data_params).length>0){
                config = {
                params: data_params,
                headers : {'Accept' : 'application/json'}

                };
            }
            $http.get($window.location.origin + cmd, config)
            .success(function(data) {
                resolve(data);
            }).error(function (data) {
                resolve('error');
            });


        });
    };

    return {
        getCmdData: getCmdData,
        postData: postData,
        getData: getData,
        deleteData : deleteData,
        putData : putData,
    }
});
