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
