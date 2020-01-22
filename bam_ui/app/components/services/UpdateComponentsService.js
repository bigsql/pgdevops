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
