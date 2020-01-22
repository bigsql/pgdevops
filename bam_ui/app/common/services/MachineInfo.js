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