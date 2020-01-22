angular.module('bigSQL.components').controller('ComponentsLogController', ['$scope', 'PubSubService', '$state','$interval','$location', '$window', '$rootScope', 'bamAjaxCall', 'pgcRestApiCall', '$cookies', '$sce', '$timeout', function ($scope, PubSubService, $state, $interval, $location, $window, $rootScope, bamAjaxCall, pgcRestApiCall, $cookies, $sce, $timeout) {

    var subscriptions = [];
    var count = 1;
    $scope.components = {};
    var autoScroll = true;
    $scope.logfile;
    $scope.intervalPromise = null;

    var session;
    var logviewer = angular.element( document.querySelector( '#logviewer' ) );
    $scope.allowedJobTypes = ['backup', 'restore', 'badger','pgadmin'];
    $scope.jobTypesMapping = {
        'backup':'Backup',
        'restore':'Restore',
        'badger':'Badger',
        'pgadmin':'PgAdmin'
    }
    $scope.logViewType = $location.path().split('/').pop(-1);
    if($scope.allowedJobTypes.indexOf($scope.logViewType) >= 0){
        $scope.log_id = $location.search().lid;
    }
    $rootScope.$on('sessionCreated', function () {
        var sessPromise = PubSubService.getSession();
        sessPromise.then(function (sessParam) {
            session = sessParam;
            $rootScope.$emit('topMenuEvent');
        });
    });

    var infoData = pgcRestApiCall.getCmdData('info')
    infoData.then(function(data) {
        $scope.pgcInfo = data[0];
    });

    var cookieVal = $cookies.get('selectedLog');
    if(cookieVal){
        $scope.selectComp = cookieVal;
    }else{
        $scope.selectComp = 'pgcli';
    }
    $scope.setTab = function (tabId) {
        $scope.tab = tabId;
    };

    $scope.isSet = function (tabId) {
        return $scope.tab === tabId;
    };

    $scope.selectedButton;

    $scope.selectButton = function(id) {
        $scope.selectedButton = id;
    }

    $scope.getLogfiles = function(){
        var sessionPromise = PubSubService.getSession();
        sessionPromise.then(function (val) {
            session = val;
            sessionActive();
            if ($scope.selectComp != 'pgcli'){
                session.call('com.bigsql.infoComponent',[$scope.selectComp]);
            } else {
                session.call('com.bigsql.selectedLog',[$scope.selectComp]);
            }
        });
    }

    function sessionActive(argument) {
        if(Object.keys(session._subscriptions).length < 5){    
        session.subscribe('com.bigsql.onInfoComponent', function (args) {
            var jsonD = JSON.parse(args[0][0]);
            if($scope.selectComp == jsonD[0].component){
                if(jsonD[0].current_logfile){
                    $scope.logfile = jsonD[0].current_logfile;
                }
                session.call('com.bigsql.selectedLog',[$scope.logfile]);
            }
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        session.subscribe("com.bigsql.pgcliDir", function (dir) {
            $scope.selectedLog = dir[0];
            $scope.$apply();
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        session.call('com.bigsql.checkLogdir');

        session.subscribe("com.bigsql.onCheckLogdir", function (components) {
            $scope.components = JSON.parse(components[0]);
            $scope.$apply();
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        session.subscribe("com.bigsql.log", function (lg) {
            //$scope.logFile = $sce.trustAsHtml(lg[0]);
            $scope.logFile = lg[0].split("<br/>");
            $timeout(function() {
              var scroller = document.getElementById("logviewer");
              scroller.scrollTop = scroller.scrollHeight;
            }, 0, false)
            $scope.$apply();
        }).then(function (subscription) {
            subscriptions.push(subscription);
        });

        session.subscribe("com.bigsql.logError", function (err) {
            $("#logviewer").empty();
            $("#logviewer").append("<h4><br />" + err[0] + "</h4>");
        }).then(function (sub) {
            subscriptions.push(sub);
        });
        }
    }

    if($scope.allowedJobTypes.indexOf($scope.logViewType) == -1){
        $scope.getLogfiles();
        $scope.tab = 1000;
    }
    else{
        $('#componentSelectBox').css("display","none");
        getBGStatus($scope.log_id, -1);
    }

    function getBGStatus(process_log_id, line_count){
        var args = {};
        if(line_count > 0){
            args['line_count'] = line_count;
        }
        var bgReportStatus = bamAjaxCall.getCmdData('bgprocess_status/'+ process_log_id,args);
        bgReportStatus.then(function (ret_data){
            $scope.logDir = ret_data.log_dir;
            $scope.procId = ret_data.pid;
            $scope.error_msg = '';
            $scope.procStartTime = new Date(ret_data.start_time.split('.')[0].replace(/-/gi,'/')+' UTC').toString();
            $scope.taskID = process_log_id;
            $scope.out_data = ret_data.out_data;
            $scope.logFile = ret_data.out_data.split("\n");
            $scope.process_type = ret_data.process_type;
            $scope.procCmd = ret_data.cmd;
            $scope.procExecTime = ret_data.execution_time;
            $scope.statusClass = "success-text";
            if($scope.procCmd){
                if($scope.procCmd.indexOf("pgc dbdump") != -1 || $scope.procCmd.indexOf("pgc dbrestore") != -1){
                    $scope.procCmd = "pgc " + $scope.procCmd.split("pgc ")[1];
                }
            }
            if (ret_data.process_completed){
                $scope.procCompleted = true;
                if(ret_data.process_failed){
                    $scope.statusClass = "fail-text";
                    $scope.procStatus = "Failed."
                    $scope.generatedFile = '';
                    $scope.generatedFileName = '';
                    $scope.error_msg = ret_data.error_msg;
                }else{
                    $scope.procStatus = "Completed."
                    $scope.generatedFile = ret_data.file;
                    $scope.generatedFileName = ret_data.report_file;
                }
                if(ret_data.end_time){
                    $scope.procEndTime = new Date(ret_data.end_time.split('.')[0].replace(/-/gi,'/')+' UTC').toString();
                }
            } else{
                $scope.statusClass = "running-text";
                $scope.procEndTime = '';
                $scope.generatedFile = '';
                $scope.generatedFileName = '';
                $scope.procCompleted = false;
                $scope.procStatus = "Running....";
                $scope.refreshConsole = setTimeout(function() {getBGStatus(process_log_id, line_count) },2000);
            }

            $timeout(function() {
              var scroller = document.getElementById("logviewer");
              scroller.scrollTop = scroller.scrollHeight;
            }, 0, false)

        });
    }

    $scope.isAutoScroll = function () {
        return autoScroll;
    }

    $scope.stopScrolling = function (event) {
        if (event.target.value == "checked"){
            event.target.value = "unchecked";
            $scope.checked = false;
            autoScroll = false;
        } else{
            event.target.value = "checked";
            autoScroll = true; 
        }      
    }

    function on_log(args) {
        $("#logviewer").append("<br />" + args[0]);
        if(autoScroll){
            tailScroll();
        }           
    };

    function tailScroll() {
        var height = $("#logviewer").get(0).scrollHeight;
        $("#logviewer").animate({
            scrollTop: height
        }, 5);
    };



    $scope.action = function (event) {
        if($scope.allowedJobTypes.indexOf($scope.logViewType) >= 0){
            getBGStatus($scope.log_id,event);
        }
        else{
            session.call('com.bigsql.logIntLines',[event, $scope.selectedLog]);
        }
    };

    $scope.onLogCompChange = function () {
        $cookies.put('selectedLog', $scope.selectComp);
        $scope.getLogfiles();
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
