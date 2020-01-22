angular.module('bigSQL.components').factory('pgcRestApiCall', function ($q, $http, $window) {


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
            $http.get($window.location.origin + '/api/pgc/' + cmd, config)
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
                    data: data_params,
                    headers : {
                        'Accept' : 'application/json',
                        'Content-Type': 'application/json'
                    }
                };
            }
            $http({
                contentType: "application/json; charset=utf-8",
                method: "POST",
                url: $window.location.origin +'/api/pgc/' + cmd,
                data:data_params,
            })
            .success(function(data) {
               resolve(data);
            }).error(function (data) {
               resolve('error');
            });
            //$http.post($window.location.origin +'/api/pgc/' + cmd, config)



        });
    };


    return {
        getCmdData: getCmdData,
        postData: postData
    }
});