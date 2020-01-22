'use strict';

angular.module('bigSQL.common').factory('PubSubService', function ($window, $rootScope, $q, $interval) {
    var connection;
    var session;
    var wsuri;
    var httpUri;

    if ($window.location.origin == "file://") {
        wsuri = "ws://127.0.0.1:8080";

    } else {
        wsuri = (document.location.protocol === "http:" ? "ws:" : "wss:") + "//" +
            document.location.host + "/ws";
    }

    //wsuri = "ws://192.168.10.56:8050/ws";

    function getConnection() {
        return connection;
    };

    function initConnection() {
        if (connection == undefined) {
            connection = new autobahn.Connection({
                transports: [
                    {
                        'type': 'websocket',
                        'url': wsuri
                    }
                ],
                realm: "realm1"
            });
        }
    };
    /**
     Opens a connection
     **/
    function openConnection(sessionCreated) {
        connection.open();
        connection.onopen = function (sessionObj) {
            session = sessionObj;
            sessionCreated(session);
        }
    }

    function closeConnection() {
        connection.close('closed', "Connection Closed");
        connection.onclose = function () {
            connection = undefined;
            session = undefined;
        }
    }

    function getSession() {
        return $q(function (resolve, reject) {
            if (session === undefined) {
                if (connection == undefined) {
                    connection = initConnection();
                    resolve(openConnection());
                } else if (connection.session != undefined && connection.session != null) {
                    if (connection.session.isOpen) {
                        session = connection.session;
                        resolve(session);
                    } else {

                        try {
                            var count = 0;
                            var interval = $interval(function () {
                                count++;

                                if (connection.session.isOpen) {
                                    $interval.cancel(interval);
                                    resolve(connection.session);

                                } else if (!connection.session.isOpen && count > 20) {
                                    $interval.cancel(interval);
                                    reject("connection has failed");
                                }

                            }, 100);
                        } catch (err) {
                            throw new Error(err);
                        }
                    }
                }

            } else {
                resolve(session);
                // return session;
            }

        });


    }

    return {
        getConnection: getConnection,
        initConnection: initConnection,
        openConnection: openConnection,
        getSession: getSession,
        closeConnection: closeConnection

    }

});