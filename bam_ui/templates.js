//HEAD 
(function(module) {
try { app = angular.module("templates"); }
catch(err) { app = angular.module("templates", []); }
app.run(["$templateCache", function($templateCache) {
"use strict";

$templateCache.put("../app/components/components.html","<div ui-view=\"sub\"></div>")

$templateCache.put("../app/common/partials/hostInfo.html","<div class=\"components-update-title-wrapper\">\n" +
    "    <h1 style=\"float:left; display: inline; padding-right: 10px;\"><strong>{{ title }}</strong></h1>\n" +
    "    <form class=\"form form-inline \">\n" +
    "            <select class=\"form-control\" ng-change=\"hostChange(selecthost)\" ng-model=\"selecthost\">\n" +
    "            <option ng-repeat=\"host in hosts\" value=\"{{ host.host }}\">{{ host.host }}</option> </select>\n" +
    "        </form>\n" +
    "    <h3 class=\"pull-left\">\n" +
    "        <strong> OS </strong> : {{ data.os }} \n" +
    "        <strong>HW </strong>: {{ data.mem }} GB, {{ data.cores }} x {{ data.cpu }} \n" +
    "        <strong>PGC</strong> : {{ data.version }}\n" +
    "    </h3>\n" +
    "</div>\n" +
    "")

$templateCache.put("../app/components/partials/addHostModal.html","<div class=\"modal-header\">\n" +
    "    <h4 ng-if=\"!thirdPhase\" class=\"modal-title\"> {{type}} PGC SSH Server (beta)</h4>\n" +
    "    <h4 ng-if=\"thirdPhase\" class=\"modal-title\"> {{type}} PGC Server (beta)</h4>\n" +
    "</div>\n" +
    "<div class=\"modal-body\">\n" +
    "\n" +
    "    <div ng-if=\"tryToConnect\">\n" +
    "        <i class=\"fa fa-spinner fa-pulse fa-2x\"></i> &nbsp;<strong> Trying to connect {{hostName}} </strong>\n" +
    "    </div>\n" +
    "    <div ng-if=\"installingStatus\">\n" +
    "        <i class=\"fa fa-spinner fa-pulse fa-2x\"></i> &nbsp;<strong> Installing {{selectedPgComp.component}} on {{hostName}} </strong>\n" +
    "    </div>\n" +
    "    <div ng-if=\"connectionStatus\">\n" +
    "        <i class=\"fa fa-spinner fa-pulse fa-2x\"></i> &nbsp;<strong>{{message}} </strong>\n" +
    "    </div>\n" +
    "    <div ng-if=\"connectionError\">\n" +
    "        <strong>{{message}}</strong>\n" +
    "    </div>\n" +
    "    <div ng-hide=\"tryToConnect || connectionStatus || installingStatus\">\n" +
    "        <form>\n" +
    "            <div class=\"form-group\" ng-show=\"firstPhase\">\n" +
    "                <div class=\"requiredSymbol\">*</div>\n" +
    "                <input type=\"text\" ng-model=\"hostName\" class=\"form-control\" placeholder=\"Host\">\n" +
    "            </div>\n" +
    "            <div class=\"form-group\" ng-show=\"firstPhase\">\n" +
    "                <div class=\"requiredSymbol\">*</div>\n" +
    "                <input type=\"text\" ng-model=\"connectionName\" class=\"form-control\" placeholder=\"Connection name\">\n" +
    "            </div>\n" +
    "            <div class=\"form-group\" ng-show=\"firstPhase\">\n" +
    "                <div class=\"requiredSymbol\">*</div>\n" +
    "                <input type=\"text\" ng-model=\"userName\" class=\"form-control\" placeholder=\"Username\">\n" +
    "            </div>\n" +
    "            <div class=\"form-group\" ng-show=\"firstPhase\">\n" +
    "                <input type=\"password\" ng-model=\"password\" class=\"form-control\" placeholder=\"password\">\n" +
    "            </div>\n" +
    "            <div class=\"form-group row\" ng-show=\"secondPhase\">\n" +
    "                <label class=\"col-sm-4 col-form-label\">Service User</label>\n" +
    "                <div class=\"col-sm-8\">\n" +
    "                    <input type=\"text\" ng-model=\"serviceUser\" class=\"form-control\">\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"form-group row\" ng-show=\"secondPhase\">\n" +
    "                <label class=\"col-sm-4 col-form-label\">PGC_HOME Directory</label>\n" +
    "                <div class=\"col-sm-8\">\n" +
    "                    <input type=\"text\" ng-model=\"pgcDir\" class=\"form-control\">\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <br />\n" +
    "            <div class=\"form-group row\" ng-show=\"thirdPhase\">\n" +
    "                <label class=\"col-sm-4 col-form-label\">Install PG</label>\n" +
    "                <div class=\"col-sm-8\">\n" +
    "                    <input type=\"checkbox\" ng-model=\"pgInstall\">\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"form-group row\" ng-show=\"thirdPhase\">\n" +
    "                <label class=\"col-sm-4 col-form-label\">Select PG version</label>\n" +
    "                <div class=\"col-sm-8\">\n" +
    "                    <select class=\"form-control\" name=\"selectPg\" ng-disabled=\"!pgInstall\" ng-model=\"selectedPgComp\" ng-options=\"option.component for option in availablePgComps\">\n" +
    "                    </select>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"form-group row\" ng-show=\"thirdPhase\">\n" +
    "                <label class=\"col-sm-4 col-form-label\">Auto Start</label>\n" +
    "                <div class=\"col-sm-8\">\n" +
    "                    <input type=\"checkbox\" ng-model=\"autostart\" ng-disabled=\"!isSudo\" ng-change=\"autostartChange(autostart)\" />\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"text-left\" ng-show=\"firstPhase\">\n" +
    "                <span style=\"color:red;\">*</span> Required Field\n" +
    "            </div>\n" +
    "            <div class=\"form-actions\">\n" +
    "                <div class=\"text-right\">\n" +
    "                    <button class=\"btn btn-default\" type=\"button\" ng-click=\"cancel(); refreshHostManager()\">Cancel</button>\n" +
    "                    <button class=\"btn btn-default\" type=\"button\" ng-show=\"secondPhase\" ng-click=\"back()\">Back</button>\n" +
    "                    <button ng-show=\"!secondPhase\" class=\"btn btn-default\" type=\"button\" ng-click=\"next()\" ng-disabled=\"!(hostName && userName && connectionName && connectionName) || (!pgInstall && thirdPhase) \">Next</button>\n" +
    "                    <button ng-show=\"secondPhase\" class=\"btn btn-default\" type=\"button\" ng-click=\"addHost(hostName, pgcDir, userName, password, connectionName)\">Create</button>\n" +
    "                    <!-- <button type=\"submit\" ng-show=\"secondPhase\" class=\"btn btn-primary\" ng-disabled=\"!(hostName && pgcDir && userName && password && connectionName)\" ng-click=\"addHost(hostName, pgcDir, userName, password, connectionName)\">Save</button> -->\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </form>\n" +
    "    </div>\n" +
    "</div>")

$templateCache.put("../app/components/partials/addServerGroupsModal.html","<div class=\"modal-header\">\n" +
    "    <h4 class=\"modal-title\"> {{type}} Group (beta)</h4>\n" +
    "</div>\n" +
    "<div class=\"modal-body\">\n" +
    "\n" +
    "    <div ng-if=\"tryToConnect\">\n" +
    "        <i class=\"fa fa-spinner fa-pulse fa-2x\"></i> &nbsp;<strong> Trying to connect {{hostName}} </strong>\n" +
    "    </div>\n" +
    "    <div ng-show=\"CreatingGroup\">\n" +
    "        <i class=\"fa fa-spinner fa-pulse fa-2x\"></i> &nbsp;<strong>{{message}} </strong>\n" +
    "    </div>\n" +
    "    <div ng-if=\"status\">\n" +
    "        <strong>{{message}}</strong>\n" +
    "    </div>\n" +
    "    <div ng-hide=\"CreatingGroup\">\n" +
    "        <form>\n" +
    "            <div class=\"form-group\">\n" +
    "                <div class=\"requiredSymbol\">*</div>\n" +
    "                <input type=\"text\" ng-model=\"name\" class=\"form-control\" placeholder=\"Name\">\n" +
    "            </div>\n" +
    "            <div class=\"form-group\">\n" +
    "                <input type=\"text\" ng-model=\"desc\" class=\"form-control\" placeholder=\"Description\">\n" +
    "            </div>\n" +
    "            <br />\n" +
    "            <h4 class=\"modal-title\">Add Remote Servers to Group</h4>\n" +
    "            <br />\n" +
    "            <div class=\"form-group col-md-12\">\n" +
    "                <div class=\"col-md-5\">\n" +
    "                    <strong>Available Servers</strong>\n" +
    "                    <select style=\"width: 100%; height: 150px\" ng-model=\"selectedServers\" multiple>\n" +
    "                        <option ng-repeat=\"server in availableServers\" value=\"{{ server }}\">{{ server.host }}</option>\n" +
    "                    </select>\n" +
    "                </div>\n" +
    "                <div class=\"col-md-2\">\n" +
    "                    <div style=\"margin-left: 15px; margin-top: 15px\" >\n" +
    "                        <i class=\"fa fa-caret-right fa-5x\" aria-hidden=\"true\" ng-click=\"addToGroup(selectedServers)\"></i>\n" +
    "                    </div>\n" +
    "                    <div style=\"margin-left: 20px; margin-top: -25px\" >\n" +
    "                        <i class=\"fa fa-caret-left fa-5x\" aria-hidden=\"true\" ng-click=\"removeFromGroup(deselectServers)\"></i>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "                <div class=\"col-md-5\">\n" +
    "                    <strong>Group Servers</strong>\n" +
    "                    <select style=\"width: 100%; height: 150px\" ng-model=\"deselectServers\" multiple>\n" +
    "                        <option ng-repeat=\"server in groupServers\" value=\"{{server}}\"> \n" +
    "                        {{server.host}}\n" +
    "                        </option>\n" +
    "                    </select>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"text-left\">\n" +
    "                <span style=\"color:red;\">*</span> Required Field\n" +
    "            </div>\n" +
    "            <div class=\"form-actions\">\n" +
    "                <div class=\"text-right\">\n" +
    "                    <button class=\"btn btn-warning\" type=\"button\" ng-click=\"cancel()\">Cancel</button>\n" +
    "                    <button type=\"submit\" class=\"btn btn-primary\" ng-if=\"type != 'Edit'\" ng-disabled=\"!name\" ng-click=\"addServerGroup(name)\">Save</button>\n" +
    "                    <button type=\"submit\" class=\"btn btn-primary\" ng-if=\"type == 'Edit'\" ng-disabled=\"!name\" ng-click=\"updateServerGroup(name)\">Update</button>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </form>\n" +
    "    </div>\n" +
    "</div>")

$templateCache.put("../app/components/partials/badger.html","<section class=\"content-header\">\n" +
    "    <h1 class=\"components-update-title-wrapper\">\n" +
    "        pgBadger Console\n" +
    "    </h1>\n" +
    "</section>\n" +
    "\n" +
    "<section class=\"content\">\n" +
    "    <uib-alert ng-repeat=\"alert in alerts\" type=\"{{alert.type}}\" close=\"closeAlert()\" class=\"uib-text\">\n" +
    "        {{alert.msg}}  \n" +
    "        <a ng-click=\"openDetailsModal()\" ng-if=\"!alert.pgComp\">Click here to install</a> \n" +
    "        <a ui-sref=\"components.view\" ng-if=\"alert.pgComp\">Click here to install</a>\n" +
    "    </uib-alert>\n" +
    "     <div class=\"row\">\n" +
    "    <div class=\"col-md-6 col-sm-6 col-xs-12\">\n" +
    "        <div class=\"box\">\n" +
    "            <div class=\"box-header with-border\">\n" +
    "                <div class=\"col-md-12\">\n" +
    "                    <strong class=\"pull-left\"> Settings</strong>\n" +
    "                    <a class=\"pull-right\" ng-click=\"openDetailsModal()\">About pgBadger</a>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"box-body\">\n" +
    "                <form class=\"form plProfiler-form\">\n" +
    "                    <div class=\"form-group\">\n" +
    "                        <div class=\"col-md-3 col-sm-3 col-xs-3\">\n" +
    "                            <select class=\"form-control\" id=\"logComponents\" ng-model=\"selectComp\" ng-change=\"onSelectChange(selectComp)\">\n" +
    "                                <option value=\"\">Select DB</option>\n" +
    "                                <option value=\"{{c.component}}\" ng-repeat=\"c in components\">{{c.component}}</option>\n" +
    "                            </select>\n" +
    "                            <span class=\"required-pgbadger-form\">*</span>\n" +
    "                        </div>\n" +
    "                        <div class=\"col-md-4 col-sm-4 col-xs-4\">\n" +
    "                            <button class=\"btn btn-default pull-right\" ng-click=\"openSwitchlog()\" ng-disabled=\"disableLog || selectComp == 'pg93' || selectComp == 'pg92'\">Switch log file</button>\n" +
    "                        </div>\n" +
    "                        <div class=\"col-md-5 col-sm-5 col-xs-5\">\n" +
    "                            <button class=\"btn btn-default pull-right\" ng-click=\"openLoggingParam()\" ng-disabled=\"disableLog || selectComp == 'pg93' || selectComp == 'pg92'\">\n" +
    "                            Change logging parameters\n" +
    "                            </button>\n" +
    "                        </div>\n" +
    "                        <br />\n" +
    "                        <br />\n" +
    "                    </div>\n" +
    "                    <div class=\"col-md-12\">\n" +
    "                        <div class=\"form-group\">\n" +
    "                            <input type=\"text\" ng-model=\"logDir\" class=\"form-control\" placeholder=\"Log Dir\" ng-disabled=\"true\">\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    <div class=\"col-md-12\">\n" +
    "                        <div class=\"form-group\">\n" +
    "                            <div class=\"pull-left\"> Select log files &nbsp;<span class=\"required-symbol\">*</span> </div>\n" +
    "                            <div class=\"pull-right\" ng-click=\"refreshLogfiles(selectComp)\"> <i class=\"fa fa-refresh fa-fw\"></i></div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    <div class=\"col-md-12\">\n" +
    "                        <div class=\"form-group\">\n" +
    "                            <div class=\"pg-badger-select-log\" ng-model=\"selectLog\">\n" +
    "                                <div ng-if=\"refreshMsg\"><i class=\"fa fa-refresh fa-spin fa-fw\"></i>Refreshing..</div>\n" +
    "                                <div ng-repeat=\"c in logfiles\" ng-if=\"!refreshMsg && selectComp\">\n" +
    "                                    <label>\n" +
    "                                        <input type=\"checkbox\" name=\"selectLog\" ng-model=\"c.selected\" ng-change=\"logFileChecked()\" value=\"{{c.log_file}}; {{c.file_size}}\">\n" +
    "                                        <span>&nbsp;{{c.file}}</span>\n" +
    "                                    </label>\n" +
    "                                    <span class=\"pull-right\">{{c.file_size}}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{c.mtime}}</span>\n" +
    "                                </div>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    <div class=\"text-left col-md-12\">\n" +
    "                        <span class=\"required-symbol\">*</span> Required Field\n" +
    "                    </div>\n" +
    "                    \n" +
    "                </form>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div class=\"box\">\n" +
    "            <div class=\"box-body\">\n" +
    "                <form>\n" +
    "                    <div class=\"col-md-12\">\n" +
    "                        <div class=\"form-group\">\n" +
    "                            <input type=\"text\" ng-model=\"pgTitle\"  class=\"form-control\" placeholder=\"Badger Title\">\n" +
    "\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    <div class=\"col-md-12\">\n" +
    "                        <div class=\"form-group\">\n" +
    "                            <input type=\"text\" ng-model=\"pgJobs\"  class=\"form-control\" placeholder=\"Number of jobs\">\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    <div class=\"col-md-12\">\n" +
    "                        <div class=\"form-actions\">\n" +
    "                            <div class=\"text-right\">\n" +
    "                                <button type=\"submit\" class=\"btn btn-primary\"\n" +
    "                                        ng-disabled=\"generatingReportSpinner || disableGenrate || !selectComp || !selectedLog\"\n" +
    "                                        ng-click=\"openGenerateModal()\">Generate\n" +
    "                                </button>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </form>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"col-md-6 col-sm-6 col-xs-12\">\n" +
    "        <div class=\"box\" ng-if=\"showReports\">\n" +
    "            <div class=\"box-header with-border\">\n" +
    "                <span style=\"margin-left: 13px;\"><label>Reports</label> &nbsp; &nbsp;<input type=\"checkbox\" ng-click=\"toggleAll()\" ng-model=\"isAllSelected\">&nbsp;Select all </span>\n" +
    "                <span class=\"pull-right\"><label>Created on</label></span>\n" +
    "            </div>\n" +
    "            <div class=\"box-body\" style=\"padding-left: 20px; height: 404px; overflow: auto;\">\n" +
    "                <div ng-repeat = \"option in files_list\">\n" +
    "                    <label>\n" +
    "                    <input type=\"checkbox\" ng-model=\"option.selected\" ng-change=\"optionToggled()\">\n" +
    "                    <span>&nbsp;{{ option.file }}</span>\n" +
    "                    </label>\n" +
    "                    &nbsp;&nbsp;<a target=\"_blank\" href=\"{{ option.file_link }}\"><i class=\"fa fa-external-link\"></i></a>\n" +
    "                    <span class=\"pull-right\">{{ option.mtime }}</span>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"box-footer\">\n" +
    "            <button class=\"btn btn-default pull-right\" ng-disabled=\"!isAllSelected && !checked\" ng-click=\"deleteReports(files_list, false)\">Delete</button>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    " </div>\n" +
    "</section>")

$templateCache.put("../app/components/partials/confirmDeletionModal.html","<div class=\"modal-header\">\n" +
    "    <!-- <div ng-click=\"cancel()\" class=\"close-modal pull-right\" data-dismiss=\"modal\" aria-hidden=\"true\">\n" +
    "        <i class=\"fa fa-lg fa-close\"></i>\n" +
    "    </div> -->\n" +
    "</div>\n" +
    "<div class=\"modal-body\">\n" +
    "<form class=\"form plProfiler-form\">\n" +
    "    <div class=\"form-group\">\n" +
    "        Are you sure want to delete selected {{deleteFilesLength}} file(s)?\n" +
    "    </div>\n" +
    "</form>\n" +
    "</div>\n" +
    "<div class=\"modal-footer\">\n" +
    "    <button class=\"btn btn-danger\" type=\"button\" ng-click=\"cancel()\">No</button>\n" +
    "    <button type=\"submit\" class=\"btn btn-success\" ng-click=\"removeReports()\">Yes</button>\n" +
    "</div>")

$templateCache.put("../app/components/partials/details.html","<!-- Main content -->\n" +
    "<div class=\"modal-body\">\n" +
    "    <div ng-click=\"cancel()\" class=\"close-modal pull-right\" data-dismiss=\"modal\" aria-hidden=\"true\">\n" +
    "        <i class=\"fa fa-lg fa-close\"></i>\n" +
    "    </div>\n" +
    "    <div class=\"details-modal\" ng-if=\"!loading\">\n" +
    "        <h4 ng-if=\"component.component != 'pgdevops'\">Component Details</h4>\n" +
    "        <h4 ng-if=\"component.component == 'pgdevops'\">&nbsp;</h4>\n" +
    "        <!-- <server-info-details title=\"Component Details\"></server-info-details> -->\n" +
    "    </div>\n" +
    "        <div class=\"uib-text\">\n" +
    "            <div uib-alert ng-repeat=\"alert in alerts\" type=\"{{alert.type}}\" close=\"closeAlert()\" dismiss-on-timeout=\"8000\">\n" +
    "                {{alert.msg }} \n" +
    "            </div>\n" +
    "            <uib-alert ng-repeat=\"alert in startAlert\" type=\"{{startAlert.type}}\" close=\"closeAlert()\">\n" +
    "                {{alert.msg }} <button class=\"btn btn-default btn-sm\" ng-click=\"compAction('install'); closeAlert()\" >Yes</button> <button class=\"btn btn-default btn-sm\" ng-click=\"closeAlert()\">No</button>\n" +
    "            </uib-alert>\n" +
    "        </div>    \n" +
    "        <div ng-if=\"loading\" style=\"text-align: center;\">\n" +
    "            <i class=\"fa fa-cog fa-spin fa-5x fa-fw margin-bottom\"></i>\n" +
    "        </div>\n" +
    "        <div class=\"row\">\n" +
    "        <div class=\"col-md-4 col-xs-4 col-sm-12\">\n" +
    "            <!-- Profile Image -->\n" +
    "            <div class=\"box box-primary\" ng-if=\"!loading\">\n" +
    "                <div class=\"box-body box-profile\">\n" +
    "                    <img class=\"comp-img ext-img img-responsive\" ng-if=\"component.category != '2'\" id=\"component-logo\" ng-src=\"assets/img/component-logos/{{ component.component }}.png\"  err-src=\"assets/img/component-logos/no_img.png\" alt=\"\">\n" +
    "                    <img class=\"comp-img ext-img img-responsive\" ng-if=\"component.category == '2'\" id=\"component-logo\" ng-src=\"assets/img/component-logos/{{ component.componentImage }}.png\"  err-src=\"assets/img/component-logos/no_img.png\" alt=\"\">\n" +
    "                    <!-- <h3 class=\"profile-username text-center\" ng-bind=\"component.disp_name\" id=\"comp_name\"></h3> -->\n" +
    "                    <div class=\"description-style\">\n" +
    "                            <h5 style=\"margin-bottom: 4px;\">\n" +
    "                                <a>{{component.disp_name}}</a>\n" +
    "                            </h5>\n" +
    "                            <i style=\"font-size: small;\">{{component.release_desc}}</i>\n" +
    "                        </div>\n" +
    "                    <ul class=\"list-group list-group-unbordered\" id=\"comp_details\">\n" +
    "                        <li class=\"list-group-item\" ng-show=\"component.version != '' && component.version != undefined && component.component !='pgdevops'\">\n" +
    "                            <span class=\"pull-left\"><b>Version</b></span> <span class=\"pull-right\" ng-bind=\"component.version\" id=\"comp_version\"></span>\n" +
    "                        </li>\n" +
    "                        <li class=\"list-group-item\" ng-show=\"component.version != '' && component.version != undefined && component.component =='pgdevops'\">\n" +
    "                            <span class=\"pull-left\"><b>Install Version</b></span> <span class=\"pull-right\" ng-bind=\"component.version\" id=\"comp_version\"></span>\n" +
    "                        </li>\n" +
    "                        <li class=\"list-group-item\" ng-show=\"component.home_url != '' && component.home_url != undefined || component.doc_url != '' && component.doc_url != undefined\">\n" +
    "                            <span class=\"pull-left\"><a ng-show=\"component.home_url != ''\" href=\"{{component.home_url}}\" target='_blank'> Homepage <i class=\"fa fa-external-link\"></i> </a></span> <span class=\"pull-right\"> <a ng-show=\"component.doc_url != ''\" href=\"{{component.doc_url}}\" target='_blank'> Documentation <i class=\"fa fa-external-link\"></i> </a> </span>\n" +
    "                        </li>\n" +
    "                        <li class=\"list-group-item\" id=\"li-pointer\" ng-show=\"component.release_date && component.is_installed != 1 \">\n" +
    "                            <span class=\"pull-left\"><b>Release Date</b></span> <span class=\"pull-right\" ng-bind=\"component.release_date\" id=\"dt_added\"></span>\n" +
    "                        </li>\n" +
    "                        <li class=\"list-group-item\" id=\"li-pointer\" ng-show=\"component.install_date\">\n" +
    "                            <span class=\"pull-left\"><b>Install Date</b></span> <span class=\"pull-right\" ng-bind=\"component.install_date\"></span>\n" +
    "                        </li>\n" +
    "                        <li class=\"list-group-item\" ng-show=\"component.port != '' && component.port != undefined && component.port != 0 && component.port != 1 && component.component != 'pgdevops'\">\n" +
    "                            <span class=\"pull-left\"><b>Port</b></span> <span class=\"pull-right\" ng-bind=\"component.port\"></span>\n" +
    "                        </li>\n" +
    "                        <li class=\"list-group-item\" ng-show=\"component.up_time != '' && component.up_time != undefined\">\n" +
    "                            <span class=\"pull-left\"><b>Uptime</b></span> <span class=\"pull-right\" ng-bind=\"component.up_time\"></span>\n" +
    "                        </li>\n" +
    "                        <li class=\"list-group-item\" ng-show=\"component.connections != '' && component.connections != undefined\">\n" +
    "                            <span class=\"pull-left\"><b>Connections</b></span>\n" +
    "                            <a class=\"pull-right\" ng-bind=\"component.connections\" id=\"home_url\"></a>\n" +
    "                        </li>\n" +
    "                        <li class=\"list-group-item\" ng-show=\"component.datadir != '' && component.datadir != undefined && component.component != 'pgdevops'\">\n" +
    "                            <span class=\"pull-left\"><b>Data Dir</b></span>\n" +
    "                            <span class=\"pull-right\" ng-bind=\"component.datadir\" id=\"comp_doc\"></span>\n" +
    "                        </li>\n" +
    "                        <li class=\"list-group-item\" id=\"li-pointer\" ng-show=\"component.logdir != '' && component.logdir != undefined\">\n" +
    "                            <span class=\"pull-left\"><b>Log Dir</b></span>\n" +
    "                            <span href=\"{{component.logdir}}\" class=\"pull-right\" ng-bind=\"component.logdir\" id=\"dt_added\"></span>\n" +
    "                        </li>\n" +
    "                        <li class=\"list-group-item\" id=\"li-pointer\" ng-show=\"component.data_size != '' && component.data_size != undefined\">\n" +
    "                            <span class=\"pull-left\"><b>Data Size</b></span>\n" +
    "                            <a class=\"pull-right\" ng-bind=\"component.data_size\" id=\"dt_added\"></a>\n" +
    "                        </li>\n" +
    "                        <li class=\"list-group-item\" id=\"li-pointer\" ng-show=\"component.release_date && component.component == 'pgdevops' && component.current_version \">\n" +
    "                            <span class=\"pull-left\"><b>Upgrade Version</b></span> <span class=\"pull-right\" ng-bind=\"component.current_version\" id=\"dt_added\"></span>\n" +
    "                        </li>\n" +
    "                        <li class=\"list-group-item\" id=\"li-pointer\" ng-show=\"component.release_date && component.component == 'pgdevops' && component.current_version \">\n" +
    "                            <span class=\"pull-left\"><b>Release Date</b></span> <span class=\"pull-right\" ng-bind=\"component.release_date\" id=\"dt_added\"></span>\n" +
    "                        </li>\n" +
    "                        <li class=\"list-group-item\" id=\"li-pointer\" ng-show=\"component.status != '' && component.status != undefined && component.port != 1 &&  component.component != 'pgdevops'\">\n" +
    "                            <span class=\"pull-left\"><b>State</b></span>\n" +
    "                            <span class=\"pull-right\" style=\"margin-top: -4px;\"><i ng-class=\"statusColors[component.status]\" class=\"fa fa-stop fa-2x\"></i>\n" +
    "                                <div style=\"margin-left: 30px; margin-top: -24px;\"> {{component.status}}</div>\n" +
    "                            </span>\n" +
    "                        </li>\n" +
    "                    </ul>\n" +
    "                    <div id=\"button-act\" ng-click=\"action($event)\" ng-if=\"component.component != 'pgdevops'\">\n" +
    "                        <a ng-show=\"component.status == undefined && component.is_installed == 0\" action=\"install\" class=\"btn btn-default\" ng-disabled=\" component.installation != undefined\">Install</a>\n" +
    "                        <a ng-show=\"component.status == 'Stopped' && component.port != 1\" action=\"start\" class=\"btn btn-default\" ng-disabled=\" component.spinner != undefined\">Start</a>\n" +
    "                        <a ng-if=\"component.current_version\" action=\"update\" class=\"btn btn-warning\" ng-disabled=\" component.spinner != undefined\">Update v{{component.current_version}}</a>\n" +
    "                        <a ng-show=\"(component.status == 'Stopped' && component.is_installed) || (component.is_installed == 1 && component.status == undefined)\" action=\"remove\" class=\"btn btn-default\" ng-disabled=\" component.spinner != undefined\">Remove</a>\n" +
    "                        <div ng-show=\"component.status == 'NotInitialized'\">\n" +
    "                            <a class=\"btn btn-danger\" action=\"init\" ng-disabled=\" component.spinner != undefined\">Initialize</a>\n" +
    "                            <a class=\"btn btn-warning\" action=\"remove\" ng-disabled=\" component.spinner != undefined\">Remove</a>\n" +
    "                        </div>\n" +
    "                        <div ng-show=\"component.status == 'Running'\">\n" +
    "                            <a class=\"btn btn-default\" action=\"stop\" ng-disabled=\" component.spinner != undefined\">Stop</a>\n" +
    "                            <a class=\"btn btn-default\" action=\"restart\" ng-disabled=\" component.spinner != undefined\">Restart</a>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    <br />\n" +
    "                    <div id=\"dep_stats\">\n" +
    "                        <div ng-show=\"component.installation != undefined || component.spinner \" style=\"width:100%;height:auto;\">\n" +
    "                            <div>\n" +
    "                                <span ng-show=\"component.spinner\"><i class='fa fa-spinner fa-2x  fa-pulse'></i> <b>{{component.spinner}}</b></span>\n" +
    "                                <div style=\"margin-left:10px;margin-top:20px\" ng-show=\"component.installationDependents != undefined\"><i class=\"fa fa-refresh fa-spin\" style='margin-right:2px'></i><b> Installing dependencies...</b></div>\n" +
    "                                <br />\n" +
    "                                <div style=\"margin-left:10px;margin-top:-10px\" ng-show=\"component.installationStart.status =='start' && component.installationStart.state == 'unpack'\"><i class=\"fa fa-circle-o-notch fa-spin\" style='margin-right:2px'></i><b> Unpacking </b></div>\n" +
    "                                <div style=\"margin-left:10px;margin-top:20px\" ng-show=\"component.installationStart.status =='start' && component.installationStart.state == 'download'\"><i class=\"fa fa-circle-o-notch fa-spin\" style='margin-right:2px'></i><b> Downloading </b></div>\n" +
    "                                </br>\n" +
    "                                <div ng-show=\"component.installationRunning != undefined\" class=\"col-md-4 col-xs-4\">\n" +
    "                                    file:<br \\>{{component.installationStart.file}}\n" +
    "                                </div>\n" +
    "                                <div class=\"col-md-4 col-xs-4\" ng-show=\"component.installationRunning != undefined\">\n" +
    "                                    <progressbar value=\"component.progress\"></progressbar>\n" +
    "                                    <button class=\"btn btn-default btn-xs center-block\" ng-click=\"cancelInstallation('cancelInstall') \" style=\"margin-top: 5px;\">Cancel</button>\n" +
    "                                </div>\n" +
    "                                <div class=\"col-md-2 col-xs-2\" ng-show=\"component.installationRunning != undefined\">\n" +
    "                                    {{component.installationRunning.pct}}%\n" +
    "                                </div>\n" +
    "                                <div class=\"col-md-2 col-xs-2\" ng-show=\"component.installationRunning != undefined\">\n" +
    "                                    {{component.installationRunning.mb}}\n" +
    "                                </div>\n" +
    "                                \n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    <div id=\"stats\">\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "                <!-- /.box-body -->\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div class=\"col-md-8 col-xs-8 col-sm-12\" ng-if=\"!loading\">\n" +
    "            <uib-tabset>\n" +
    "                <uib-tab heading=\"Release Notes\" class=\"details-page-tab\" select=\"tabClick($event)\">\n" +
    "                    <div class=\"col-md-12 details-relnotes\">\n" +
    "                        <span class=\"details-page-relnotes\" ng-bind-html=\"rel_notes\"></span>\n" +
    "                    </div>\n" +
    "                </uib-tab>\n" +
    "                <uib-tab heading=\"Upgrade Instructions\" class=\"details-page-tab\" ng-if=\"component.component == 'pgdevops' && component.current_version\" active=\"true\">\n" +
    "                    <div class=\"col-md-12 details-relnotes\">\n" +
    "                        <div ng-if=\"os != 'Windows'\">\n" +
    "                            <h3></h3>\n" +
    "                            <ul>\n" +
    "                                <li>\n" +
    "                                    <p>Open a terminal window. </p>\n" +
    "                                </li>\n" +
    "                                <li>\n" +
    "                                    <p>Go to the installation directory </p>\n" +
    "                                    <p style=\"font-family: monospace;\">cd {{PGC_HOME}}</p>\n" +
    "                                </li>\n" +
    "                                <li>\n" +
    "                                    <p>Get the latest update related information</p>\n" +
    "                                    <p style=\"font-family: monospace;\">./pgc update</p>\n" +
    "                                </li>\n" +
    "                                <li>\n" +
    "                                    <p>Upgrade pgDevOps using the following command </p>\n" +
    "                                    <p style=\"font-family: monospace;\">./pgc upgrade pgdevops</p>\n" +
    "                                    <p style=\"font-style: italic;\">The above command may take a couple of minutes based on the speed of the system and network. It shuts down the pgDevOps service, upgrades pgDevOps, and starts the service again.</p>\n" +
    "                                </li>\n" +
    "                                <li>\n" +
    "                                    <p>Verify status of the pgDevOps service</p>\n" +
    "                                    <p style=\"font-family: monospace;\">&nbsp; ./pgc status pgdevops</p>\n" +
    "                                    <div class=\"well\">\n" +
    "                                        <strong><i class=\"fa fa-lightbulb-o fa-lg\" aria-hidden=\"true\"> &nbsp;</i>Other commands you might find useful</strong>\n" +
    "                                        <br />\n" +
    "                                        <br />\n" +
    "                                        <ul>\n" +
    "                                            <li>\n" +
    "                                            <p>Start pgDevOps</p>\n" +
    "                                            <p style=\"font-family: monospace;\">&nbsp; ./pgc start pgdevops</p>\n" +
    "                                            </li>\n" +
    "                                            <li>\n" +
    "                                            <p>Stop pgDevOps</p>\n" +
    "                                            <p style=\"font-family: monospace;\">&nbsp; ./pgc stop pgdevops</p>\n" +
    "                                            </li>\n" +
    "                                            <li>\n" +
    "                                            <p>Restart pgDevOps</p>\n" +
    "                                            <p style=\"font-family: monospace;\">&nbsp; ./pgc restart pgdevops</p>\n" +
    "                                            </li>\n" +
    "                                        </ul>\n" +
    "                                    </div>\n" +
    "                                </li>\n" +
    "                            </ul>\n" +
    "                        </div>\n" +
    "                        <div ng-if=\"os == 'Windows'\">\n" +
    "                            <h3></h3>\n" +
    "                            <ul>\n" +
    "                                <li>\n" +
    "                                    <p>Open a command prompt as administrator.</p>\n" +
    "                                    <img src=\"assets/img/component-logos/runAsAdmin.png\">\n" +
    "                                </li>\n" +
    "                                <li>\n" +
    "                                    <p>Go to the installation directory</p>\n" +
    "                                    <p style=\"font-family: monospace;\">cd {{PGC_HOME}}</p>\n" +
    "                                </li>\n" +
    "                                <li>\n" +
    "                                    <p>Get the latest update related information</p>\n" +
    "                                    <p style=\"font-family: monospace;\">pgc update</p>\n" +
    "                                </li>\n" +
    "                                <li>\n" +
    "                                    <p>Upgrade pgDevOps using the following command </p>\n" +
    "                                    <p style=\"font-family: monospace;\">pgc upgrade pgdevops</p>\n" +
    "                                    <p style=\"font-style: italic;\">The above command may take a couple of minutes based on the speed of the system and network. It shuts down the pgDevOps service, upgrades pgDevOps, and starts the service again.</p>\n" +
    "                                </li>\n" +
    "                                <li>\n" +
    "                                    <p>Verify status of the pgDevOps service</p>\n" +
    "                                    <p style=\"font-family: monospace;\">&nbsp; pgc status pgdevops</p>\n" +
    "                                    <div class=\"well\">\n" +
    "                                        <strong><i class=\"fa fa-lightbulb-o fa-lg\" aria-hidden=\"true\"> &nbsp;</i>Other commands you might find useful</strong>\n" +
    "                                        <br />\n" +
    "                                        <br />\n" +
    "                                        <ul>\n" +
    "                                            <li>\n" +
    "                                            <p>Start pgDevOps</p>\n" +
    "                                            <p style=\"font-family: monospace;\">&nbsp; pgc start pgdevops</p>\n" +
    "                                            </li>\n" +
    "                                            <li>\n" +
    "                                            <p>Stop pgDevOps</p>\n" +
    "                                            <p style=\"font-family: monospace;\">&nbsp; pgc stop pgdevops</p>\n" +
    "                                            </li>\n" +
    "                                            <li>\n" +
    "                                            <p>Restart pgDevOps</p>\n" +
    "                                            <p style=\"font-family: monospace;\">&nbsp; pgc restart pgdevops</p>\n" +
    "                                            </li>\n" +
    "                                        </ul>\n" +
    "                                    </div>\n" +
    "                                </li>\n" +
    "                            </ul>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </uib-tab>\n" +
    "            </uib-tabset>\n" +
    "        </div>\n" +
    "        <!-- <div class=\"col-sm-offset-11 col-sm-11\" style=\"padding: 10px\">\n" +
    "            <button class=\"btn btn-warning\" type=\"button\" ng-click=\"cancel()\">Cancel</button>\n" +
    "        </div> -->\n" +
    "</div>")

$templateCache.put("../app/components/partials/detailspg95.html","<!-- Content Header (Page header) -->\n" +
    "<section class=\"content-header\">\n" +
    "    <server-info-details title=\"Component Details\"></server-info-details>\n" +
    "\n" +
    "</section>\n" +
    "<uib-alert ng-repeat=\"alert in alerts\" type=\"{{alert.type}}\" dismiss-on-timeout=\"8000\" close=\"closeAlert()\" class=\"uib-text\">{{alert.msg}}</uib-alert>\n" +
    "<!-- Main content -->\n" +
    "<section class=\"content\">\n" +
    "    <div class=\"row\">\n" +
    "        <div ng-if=\"loading\" style=\"position: absolute;width: 100px; height: 50px; top: 50%;left: 50%; margin-left: -50px; margin-top: -25px;\">\n" +
    "            <i class=\"fa fa-cog fa-spin fa-5x fa-fw margin-bottom\"></i>\n" +
    "            <span><h3>Loading...</h3></span>\n" +
    "        </div>\n" +
    "        <div class=\"col-md-3 col-sm-4 col-xs-12\" ng-if=\"!loading\">\n" +
    "            <!-- Profile Image -->\n" +
    "            <div class=\"box box-primary\">\n" +
    "                <div class=\"box-body box-profile\">\n" +
    "                    <div class=\"comp-det-top\">\n" +
    "                        <div class=\"col-md-4\"><img class=\"img-responsive comp-logo-img\" id=\"component-logo\" ng-src=\"assets/img/component-logos/{{ component.component }}.png\" err-src=\"assets/img/component-logos/no_img.png\" alt=\"\">\n" +
    "                        </div>\n" +
    "                        <div class=\"col-md-3\">\n" +
    "                            <h3 class=\"comp-name\" ng-bind=\"component.component\" id=\"comp_name\"></h3>\n" +
    "                        </div>\n" +
    "                        <div class=\"col-md-5 version-wrapper\">v.\n" +
    "                            <span class=\"\" ng-bind=\"component.version\" id=\"comp_version\"></span>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    <span class=\"clearfix\"></span>\n" +
    "                    <div style=\"text-align: center; padding-bottom: 25px;\"><b><a href=\"\" tooltip-append-to-body=\"true\" uib-tooltip=\"Check out the new features of {{ component.component }}\" ng-click=\"openWhatsNew()\"> What's New</a></b></div>\n" +
    "                    <ul class=\"list-group list-group-unbordered\" id=\"comp_details\">\n" +
    "                        <li class=\"list-group-item\" ng-show=\"component.up_time\">\n" +
    "                            <span class=\"pull-left\"><b>Uptime</b></span> <span class=\"pull-right\" ng-bind=\"component.up_time\" id=\"comp_version\"></span>\n" +
    "                        </li>\n" +
    "                        <li class=\"list-group-item\" ng-show=\"component.datadir || component.logdir\">\n" +
    "                            <span class=\"pull-left\"><span style=\"cursor: pointer;\" tooltip-append-to-body=\"true\" uib-tooltip=\"{{ component.datadir }}\" ng-show=\"component.datadir != ''\" tooltip-class=\"logDataDirHover\"> Data Dir <i class=\"fa fa-archive\"></i> </span></span>\n" +
    "                            <span class=\"pull-right\"> <a tooltip-append-to-body=\"true\" uib-tooltip=\"{{ component.logdir }}\" ng-show=\"component.logdir != ''\" ui-sref=\"components.componentLog({component:component.component})\" ng-click=\"logdir(component.logdir) ; logdirSelect()\" tooltip-class=\"logDataDirHover\"> Log Dir <i class=\"fa fa-list-alt\"></i> </a> </span>\n" +
    "                        </li>\n" +
    "                        <li class=\"list-group-item\" id=\"li-pointer\" ng-show=\"component.data_size\">\n" +
    "                            <span class=\"pull-left\"><b>Data Size</b></span> \n" +
    "                            <span class=\"pull-right\" ng-bind=\"component.data_size\" id=\"dt_added\"></span>\n" +
    "                        </li>\n" +
    "                        <li class=\"list-group-item\" id=\"li-pointer\" ng-show=\"component.is_installed == 1 \">\n" +
    "                            <span class=\"pull-left\"><b>Auto Start</b></span> \n" +
    "                            <span class=\"pull-right\">\n" +
    "                                <input type=\"checkbox\" ng-model=\"component.autostart\" ng-change=\"autostartChange(component.autostart)\">\n" +
    "                            </span>\n" +
    "                        </li>\n" +
    "                        <li class=\"list-group-item\" id=\"li-pointer\" ng-show=\"component.is_installed == 1 \">\n" +
    "                            <span class=\"pull-left\"><b>Refresh Interval </b>(sec)</span>\n" +
    "                            <span class=\"pull-right\"><select class=\"form-control\" id=\"select-refresh-interval\" ng-change=\"changeOption()\" ng-model=\"opt.interval\">\n" +
    "                            <option ng-repeat=\"option in optionList\" value=\"{{option.value}}\">{{option.label}}</option></select>\n" +
    "                            </span>\n" +
    "                        </li>\n" +
    "                    </ul>\n" +
    "                    <div ng-show=\"component.status === 'Running'\" class=\"comp-status-wrap text-center\">\n" +
    "                        <i ng-class=\"statusColors[component.status]\" class=\"fa fa-stop fa-4x\"></i>\n" +
    "                        <h4>{{component.status}} <br /><small><span ng-show=\"component.status === 'Running'\">on port {{component.port}} </span></small></h4>\n" +
    "                    </div>\n" +
    "                    <div ng-show=\"component.status === 'Stopped'\" class=\"comp-status-wrap comp-stop-status-wrap text-center\">\n" +
    "                        <i ng-class=\"statusColors[component.status]\" class=\"fa fa-stop fa-4x\"></i>\n" +
    "                        <h4>{{component.status}}</h4>\n" +
    "                    </div>\n" +
    "                    <div class=\"clearfix\"></div>\n" +
    "                    <div id=\"button-act\" ng-click=\"action($event)\">\n" +
    "                        <a ng-show=\"component.status == undefined\" action=\"install\" class=\"btn btn-default\" ng-disabled=\" component.installation != undefined\">Install</a>\n" +
    "                        <a ng-show=\"component.status == 'Stopped'\" action=\"start\" class=\"btn btn-success\" ng-disabled=\" component.spinner != undefined\">Start</a>\n" +
    "                        <a ng-show=\"component.status == 'Stopped'\" action=\"remove\" class=\"btn btn-warning\" ng-disabled=\" component.spinner != undefined\">Remove</a>\n" +
    "                        <div ng-show=\"component.status == 'NotInitialized'\">\n" +
    "                            <a class=\"btn btn-danger\" ng-click=\"openInitPopup(component.component)\" ng-disabled=\" component.spinner != undefined\">Initialize</a>\n" +
    "                            <a class=\"btn btn-warning\" action=\"remove\" ng-disabled=\" component.spinner != undefined\">Remove</a>\n" +
    "                        </div>\n" +
    "                        <div ng-show=\"component.status == 'Running'\">\n" +
    "                            <a class=\"btn btn-danger\" action=\"stop\" ng-disabled=\" component.spinner != undefined\">Stop</a>\n" +
    "                            <a class=\"btn btn-warning\" action=\"restart\" ng-disabled=\" component.spinner != undefined\">Restart</a>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    <br />\n" +
    "                    <div id=\"dep_stats\">\n" +
    "                        <div ng-show=\"component.installation != undefined || component.spinner\" style=\"width:100%;height:auto\">\n" +
    "                            <div>\n" +
    "                                <span ng-show=\"component.spinner\"><i class='fa fa-spinner fa-2x  fa-pulse'></i> <b>{{component.spinner}}</b></span>\n" +
    "                                <div style=\"margin-left:10px;margin-top:20px\" ng-show=\"component.installationDependents != undefined\"><i class=\"fa fa-refresh fa-spin\" style='margin-right:2px'></i><b> Installing dependencies...</b></div>\n" +
    "                                <br />\n" +
    "                                <div style=\"margin-left:10px;margin-top:-10px\" ng-show=\"component.installationStart.status =='start' && component.installationStart.state == 'unpack'\"><i class=\"fa fa-circle-o-notch fa-spin\" style='margin-right:2px'></i><b> Unpacking </b></div>\n" +
    "                                <div style=\"margin-left:10px;margin-top:20px\" ng-show=\"component.installationStart.status =='start' && component.installationStart.state == 'download'\"><i class=\"fa fa-circle-o-notch fa-spin\" style='margin-right:2px'></i><b> Downloading </b></div>\n" +
    "                                </br>\n" +
    "                                <div ng-show=\"component.installationRunning != undefined\" class=\"col-md-4 col-xs-4\">\n" +
    "                                    file:<br \\>{{component.installationStart.file}}\n" +
    "                                </div>\n" +
    "                                <div class=\"col-md-4 col-xs-4\" ng-show=\"component.installationRunning != undefined\">\n" +
    "                                    <progressbar value=\"component.progress\"></progressbar>\n" +
    "                                    <button class=\"btn btn-default btn-xs center-block\" ng-click=\"cancelInstallation('cancelInstall') \">Cancel</button>\n" +
    "                                </div>\n" +
    "                                <div class=\"col-md-2 col-xs-2\" ng-show=\"component.installationRunning != undefined\">\n" +
    "                                    {{component.installationRunning.pct}}%\n" +
    "                                </div>\n" +
    "                                <div class=\"col-md-2 col-xs-2\" ng-show=\"component.installationRunning != undefined\">\n" +
    "                                    {{component.installationRunning.mb}}\n" +
    "                                </div>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    <div id=\"stats\">\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "                <!-- /.box-body -->\n" +
    "            </div>\n" +
    "            <!-- /.box -->\n" +
    "            <div ng-show=\"component.category == 1\" class=\"box box-primary\" ng-if=\"!loading\">\n" +
    "                <div class=\"box-header with-border\">\n" +
    "                    <h3 class=\"box-title\">Project Details</h3>\n" +
    "                    <div class=\"box-tools pull-right\">\n" +
    "                        <button type=\"button\" ng-click=\"isCollapsed2 = !isCollapsed2\" class=\"btn btn-box-tool\">\n" +
    "                        <div ng-if=\"isCollapsed2\">\n" +
    "                        <i class=\"fa fa-plus\"></i>\n" +
    "                        </div>\n" +
    "                        <div ng-if=\"!isCollapsed2\">\n" +
    "                        <i class=\"fa fa-minus\"></i>\n" +
    "                        </div>\n" +
    "                        </button>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "                <div class=\"box-body box-profile\" uib-collapse=\"isCollapsed2\" id=\"collapseClusterDetails\">\n" +
    "                    <ul class=\"list-group list-group-unbordered\">\n" +
    "                        <li class=\"list-group-item\" ng-show=\"component.svcname\">\n" +
    "                            <span class=\"pull-left\"><b>Description</b></span> <span class=\"pull-right\" ng-bind=\"component.svcname\" id=\"home_url\"></span>\n" +
    "                        </li>\n" +
    "                        <li class=\"list-group-item\" ng-show=\"component.home_url != '' && component.home_url != undefined || component.doc_url != '' && component.doc_url != undefined\">\n" +
    "                            <span class=\"pull-left\"><a ng-show=\"component.home_url != ''\" href=\"{{component.home_url}}\" target='_blank'> Homepage <i class=\"fa fa-external-link\"></i> </a></span> <span class=\"pull-right\"> <a ng-show=\"component.doc_url != ''\" href=\"{{component.doc_url}}\" target='_blank'> Documentation <i class=\"fa fa-external-link\"></i> </a> </span>\n" +
    "                        </li>\n" +
    "                        <li class=\"list-group-item\" id=\"li-pointer\" ng-show=\"component.release_date\">\n" +
    "                            <span class=\"pull-left\"><b>Release</b></span> <span class=\"pull-right\" ng-bind=\"component.release_date\" id=\"dt_added\">20160114</span>\n" +
    "                        </li>\n" +
    "                    </ul>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div ng-show=\"component.category == 1\" class=\"col-md-9 col-sm-8 col-xs-12\" ng-if=\"!loading\">\n" +
    "\n" +
    "       \n" +
    "            <div class=\"nav-tabs-custom\" id=\"comp-details-tabs-wrapper\" ng-controller=\"graphsTabController\">\n" +
    "                <uib-tabset>\n" +
    "                    <uib-tab heading=\"Overview\"  active=\"activeOverview\">\n" +
    "                        <div class=\"row tab-content graphsTab\" style=\"padding: 15px;\">\n" +
    "                        <div class=\"row\"> \n" +
    "                        <div class=\"col-md-12 col-xs-12\">\n" +
    "                            <div class=\"box\" ng-if=\"showGraphs\">\n" +
    "                                <uib-accordion>\n" +
    "                                    <uib-accordion-group is-open=\"uibStatus.tpsChartCollapsed\" is-disabled=\"component.status != 'Running'\">\n" +
    "                                      <uib-accordion-heading>\n" +
    "                                        <span ng-click=\"tabClick()\">Transactions per Second\n" +
    "                                            <i class=\"pull-right glyphicon\" \n" +
    "                                ng-class=\"{'fa fa-plus': !uibStatus.tpsChartCollapsed, 'fa fa-minus': uibStatus.tpsChartCollapsed}\"></i>\n" +
    "                                        </span>\n" +
    "                                      </uib-accordion-heading>\n" +
    "                                        <div>\n" +
    "                                            <nvd3 options=\"transctionsPerSecondChart\" data=\"commitRollbackData\"></nvd3>\n" +
    "                                        </div>\n" +
    "                                    </uib-accordion-group>    \n" +
    "                                 </uib-accordion>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                        </div>\n" +
    "                        <div class=\"row\">\n" +
    "                        <div class=\"col-md-12 col-xs-12\">\n" +
    "                            <div class=\"box\" ng-if=\"showGraphs\">\n" +
    "                                <uib-accordion>\n" +
    "                                    <uib-accordion-group is-open=\"uibStatus.rpsChartCollapsed\" is-disabled=\"component.status != 'Running'\">\n" +
    "                                      <uib-accordion-heading>\n" +
    "                                        <span ng-click=\"tabClick()\">Rows per Second\n" +
    "                                        <i class=\"pull-right glyphicon\" \n" +
    "                                ng-class=\"{'fa fa-plus': !uibStatus.rpsChartCollapsed, 'fa fa-minus': uibStatus.rpsChartCollapsed}\"></i> \n" +
    "                                        </span> \n" +
    "                                      </uib-accordion-heading>\n" +
    "                                        <div>\n" +
    "                                            <nvd3 options=\"rowsChart\" data=\"rowsData\"></nvd3>\n" +
    "                                        </div>\n" +
    "                                    </uib-accordion-group>    \n" +
    "                                 </uib-accordion>\n" +
    "                            </div>\n" +
    "                        </div>  \n" +
    "                        </div>\n" +
    "                        <div class=\"row\">\n" +
    "                        <div class=\"col-md-12 col-xs-12\">\n" +
    "                            <div class=\"box\" ng-if=\"showGraphs\">\n" +
    "                                <uib-accordion>\n" +
    "                                    <uib-accordion-group is-open=\"uibStatus.connectionsCollapsed\" is-disabled=\"component.status != 'Running'\">\n" +
    "                                      <uib-accordion-heading>\n" +
    "                                        <span ng-click=\"tabClick()\">Connections\n" +
    "                                        <i class=\"pull-right glyphicon\" \n" +
    "                                ng-class=\"{'fa fa-plus': !uibStatus.connectionsCollapsed, 'fa fa-minus': uibStatus.connectionsCollapsed}\"></i>\n" +
    "                                        </span> \n" +
    "                                      </uib-accordion-heading>\n" +
    "                                        <div>\n" +
    "                                            <nvd3 options=\"connectionsChart\" data=\"connectionsData\"></nvd3>\n" +
    "                                        </div>\n" +
    "                                    </uib-accordion-group>    \n" +
    "                                 </uib-accordion>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                        </div>\n" +
    "                        <div class=\"row\">\n" +
    "                        <div class=\"col-md-12 col-xs-12\">\n" +
    "                            <div class=\"box\" ng-if=\"showGraphs\">\n" +
    "                                <uib-accordion>\n" +
    "                                    <uib-accordion-group is-open=\"uibStatus.cpuChartCollapsed\">\n" +
    "                                      <uib-accordion-heading>\n" +
    "                                        <span ng-click=\"tabClick()\">Server CPU Load\n" +
    "                                        <i class=\"pull-right glyphicon\" \n" +
    "                                ng-class=\"{'fa fa-plus': !uibStatus.cpuChartCollapsed, 'fa fa-minus': uibStatus.cpuChartCollapsed}\"></i>\n" +
    "                                        </span>\n" +
    "                                      </uib-accordion-heading>\n" +
    "                                        <div>\n" +
    "                                            <nvd3 options=\"cpuChart\" data=\"cpuData\"></nvd3>\n" +
    "                                        </div>\n" +
    "                                    </uib-accordion-group>    \n" +
    "                                 </uib-accordion>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                        </div>\n" +
    "                        <div class=\"row\">\n" +
    "                        <div class=\"col-md-12 col-xs-12\">\n" +
    "                            <div class=\"box\" ng-if=\"showGraphs\">\n" +
    "                                <uib-accordion>\n" +
    "                                    <uib-accordion-group is-open=\"uibStatus.diskChartCollapsed\">\n" +
    "                                      <uib-accordion-heading>\n" +
    "                                        <span ng-click=\"tabClick()\">Server Disk I/O \n" +
    "                                        <i class=\"pull-right glyphicon\" \n" +
    "                                ng-class=\"{'fa fa-plus': !uibStatus.diskChartCollapsed, 'fa fa-minus': uibStatus.diskChartCollapsed}\"></i>\n" +
    "                                        </span> \n" +
    "                                      </uib-accordion-heading>\n" +
    "                                        <div>\n" +
    "                                            <nvd3 options=\"diskIOChart\" data=\"diskIOData\"></nvd3>\n" +
    "                                        </div>\n" +
    "                                    </uib-accordion-group>    \n" +
    "                                 </uib-accordion>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                        </div>\n" +
    "                        <div class=\"col-md-12 col-xs-12\" style=\"height: 100%; text-align: center;\" ng-if=\"!showGraphs\">\n" +
    "                            <p style=\"margin: 50px 0\">\n" +
    "                                <i class=\"fa fa-spinner fa-pulse fa-3x fa-fw\"></i>\n" +
    "                                <span class=\"sr-only\">Loading...</span>\n" +
    "                            </p>\n" +
    "                        </div>\n" +
    "                        </div>\n" +
    "                    </uib-tab>\n" +
    "                    <uib-tab heading=\"Activity\" disable=\"component.status != 'Running'\">\n" +
    "                        <div class=\"row tab-content\" style=\"padding: 10px;\">\n" +
    "                            <div class=\"col-md-12 col-sm-12 col-xs-12\">\n" +
    "                                <div class=\"box\" id=\"activityTab\">\n" +
    "                                    <div class=\"box-header\">\n" +
    "                                        <h3 class=\"box-title\">PG_STAT_ACTIVITY</h3>\n" +
    "                                    </div>\n" +
    "                                    <div class=\"box-body table-responsive no-padding\">\n" +
    "                                        <table class=\"table table-hover\">\n" +
    "                                            <thead>\n" +
    "                                                <tr>\n" +
    "                                                    <th class=\"col-md-1 col-xs-1\"><b>PID</b></th>\n" +
    "                                                    <th class=\"col-md-5 col-xs-5\"><b>Query</b></th>\n" +
    "                                                    <th class=\"col-md-2 col-xs-2\"><b>Query Time</b></th>\n" +
    "                                                    <th class=\"col-md-2 col-xs-2\"><b>DB</b></th>\n" +
    "                                                    <th class=\"col-md-1 col-xs-1\"><b>User</b></th>\n" +
    "                                                    <th class=\"col-md-1 col-xs-1\"><b>Cl. Addr.</b></th>\n" +
    "                                                    \n" +
    "                                                    \n" +
    "                                                </tr>\n" +
    "                                            </thead>\n" +
    "                                            <tbody ng-show=\"noActivities == false\">\n" +
    "                                                <tr ng-repeat=\" activity in activities\">\n" +
    "                                                    <!-- <div class=\"row component_box\"> -->\n" +
    "                                                    <td>{{activity.pid}}</td>\n" +
    "                                                    <td>{{activity.query}}</td>\n" +
    "                                                    <td>{{activity.query_time}}</td>\n" +
    "                                                    <td>{{activity.datname}}</td>\n" +
    "                                                    <td>{{activity.usename}}</td>\n" +
    "                                                    <td>{{activity.client_addr}}</td>\n" +
    "                                                    \n" +
    "                                                    \n" +
    "                                                    <!-- </div> -->\n" +
    "                                                </tr>\n" +
    "                                            </tbody>\n" +
    "                                            <tbody ng-show=\"noActivities == true\">\n" +
    "                                                <tr>\n" +
    "                                                    <td colspan=\"6\">\n" +
    "                                                        <p class=\"lead\">No Database Activity.</p>\n" +
    "                                                    </td>\n" +
    "                                                </tr>\n" +
    "                                            </tbody>\n" +
    "                                        </table>\n" +
    "                                    </div>\n" +
    "                                </div>\n" +
    "                                <div>\n" +
    "                                </div>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                    </uib-tab>\n" +
    "                    <uib-tab heading=\"Configure\" ng-click=\"configureTabEvent()\" disable=\"component.status != 'Running'\">\n" +
    "                        <div ng-if=\"gridSettings\">\n" +
    "                            <div class=\"gridStyle\" ui-grid-expandable  ui-grid=\"gridSettings\" class=\"col-md-12 col-sm-12 col-xs-12\"></div>\n" +
    "                        </div>\n" +
    "                    </uib-tab>\n" +
    "                    <uib-tab heading=\"Databases\" ng-click=\"dataBaseTabEvent()\" disable=\"component.status != 'Running'\">\n" +
    "                        <div ng-if=\"gridOptions\">\n" +
    "                            <div class=\"gridStyle\" ui-grid=\"gridOptions\" class=\"col-md-12 col-sm-12 col-xs-12\"></div>\n" +
    "                        </div>\n" +
    "                    </uib-tab>\n" +
    "                    <uib-tab heading=\"Security\" ng-click=\"securityTabEvent()\" disable=\"component.status != 'Running'\">\n" +
    "                    <div class=\"gridStyle\">\n" +
    "                        <div class=\"box box-primary\">\n" +
    "                            <!-- <div class=\"box-header with-border\">\n" +
    "                                <h3 class=\"box-title\"> PG hba Configuration </h3> \n" +
    "                            </div> -->\n" +
    "                            <div class=\"box-body\">\n" +
    "                                <div class=\"row\">\n" +
    "                                    <div class=\"col-md-12 col-xs-12\">\n" +
    "                                        <span class=\"pull-left\"><a href=\"https://www.bigsql.org/docs/security/index.jsp\" target='_blank'> Documentation <i class=\"fa fa-external-link\"></i></a></span>\n" +
    "                                    </div>\n" +
    "                                </div>\n" +
    "                                <div class=\"row\">\n" +
    "                                    <div class=\"col-md-12 col-xs-12\">\n" +
    "                                        <span class=\"securityTabStyle\">\n" +
    "                                            {{securityTabContent}}\n" +
    "                                        </span>\n" +
    "                                    </div>\n" +
    "                                </div>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    </uib-tab>\n" +
    "                    <uib-tab heading=\"Performance\" disable=\"component.status != 'Running'\">\n" +
    "                    <div class=\"gridStyle\">\n" +
    "                        <div class=\"box box-primary\">\n" +
    "                            <div class=\"box-body\">\n" +
    "                                <div class=\"row\">\n" +
    "                                    <div style=\"padding-top: 20px;\" class=\"col-md-12 col-sm-12 col-xs-1\">\n" +
    "                                        <a style=\"margin-right: 10px;\" class=\"btn btn-lg btn-default\" tooltip-append-to-body=\"true\" uib-tooltip=\"{{ component.logdir }}\" ng-show=\"component.logdir != ''\" ui-sref=\"components.componentLog({component:component.component})\" ng-click=\"logdir(component.logdir) ; logdirSelect()\" tooltip-class=\"logDataDirHover\">\n" +
    "                                            <i class=\"fa fa-file-text-o fa-2x pull-left\"></i>\n" +
    "                                            Log Tailer\n" +
    "                                        </a>\n" +
    "\n" +
    "                                        <a style=\"margin-right: 10px;\" class=\"btn btn-lg btn-default\" ui-sref=\"components.profiler\">\n" +
    "                                            <i class=\"bgs bgs-lg bgs-plprofiler pull-left\"></i> plProfiler Console\n" +
    "                                        </a>\n" +
    "\n" +
    "                                        <a class=\"btn btn-lg btn-default\" ui-sref=\"components.badger\">\n" +
    "                                            <i class=\"bgs bgs-lg bgs-pgbadger pull-left\"></i> \n" +
    "                                            pgBadger Console\n" +
    "                                        </a>\n" +
    "                                    </div>\n" +
    "                                </div>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    </uib-tab>\n" +
    "                    <uib-tab heading=\"Release Notes\" ng-click=\"releaseTabEvent()\" active=\"activeReleaseNotes\">\n" +
    "                        <div class=\"gridStyle\">\n" +
    "                            <div class=\"box box-primary\">\n" +
    "                                <div class=\"box-body\">\n" +
    "                                    <div class=\"col-md-12 col-xs-12\" style=\"height: 700px; overflow: scroll;\">\n" +
    "                                        <span ng-bind-html=\"relnotes\"></span>\n" +
    "                                    </div>\n" +
    "                                </div>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                    </uib-tab>\n" +
    "                </uib-tabset>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</section>\n" +
    "")

$templateCache.put("../app/components/partials/devOpsUpdate.html","<div class=\"modal-header\">\n" +
    "    <img src=\"../assets/img/logoBIG.png\" alt=\"\">\n" +
    "    <h4 class=\"modal-title\" id=\"updateModalLabel\">BigSQL Ops Manager update</h4>\n" +
    "</div>\n" +
    "<div class=\"modal-body\">\n" +
    "        <p ng-hide=\"bamUpdateIntiated\">WE NEED TO SUSPEND THE GUI MANAGER WHILE WE UPDATE. THIS SHOULD TAKE A FEW MINUTES. <br /> CLICK THE BUTTON BELOW TO START THE PROCESS.</p>\n" +
    "        <div ng-show=\"updatingStatus\" style=\"width:600px; margin:0 auto;\">BigSQL Ops Manager Updating {{currentVersion}} to {{updateVersion}} </div>\n" +
    "        <br />\n" +
    "        <img ng-show=\"updatingStatus\" style=\"width:100px;\" src=\"/assets/loaders/loader.gif\" />\n" +
    "        <button class=\"btn btn-default\" ng-hide=\"bamUpdateIntiated\" ng-click=\"action($event)\">Update BigSQL Ops Manager Version {{currentVersion}} to {{updateVersion}} </button>\n" +
    "        <button class=\"btn btn-default\" ng-show=\"bamUpdatedStatus\" ng-click=\"redirect()\"> BigSQL Ops Manager has been updated, Click to launch</button>\n" +
    "        <button class=\"btn btn-default\" ng-show=\"bamNotUpdatedStatus\" ng-click=\"redirect()\"> BigSQL Ops Manager not updated</button>\n" +
    "    \n" +
    "</div>")

$templateCache.put("../app/components/partials/generateBadgerReport.html","<div class=\"modal-header\">\n" +
    "    <h3 class=\"modal-title\">&nbsp;</h3>\n" +
    "</div>\n" +
    "<div class=\"modal-body\" style=\"text-align: center;\">\n" +
    "    <div ng-if=\"generatingReportSpinner\" style=\"\"> <i class='fa fa-spinner fa-2x  fa-pulse'></i> Generating badger report</div>\n" +
    "    <div ng-if=\"!badgerError && !generatingReportSpinner\">\n" +
    "        <h5 style=\"font-size: 1.4rem; font-weight: 500;\">\n" +
    "        Report {{report_file}} generated.\n" +
    "        </h5>\n" +
    "        <br />\n" +
    "        <span ng-if=\"report_file\">\n" +
    "        <a class=\"btn btn-default btn-lg\" href=\"/reports/{{ report_file }}\" target=\"_blank\" ng-click=\"cancel()\">    View Report</a>\n" +
    "        </span>\n" +
    "        <br />\n" +
    "        <p style=\"font-style: italic; font-size: 1.0rem; padding-top: 20px;\"> (Opens a new tab)</p>\n" +
    "    </div>\n" +
    "    <div ng-if=\"badgerError\">\n" +
    "        {{badgerError}}\n" +
    "    </div>\n" +
    "</div>\n" +
    "<div class=\"modal-footer\">\n" +
    "    <button class=\"btn btn-warning\" type=\"button\" ng-disabled=\"switchBtn\" ng-click=\"cancel()\">Close</button>\n" +
    "</div>")

$templateCache.put("../app/components/partials/globalProfilingModal.html","<div class=\"modal-header\">\n" +
    "    <div ng-click=\"cancel()\" class=\"close-modal pull-right\" data-dismiss=\"modal\" aria-hidden=\"true\">\n" +
    "        <i class=\"fa fa-lg fa-close\"></i>\n" +
    "    </div>\n" +
    "    <h3 class=\"modal-title\">Global Profiling</h3>\n" +
    "</div>\n" +
    "<uib-alert ng-repeat=\"alert in alerts\" type=\"{{alert.type}}\" close=\"closeAlert()\" class=\"uib-text\" dismiss-on-timeout=\"8000\">\n" +
    "        {{alert.msg}}  \n" +
    "</uib-alert>\n" +
    "<div class=\"modal-body\">\n" +
    "<div ng-if=\"showStatus\">Global Profiling is {{status.status}}</div>\n" +
    "<br />\n" +
    "<form class=\"form plProfiler-form\" action=\"#\">\n" +
    "    <div class=\"form-group\">\n" +
    "        <a class=\"btn btn-lg btn-default\" ng-click=\"enableProfiler()\" ng-disabled=\"status.enabled\">\n" +
    "            <i class=\"fa fa-check fa-2x pull-left\"></i> Enable\n" +
    "        </a>\n" +
    "        <a class=\"btn btn-lg btn-default\" ng-click=\"disableProfiler()\" ng-disabled=\"!status.enabled\">\n" +
    "            <i class=\"fa fa-ban fa-2x pull-left\"></i> Disable\n" +
    "        </a>\n" +
    "        <a class=\"btn btn-lg btn-default\" ng-click=\"resetProfiler()\" uib-tooltip=\"Reset Global Profiling Statistics\">\n" +
    "            <i class=\"fa fa-refresh fa-2x pull-left\"></i> Reset\n" +
    "        </a>\n" +
    "        <a class=\"btn btn-lg btn-default\" ng-click=\"generateReport()\">\n" +
    "            <i class=\"fa fa-newspaper-o fa-2x pull-left\"></i> View Report\n" +
    "        </a>\n" +
    "    </div>\n" +
    "    <div class=\"form-group\">\n" +
    "        <div ng-class=\"{ 'alert alert-success' : result.action == 'enable', 'alert alert-danger' : result.action == 'disable', 'alert alert-warning' : result.action == 'reset'  }\" role=\"alert\" ng-if=\"showResult\">\n" +
    "            {{result.msg}}\n" +
    "        </div> \n" +
    "    </div>\n" +
    "    <div class=\"form-group\">\n" +
    "        <input type=\"text\" ng-model=\"pgTitle\" required class=\"form-control\" placeholder=\"Report Title (Optional)\">\n" +
    "    </div>\n" +
    "     <div class=\"form-group\">\n" +
    "        <input type=\"text\" ng-model=\"pgDesc\" class=\"form-control\" placeholder=\"Report Desc (Optional)\">\n" +
    "    </div>\n" +
    "</form>\n" +
    "</div>\n" +
    "<!-- <div class=\"modal-footer\">\n" +
    "    <button class=\"btn btn-warning\" type=\"button\" ng-click=\"cancel()\">Close</button>\n" +
    "</div> -->")

$templateCache.put("../app/components/partials/hostGraphModal.html","<div class=\"modal-header\">\n" +
    "	<div ng-click=\"cancel()\" class=\"close-modal pull-right\" data-dismiss=\"modal\" aria-hidden=\"true\">\n" +
    "        <i class=\"fa fa-lg fa-close\"></i>\n" +
    "    </div>\n" +
    "    <h2 class=\"modal-title\" id=\"updateModalLabel\"> {{chartName}} ({{hostName}})</h2>\n" +
    "</div>\n" +
    "<div ng-click=\"cancel()\" class=\"close-modal\" data-dismiss=\"modal\" aria-hidden=\"true\">\n" +
    "    <div class=\"lr\">\n" +
    "        <div class=\"rl\">\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"modal-body\">\n" +
    "    <nvd3 options=\"chart\" data=\"data\" showLegend=\"true\"></nvd3>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"modal-footer\">\n" +
    "    <!-- <button class=\"btn btn-danger\" type=\"button\" ng-click=\"cancel()\">Close</button> -->\n" +
    "</div>")

$templateCache.put("../app/components/partials/hosts.html","<section class=\"content-header\">\n" +
    "    <h1 class=\"components-update-title-wrapper\">\n" +
    "        HOST MANAGER\n" +
    "    </h1>\n" +
    "    <div class=\"btn-group pull-right \" uib-dropdown >\n" +
    "        <button type=\"button\" class=\"btn btn-default\" uib-dropdown-toggle>\n" +
    "            <i class=\"fa fa-plus\" aria-hidden=\"true\"></i>\n" +
    "        </button>\n" +
    "        <ul uib-dropdown-menu role=\"menu \" aria-labelledby=\"split-button \">\n" +
    "            <li><a href=\"\" ng-click=\"openGroupsModal()\">Add Group</a></li>\n" +
    "            <li><a href=\"\" ng-click=\"open()\">Add Host</a></li>\n" +
    "        </ul>\n" +
    "    </div>\n" +
    "</section>\n" +
    "\n" +
    "<span id=\"components\"></span>\n" +
    "<section class=\"content\">\n" +
    "    <div ng-if=\"loading\" style=\"position: absolute;width: 100px; height: 50px; top: 50%;left: 50%; margin-left: -50px; margin-top: -25px;\">\n" +
    "        <i class=\"fa fa-cog fa-spin fa-5x fa-fw margin-bottom\"></i>\n" +
    "        <span><h3>Loading...</h3></span>\n" +
    "    </div>\n" +
    "    <div class=\"uib-text\" uib-alert ng-repeat=\"alert in alerts\" type=\"{{alert.type}}\" close=\"closeAlert()\" dismiss-on-timeout=\"8000\">\n" +
    "        This is a beta feature, you need to enable this in <a ui-sref=\"components.settingsView\">settings.</a> \n" +
    "    </div>\n" +
    "    <div ng-if=\"nothingInstalled\" class=\"jumbotron\"\n" +
    "         style=\"background-color: #fff; margin-top: 15px; text-align: center;\"><h3> You haven't registered any\n" +
    "        hosts.</h3></div>\n" +
    "\n" +
    "    <div class=\"hostmanager-accordian-wrapper\" ng-if=\"!loading\">\n" +
    "        <div class=\"box\">\n" +
    "            <uib-accordion close-others=\"true\">\n" +
    "                <uib-accordion-group ng-repeat=\"group in groupsList\" is-open=\"group.state\"  ng-init=\"parentIndex = $index\" >\n" +
    "                    <uib-accordion-heading>\n" +
    "                        <span ng-click=\"loadGroup($index)\" ng-if=\"group.group == 'default'\">\n" +
    "                            <i class=\"pull-left glyphicon\" ng-class=\"{'fa fa-plus': !group.state, 'fa fa-minus': group.state}\"></i> &nbsp;All Hosts\n" +
    "                        </span>\n" +
    "                        <span ng-click=\"loadGroup($index)\" ng-if=\"group.group != 'default'\">\n" +
    "                            <i class=\"pull-left glyphicon\" ng-class=\"{'fa fa-plus': !group.state, 'fa fa-minus': group.state}\"></i>&nbsp; {{group.group}}\n" +
    "                        </span>\n" +
    "                            <div class=\"pull-right\" style=\"margin-top: -10px\">\n" +
    "                                &nbsp;\n" +
    "                                <div class=\"btn-group\" uib-dropdown >\n" +
    "                                    <button id=\"split-button \" type=\"button\" ng-click=\"$event.stopPropagation();$event.preventDefault();openNewLocation(); openGroupsModal($index)\" class=\"btn btn-default \" ng-if=\"group.group!='default'\" >Edit Group</button>\n" +
    "                                    <button type=\"button\" ng-click=\"$event.stopPropagation();$event.preventDefault();openNewLocation()\" class=\"btn btn-default \" ng-if=\"group.group!='default'\"  uib-dropdown-toggle>\n" +
    "                                        <span class=\"caret \"></span>\n" +
    "                                        <span class=\"sr-only \">Split button!</span>\n" +
    "                                    </button>\n" +
    "                                    <ul uib-dropdown-menu role=\"menu \" aria-labelledby=\"split-button \">\n" +
    "                                        <li><a  ng-click=\"$event.stopPropagation();$event.preventDefault();openNewLocation(); deleteGroup($index)\" href=\"\">Delete</a></li>\n" +
    "                                    </ul>\n" +
    "                                </div>\n" +
    "                            </div>\n" +
    "                    </uib-accordion-heading>\n" +
    "                    <div class=\"col-md-12\">\n" +
    "                        <div ng-if=\"group.hosts.length == 0\">There are no servers added in this group.</div>\n" +
    "                        <uib-accordion close-others=\"true\" >\n" +
    "                            <uib-accordion-group ng-repeat=\"host in group.hosts\" is-open=\"host.state\" ng-init=\"hostIndex = $index\">\n" +
    "                                <uib-accordion-heading>\n" +
    "                                        <span ng-click=\"loadHost(parentIndex, $index, false); stopCalls()\" ng-if=\"host.host != 'localhost' && host.name != host.host\"> &nbsp; {{host.name}} &nbsp; ({{ host.host }})\n" +
    "                                            &nbsp; &nbsp; &nbsp;\n" +
    "                                            {{host.hostInfo.os}} {{ host.hostInfo.mem }} GB, {{ host.hostInfo.cores }} x {{host.hostInfo.cpu}}\n" +
    "                                            <i class=\"pull-left glyphicon\" ng-class=\"{'fa fa-plus': !host.state, 'fa fa-minus': host.state}\"></i>\n" +
    "                                        </span>\n" +
    "                                        <span ng-click=\"loadHost(parentIndex, $index, false); stopCalls()\" ng-if=\"host.host == 'localhost' || host.name == host.host\"> &nbsp; {{host.host}}  \n" +
    "                                            &nbsp; &nbsp; &nbsp;\n" +
    "                                            {{host.hostInfo.os}} {{ host.hostInfo.mem }} GB, {{ host.hostInfo.cores }} x {{host.hostInfo.cpu}}\n" +
    "                                            <i class=\"pull-left glyphicon\" ng-class=\"{'fa fa-plus': !host.state, 'fa fa-minus': host.state}\"></i>\n" +
    "                                        </span>\n" +
    "                                        <div class=\"pull-right\" style=\"margin-top: -10px\">\n" +
    "                                            &nbsp;\n" +
    "                                            <button type=\"button\" ng-click=\"$event.stopPropagation();$event.preventDefault();openNewLocation(); loadHost(parentIndex,$index,true)\" class=\"btn btn-default\" ng-if=\"host.state\">Refresh</button>&nbsp;\n" +
    "                                            <button type=\"button\" ng-click=\"$event.stopPropagation();$event.preventDefault();openNewLocation(); UpdateManager($index)\" class=\"btn btn-default\" ng-if=\"host.state\" class=\"ng-binding\" href=\"\" >Package Manager</button>&nbsp;\n" +
    "                                            <button type=\"button\" ng-click=\"$event.stopPropagation();$event.preventDefault();openNewLocation(); showTop($index)\" class=\"btn btn-default\" ng-if=\"host.state\" class=\"ng-binding\" href=\"\">Top</button>&nbsp;\n" +
    "                                            <div class=\"btn-group\" uib-dropdown >\n" +
    "                                                <button id=\"split-button \" type=\"button\" ng-click=\"$event.stopPropagation();$event.preventDefault();openNewLocation(); open(parentIndex, $index)\" class=\"btn btn-default \" ng-if=\"host.host!='localhost'\" >Edit Host</button>\n" +
    "                                                <button type=\"button\" ng-click=\"$event.stopPropagation();$event.preventDefault();openNewLocation()\" class=\"btn btn-default \" ng-if=\"host.host!='localhost'\"  uib-dropdown-toggle>\n" +
    "                                                    <span class=\"caret \"></span>\n" +
    "                                                    <span class=\"sr-only \">Split button!</span>\n" +
    "                                                </button>\n" +
    "                                                <ul uib-dropdown-menu role=\"menu \" aria-labelledby=\"split-button \">\n" +
    "                                                    <li><a  ng-click=\"$event.stopPropagation();$event.preventDefault();openNewLocation(); deleteHost($index)\" href=\"\">Delete</a></li>\n" +
    "                                                </ul>\n" +
    "                                            </div>\n" +
    "                                        </div>\n" +
    "                                </uib-accordion-heading>\n" +
    "\n" +
    "                                <div class=\"col-md-7 col-sm-12 col-xs-12\" ng-if=\"host.hostInfo.home\">\n" +
    "\n" +
    "                                    <!-- <span style=\"float: right;\" ng-click=\"loadHost(parentIndex, $index,true)\">\n" +
    "\n" +
    "\n" +
    "                                    </span> -->\n" +
    "\n" +
    "                                    <p><strong>PGC : </strong>{{ host.hostInfo.version }} {{ host.hostInfo.home }}</p>\n" +
    "\n" +
    "                                    <p>\n" +
    "                                    <div style=\"padding:0;\" class=\"col-md-4 col-sm-6 col-xs-12\" ng-click=\"openGraphModal('CPU Load')\">\n" +
    "                                        <div class=\"host-perf-viz\">\n" +
    "                                                <h5>CPU Load</h5>\n" +
    "                                            <nvd3 options=\"cpuChart\" data=\"cpuData\" showLegend=\"false\"></nvd3>\n" +
    "                                        </div>\n" +
    "                                    </div>\n" +
    "                                    <div style=\"padding:0;\" class=\"col-md-4 col-sm-6 col-xs-12\" ng-click=\"openGraphModal('Disk IO')\">\n" +
    "                                        <div class=\"host-perf-viz\">\n" +
    "                                                <h5>Disk IO</h5>\n" +
    "                                            <nvd3 options=\"ioChart\" data=\"diskIO\" showLegend=\"false\"></nvd3>\n" +
    "                                        </div>\n" +
    "                                    </div>\n" +
    "                                    <div style=\"padding:0;\" class=\"col-md-4 col-sm-6 col-xs-12\" ng-click=\"openGraphModal('Network IO')\">\n" +
    "                                        <div class=\"host-perf-viz\">\n" +
    "                                                <h5>Network IO</h5>\n" +
    "                                            <nvd3 options=\"networkChart\" data=\"NetworkIO\" showLegend=\"false\"></nvd3>\n" +
    "                                        </div>\n" +
    "                                    </div>\n" +
    "                                    </p>\n" +
    "                                </div>\n" +
    "\n" +
    "                                <div ng-if=\"hostStatus\">\n" +
    "                                    <i class=\"fa fa-cog fa-spin fa-5x fa-fw margin-bottom\"></i>\n" +
    "                                    <span><h3>Loading...</h3></span>\n" +
    "                                </div> \n" +
    "                                <span ng-if=\"retry\" style=\"text-align: center;\"> <h4>Cannot connect to PGC. Retrying connection ... </h4> </span>\n" +
    "\n" +
    "                                <div class=\"col-md-5 col-sm-12 col-xs-12\" ng-if=\"host.comps\">\n" +
    "                                    <div ng-if=\"host.showMsg\" class=\"jumbotron\"\n" +
    "                                         style=\"background-color: #fff; margin-top: 15px; text-align: center;\">\n" +
    "                                        <h4> No PostgreSQL or server components installed.<br \\> Visit the <a ng-click=\"UpdateManager($index)\" href=\"\">Package Manager</a> to install components.</h4>\n" +
    "                                    </div>\n" +
    "                                    <div class=\"box\" ng-if='host.showMsg == false'>\n" +
    "                                        <div class=\"box-header with-border\">\n" +
    "                                            <h3 class=\"box-title\">Services</h3>\n" +
    "                                        </div>\n" +
    "                                        <div class=\"box-body\">\n" +
    "                                            <table class=\"table\" id=\"serversTable\">\n" +
    "                                                <thead>\n" +
    "                                                <tr>\n" +
    "                                                    <th class=\"col-md-2 col-xs-2\">Component</th>\n" +
    "                                                    <th class=\"col-md-6 col-xs-6\">Status</th>\n" +
    "                                                    <!-- <th class=\"col-md-1 col-xs-1\"></th> -->\n" +
    "                                                    <th class=\"col-md-3 col-xs-3\">Actions</th>\n" +
    "                                                </tr>\n" +
    "                                                </thead>\n" +
    "                                                <tbody id=\"serversTableBody\">\n" +
    "                                                <tr ng-repeat=\"comp in host.comps\" ng-if=\"comp.component != 'pgdevops'\">\n" +
    "                                                    <td class=\"col-md-1 col-xs-2\">\n" +
    "                                                        <div ng-if=\"comp.category != 1\">\n" +
    "                                                            <a ng-click=\"changeHost(host.host); openDetailsModal(comp.component)\">\n" +
    "                                                                {{ comp.component }}\n" +
    "                                                            </a>\n" +
    "                                                        </div>\n" +
    "                                                        <div ng-if=\"comp.category == 1\">\n" +
    "                                                            <a ui-sref=\"components.detailspg95({component:comp.component}) \" ng-click=\"changeHost(host.host)\">\n" +
    "                                                                {{ comp.component }}\n" +
    "                                                            </a>\n" +
    "                                                        </div>\n" +
    "                                                    </td>\n" +
    "                                                    <td class=\"col-md-6 col-xs-6\" style=\"white-space: nowrap;\">\n" +
    "                                                        <i ng-class=\"statusColors[comp.state]\" style=\"margin-top:2px;margin-right:10px\" class=\"fa fa-stop fa-2x pull-left\" ng-hide=\"comp.showingSpinner\"></i>\n" +
    "                                                        <div style=\"margin-top: 5px\" ng-show=\"comp.port && !comp.showingSpinner\">{{ comp.state }} on port {{ comp.port }}</div>\n" +
    "                                                        <div style=\"margin-top: 5px\" ng-show=\"!comp.port\">{{ comp.state }}</div>\n" +
    "                                                        <span ng-show=\"comp.showingSpinner\">\n" +
    "                                                            <i class='fa fa-spinner fa-2x  fa-pulse'></i>\n" +
    "                                                        </span>\n" +
    "                                                    </td>\n" +
    "                                                    <!-- <td class=\"col-md-1 col-xs-1\">\n" +
    "                                                        <span ng-show=\"comp.showingSpinner\"><i\n" +
    "                                                                class='fa fa-spinner fa-2x  fa-pulse'></i></span>\n" +
    "                                                    </td> -->\n" +
    "                                                    <td class=\"col-md-5 col-xs-3\" value=\"{{ comp.component }}\" ng-click=\"action( $event, host.host)\">\n" +
    "                                                        <a class=\"btn btn-default\" ng-show=\"comp.state =='Not Initialized' \" ng-click=\"openInitPopup(comp.component)\"\n" +
    "                                                           ng-disabled=\" comp.showingSpinner != undefined\">Initialize</a>\n" +
    "                                                        <a class=\"btn btn-default\" id=\"install\" ng-show=\"comp.state =='Stopped'\"\n" +
    "                                                           ng-disabled=\" comp.showingSpinner != undefined\">Start</a>\n" +
    "\n" +
    "                                                        <div class=\"btn-group\" uib-dropdown ng-show=\"comp.state =='Running'\">\n" +
    "                                                            <button id=\"split-button\" type=\"button\" class=\"btn btn-default\"\n" +
    "                                                                    ng-disabled=\" comp.showingSpinner != undefined\">Action\n" +
    "                                                            </button>\n" +
    "                                                            <button type=\"button\" class=\"btn btn-default\" uib-dropdown-toggle\n" +
    "                                                                    ng-disabled=\" comp.showingSpinner != undefined\" ng-click=\"stopServerCall()\">\n" +
    "                                                                <span class=\"caret\"></span>\n" +
    "                                                                <span class=\"sr-only\">Split button!</span>\n" +
    "                                                            </button>\n" +
    "                                                            <ul uib-dropdown-menu role=\"menu\" aria-labelledby=\"split-button\">\n" +
    "                                                                <li role=\"menuitem\" ng-click=\"startServerCall(parentIndex, hostIndex )\"><a>Stop</a></li>\n" +
    "                                                                <li role=\"menuitem\" ng-click=\"startServerCall(parentIndex, hostIndex )\"><a>Restart</a></li>\n" +
    "                                                            </ul>\n" +
    "                                                        </div>\n" +
    "                                                    </td>\n" +
    "                                                </tr>\n" +
    "                                                </tbody>\n" +
    "                                            </table>\n" +
    "                                        </div>\n" +
    "                                    </div>\n" +
    "                                </div>\n" +
    "                            </uib-accordion-group>\n" +
    "                        </uib-accordion>\n" +
    "                    </div>\n" +
    "                </uib-accordion-group>\n" +
    "            </uib-accordion>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "\n" +
    "</section>")

$templateCache.put("../app/components/partials/landingPage.html","<section class=\"content-header\">\n" +
    "    <h1 class=\"components-update-title-wrapper\">\n" +
    "        Dashboard\n" +
    "    </h1>\n" +
    "</section>\n" +
    "<section class=\"content\">\n" +
    "    <div ng-if=\"bamLoading\" style=\"position: absolute;width: 100px; height: 50px; top: 50%;left: 50%; margin-left: -50px; margin-top: -25px;\">\n" +
    "        <i class=\"fa fa-cog fa-spin fa-5x fa-fw margin-bottom\"></i>\n" +
    "        <span><h3>Loading...</h3></span>\n" +
    "    </div>\n" +
    "    <div ng-if=\"!bamLoading\">\n" +
    "        <div class=\"row\">\n" +
    "            <div class=\"col-md-2 col-sm-3 col-xs-6\" ng-if=\"pgComp\" ng-repeat=\"comp in pgComp\">\n" +
    "                <a href=\"#/details-pg/{{comp.component}}\" class=\"thumbnail\">\n" +
    "                    <img class=\"img-responsive\" src=\"assets/img/pgdevops-postgres.png\" alt=\"\">\n" +
    "                    <div class=\"caption\">\n" +
    "                        <h4 class=\"home-page-tile-name\">{{comp.component}}</h4>\n" +
    "                    </div>\n" +
    "                </a>\n" +
    "            </div>\n" +
    "            <div class=\"col-md-2 col-sm-3 col-xs-6\">\n" +
    "                <a href=\"/admin\" class=\"thumbnail\">\n" +
    "                    <img class=\"img-responsive\" src=\"assets/img/pgadmin4-web.png\" alt=\"\">\n" +
    "                    <div class=\"caption\">\n" +
    "                        <h4 class=\"home-page-tile-name\">pgAdmin4 Web</h4>\n" +
    "                    </div>\n" +
    "                </a>\n" +
    "            </div>\n" +
    "            <div class=\"col-md-2 col-sm-3 col-xs-6\">\n" +
    "                <a ui-sref=\"components.view\" class=\"thumbnail\">\n" +
    "                    <img class=\"img-responsive\" src=\"assets/img/pgdevops-pkg-mgr.png\" alt=\"\">\n" +
    "                    <div class=\"caption\">\n" +
    "                        <h4 class=\"home-page-tile-name\">Package Manager</h4>\n" +
    "                    </div>\n" +
    "                </a>\n" +
    "            </div>\n" +
    "            <div class=\"col-md-2 col-sm-3 col-xs-6\">\n" +
    "                <a ui-sref=\"components.badger\" class=\"thumbnail\">\n" +
    "                    <img class=\"img-responsive\" src=\"assets/img/pgbadger-lg.png\" alt=\"\">\n" +
    "                    <div class=\"caption\">\n" +
    "                        <h4 class=\"home-page-tile-name\">pgBadger Console</h4>\n" +
    "                    </div>\n" +
    "                </a>\n" +
    "            </div>\n" +
    "            <div class=\"col-md-2 col-sm-3 col-xs-6\">\n" +
    "                <a ui-sref=\"components.profiler\" class=\"thumbnail\">\n" +
    "                    <img class=\"img-responsive\" src=\"assets/img/pl-profiler-opt-1.png\" alt=\"\">\n" +
    "                    <div class=\"caption\">\n" +
    "                        <h4 class=\"home-page-tile-name\">plProfiler Console</h4>\n" +
    "                    </div>\n" +
    "                </a>\n" +
    "            </div>\n" +
    "            <div class=\"col-md-2 col-sm-3 col-xs-6\">\n" +
    "                <a ui-sref=\"components.componentLog({component:'pgcli'})\" class=\"thumbnail\">\n" +
    "                    <div style=\"text-align: center;\">\n" +
    "                        <img class=\"img-responsive\" src=\"assets/img/pgdevops-logtailer.png\" alt=\"\">\n" +
    "                    </div>\n" +
    "                    <div class=\"caption\">\n" +
    "                        <h4 class=\"home-page-tile-name\">Log Tailer</h4>\n" +
    "                    </div>\n" +
    "                </a>\n" +
    "            </div>\n" +
    "            <div class=\"col-md-2 col-sm-3 col-xs-6\">\n" +
    "                <a ui-sref=\"components.hosts\" class=\"thumbnail\">\n" +
    "                    <img class=\"img-responsive\" src=\"assets/img/cloud-mgr-lg.png\" alt=\"\">\n" +
    "                    <div class=\"caption\">\n" +
    "                        <h4 class=\"home-page-tile-name\">Host Manager</h4>\n" +
    "                    </div>\n" +
    "                </a>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "    <!-- <hr style=\"background-color: #fff; border-top: 1px solid #8c8b8b; margin-top: 90px;\">\n" +
    "\n" +
    "\n" +
    "        <div class=\"row\">\n" +
    "            <div class=\"col-md-6\">\n" +
    "                <h3>Recently Released</h3>\n" +
    "            </div>\n" +
    "            <div class=\"col-md-6\">\n" +
    "                <h3>Documentation</h3>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "    </div> -->\n" +
    "</section>\n" +
    "")

$templateCache.put("../app/components/partials/log.html","<section class=\"content-header\">\n" +
    "    <server-info-details title=\"Log Tailer\"></server-info-details>\n" +
    "</section>\n" +
    "<section class=\"content\">\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-md-12 col-sm-12 col-xs-12\">\n" +
    "            <div class=\"box\">\n" +
    "                <div class=\"box-body\">\n" +
    "                    <form id=\"log-tail-filters\" class=\"form-horizontal\">\n" +
    "                        <div class=\"form-group\">\n" +
    "                            <div class=\"col-sm-4\">\n" +
    "                            <label class=\"comp-select\" for=\"select-component-log\">Component:</label>\n" +
    "                            <div class=\"col-sm-8\">\n" +
    "                            <select class=\"form-control\" id=\"logComponents\" ng-change=\"onLogCompChange()\" ng-model=\"selectComp\">\n" +
    "                                 <option value=\"#/log/pgcli\">pgcli</option>\n" +
    "                                 <option value=\"#/log/{{c.component}}\" ng-repeat=\"c in components\">{{c.component}}</option>\n" +
    "                            </select>\n" +
    "                            </div>\n" +
    "                            </div>\n" +
    "                            <div class=\"col-sm-6\">\n" +
    "                            <div id=\"log-lines\">\n" +
    "                            <p class=\"log-lines-label\"><strong>Log Lines: </strong></p>\n" +
    "                            <ul class=\"nav nav-pills\">\n" +
    "                                <li ng-class=\"{active:isSet(100)}\">\n" +
    "                                    <a href ng-click=\"setTab(100) ; action(100)\">{{ 100 | number:0 }}</a>\n" +
    "                                </li>\n" +
    "                                <li ng-class=\"{active:isSet(1000)}\">\n" +
    "                                    <a href ng-click=\"setTab(1000); action(1000)\">{{ 1000 | number:0 }}</a>\n" +
    "                                </li>\n" +
    "                                <li ng-class=\"{active:isSet(10000)}\">\n" +
    "                                    <a href ng-click=\"setTab(10000); action(10000)\">{{ 10000 | number:0 }}</a>\n" +
    "                                </li>\n" +
    "                            </ul>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                        <div class=\"col-sm-2\">\n" +
    "                            <!-- <input type=\"checkbox\" value=\"checked\" ng-model=\"checked\" ng-checked=\"true\" ng-click=\"stopScrolling($event)\"> Auto Scroll</input> -->\n" +
    "                            <div class=\"pull-right\" ng-click=\"action(tab)\"> <i class=\"fa fa-refresh fa-fw\"></i>Refresh</div>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                        <div class=\"form-group\">\n" +
    "                            <div class=\"col-md-12\">\n" +
    "                                <strong> Log File :</strong>&nbsp;&nbsp;<span>{{selectedLog}}</span>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                    </form>\n" +
    "                    \n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"box\">\n" +
    "                <div class=\"box-body\" style=\"overflow: auto;\">\n" +
    "                    <div style=\"background-color: #fff; height: 400px; overflow: auto;\" ng-bind-html=\"logFile\" id=\"logviewer\">\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "                <!-- /.box-body -->\n" +
    "            </div>\n" +
    "            <!-- /.box -->\n" +
    "            <!-- /.box -->\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</section>\n" +
    "")

$templateCache.put("../app/components/partials/loggingParam.html","<div class=\"modal-header\">\n" +
    "    <div ng-click=\"cancel()\" class=\"close-modal pull-right\" data-dismiss=\"modal\" aria-hidden=\"true\">\n" +
    "        <i class=\"fa fa-lg fa-close\"></i>\n" +
    "    </div>\n" +
    "    <h3 class=\"modal-title\">Set Logging Parameters</h3>\n" +
    "</div>\n" +
    "<div class=\"modal-body\">\n" +
    "    <table class=\"table table-striped\">\n" +
    "      <thead>\n" +
    "        <tr>\n" +
    "          <th><h4 style=\"font-weight: bold;\">Parameter</h4></th>\n" +
    "          <th><h4 style=\"font-weight: bold;\">Setting</h4></th>\n" +
    "        </tr>\n" +
    "      </thead>\n" +
    "      <tbody>\n" +
    "        <tr ng-repeat=\"(key, value) in data\" ng-if=\"$index < 3\">\n" +
    "            <td><h4 style=\"font-weight: bold;\">{{value.name}}</h4></td>\n" +
    "            <td>\n" +
    "                <div>\n" +
    "                    <label> \n" +
    "                        <input type=\"radio\" value=\"on\" name=\"{{value.name}}\" ng-checked=\"(value.setting == 0)\" ng-click=\"changeSetting(value.name, '0' )\">&nbsp; Enable all\n" +
    "                    </label>\n" +
    "                    &nbsp;\n" +
    "                    <label>\n" +
    "                        <input type=\"radio\" value=\"off\" name=\"{{value.name}}\" ng-checked=\"(value.setting == -1)\" ng-click=\"changeSetting(value.name, '-1' )\"> &nbsp; Disable all\n" +
    "                    </label>\n" +
    "                </div>\n" +
    "            </td>\n" +
    "            <td>\n" +
    "                <label>\n" +
    "                <input type=\"radio\" class=\"pull-left\" name=\"{{value.name}}\" ng-checked=\"(value.setting > 0)\"> \n" +
    "                &nbsp;\n" +
    "                <span ng-if=\"value.name == 'log_min_duration_statement'\">Log statements</span>\n" +
    "                <span ng-if=\"value.name == 'log_autovacuum_min_duration'\">Log autovacuum</span>\n" +
    "                <span ng-if=\"value.name == 'log_temp_files'\">Log temp files</span> \n" +
    "                >=\n" +
    "                </label>\n" +
    "                <span ng-if=\"value.name != 'log_temp_files'\">\n" +
    "                <input ng-model=\"value.setting\" type=\"text\" id=\"{{value.name}}\" ng-blur=\"changeSetting(value.name,value.setting )\" style=\"width: 20%\" > &nbsp;duration milliseconds</span>\n" +
    "                <span ng-if=\"value.name == 'log_temp_files'\">\n" +
    "                    <input ng-model=\"value.setting\" type=\"text\" id=\"{{value.name}}\" ng-blur=\"changeSetting(value.name, value.setting )\" style=\"width: 15%\"> &nbsp;size KB\n" +
    "                </span>\n" +
    "            </td>\n" +
    "        </tr>\n" +
    "        <tr ng-repeat=\"(key, value) in data \" ng-if=\"$index > 2\">\n" +
    "            <td><h4 style=\"font-weight: bold;\">{{value.name}}</h4></td>\n" +
    "            <td>\n" +
    "                <div>\n" +
    "                    <label> \n" +
    "                        <input type=\"radio\" value=\"on\" name=\"{{value.name}}\" ng-checked=\"(value.setting == 'on')\" ng-click=\"changeSetting(value.name, 'on' )\">&nbsp; Enable all\n" +
    "                    </label>\n" +
    "                    &nbsp;\n" +
    "                    <label>\n" +
    "                        <input type=\"radio\" value=\"off\" name=\"{{value.name}}\" ng-checked=\"(value.setting == 'off')\" ng-click=\"changeSetting(value.name, 'off' )\"> &nbsp; Disable all\n" +
    "                    </label>\n" +
    "                </div>\n" +
    "            </td>     \n" +
    "        </tr>\n" +
    "      </tbody>\n" +
    "    </table>\n" +
    "</div>\n" +
    "<div class=\"modal-footer\">\n" +
    "    <button class=\"btn btn-primary\" type=\"button\" ng-click=\"save(changedVales, comp)\">Save & Reload</button>\n" +
    "    <!-- <button class=\"btn btn-warning\" type=\"button\" ng-click=\"cancel()\">Cancel</button> -->\n" +
    "</div>")

$templateCache.put("../app/components/partials/pgInitialize.html","<div class=\"modal-header\">\n" +
    "    <h2 class=\"modal-title\" id=\"updateModalLabel\">Setup {{comp}}</h2>\n" +
    "</div>\n" +
    "<div class=\"modal-body\">\n" +
    "	Please provide a password for the superuser (postgres) database user\n" +
    "	<br>\n" +
    "	<br>\n" +
    "	<form class=\"form-horizontal\" name=\"initForm\">\n" +
    "	  <div class=\"form-group\">\n" +
    "	    <label for=\"password\" class=\"col-sm-4 control-label\">Password</label>\n" +
    "	    <div class=\"col-sm-6\">\n" +
    "	      <input type=\"password\"  class=\"form-control\" id=\"password\" name=\"password\" ng-model=\"formData.password\" ng-disabled=\"initializing\" required />\n" +
    "	    </div>\n" +
    "	  </div>\n" +
    "	  <div class=\"form-group\">\n" +
    "	    <label for=\"password_c\" class=\"col-sm-4 control-label\">Retype Password</label>\n" +
    "	    <div class=\"col-sm-6\">\n" +
    "	      <input type=\"password\" class=\"form-control\" id=\"password_c\" name=\"password_c\" ng-model=\"formData.password_c\"  ng-disabled=\"initializing\"valid-password-c required  />\n" +
    "	      <span ng-show=\"!initForm.password_c.$error.required && initForm.password_c.$error.noMatch && initForm.password.$dirty\">Passwords do not match.</span>\n" +
    "	    </div>\n" +
    "	  </div>\n" +
    "	  <div class=\"form-group\">\n" +
    "	  	<label for=\"dataDir\" class=\"col-sm-4 control-label\">Data Directory</label>\n" +
    "	  	<div class=\"col-sm-6\">\n" +
    "	  		<input type=\"text\" class=\"form-control\" name=\"dataDir\" ng-disabled=\"true\" ng-model=\"dataDir\" />\n" +
    "	  	</div>\n" +
    "	  </div>\n" +
    "	  <div class=\"form-group\">\n" +
    "	  		<label for=\"portNumber\" class=\"col-sm-4 control-label\">Port Number</label>\n" +
    "	  		<div class=\"col-sm-6\">\n" +
    "	  			<input type=\"text\" class=\"form-control\" id=\"portNumber\" ng-disabled=\"initializing\" name=\"portNumber\" ng-model=\"portNumber\" value=\"{{initForm.portNumber.$viewValue}}\" valid-port />\n" +
    "	  			<span ng-show=\"!!initForm.portNumber.$error.invalidLen\">Port must be between 1000 and 9999.</span>\n" +
    "	  		</div>\n" +
    "	  </div>\n" +
    "	  <div class=\"form-group\" ng-if=\"autoStartButton\">\n" +
    "	  		<label for=\"autoStart\" class=\"col-sm-4 control-label\">Auto Start</label>\n" +
    "	  		<div class=\"col-sm-6 autostart-input\">\n" +
    "	  			<input type=\"checkbox\" ng-model=\"autostart\" ng-disabled=\"autostartDisable || initializing\" ng-change=\"autostartChange(autostart)\" />\n" +
    "	  		</div>\n" +
    "	  </div>\n" +
    "	  <div class=\"form-group\">\n" +
    "	    <div class=\"col-sm-offset-8 col-sm-10\">\n" +
    "	    	<button ng-if=\"!initializing\" class=\"btn btn-warning\" type=\"button\" ng-click=\"cancel()\">Cancel</button>\n" +
    "			<button ng-if=\"!initializing\" type=\"submit\" class=\"btn btn-primary\" ng-disabled=\"!(initForm.password.$valid && initForm.password.$viewValue == initForm.password_c.$viewValue)\" ng-click=\"init() \">Start</button>\n" +
    "			<span ng-if=\"initializing\"><i class='fa fa-spinner fa-2x  fa-pulse'></i>&nbsp;Starting..</span>\n" +
    "	    </div>\n" +
    "	  </div>\n" +
    "	</form>\n" +
    "</div>")

$templateCache.put("../app/components/partials/profiler.html","<section class=\"content-header\">\n" +
    "    <h1 class=\"components-update-title-wrapper\">\n" +
    "        plProfiler Console\n" +
    "    </h1>\n" +
    "</section>\n" +
    "\n" +
    "<section class=\"content\">\n" +
    "    <uib-alert ng-repeat=\"alert in alerts\" type=\"{{alert.type}}\" close=\"closeAlert()\" class=\"uib-text\">\n" +
    "        {{alert.msg}}  \n" +
    "        <a ng-click=\"openDetailsModal()\" ng-if=\"!alert.pgComp\">Click here to install</a> \n" +
    "        <a ui-sref=\"components.view\" ng-if=\"alert.pgComp\">Click here to install</a>\n" +
    "    </uib-alert>\n" +
    "    <uib-alert ng-repeat=\"alert in successAlerts\" type=\"{{alert.type}}\" close=\"closeAlert()\" class=\"uib-text\" dismiss-on-timeout=\"8000\">\n" +
    "        {{alert.msg}}  \n" +
    "    </uib-alert>\n" +
    "    <uib-alert ng-repeat=\"alert in extensionAlerts\" type=\"{{startAlert.type}}\" close=\"closeAlert()\" class=\"uib-text\">\n" +
    "            {{alert.msg }} <button ng-if=\"alert.showBtns\" class=\"btn btn-default btn-sm\" ng-click=\"createExtension(); closeAlert()\" >Yes</button> <button ng-if=\"alert.showBtns\" class=\"btn btn-default btn-sm\" ng-click=\"closeAlert()\">No</button>\n" +
    "        </uib-alert>\n" +
    "    <div class=\"row\">\n" +
    "    <div class=\"col-md-4 col-sm-6 col-xs-12\">\n" +
    "        <div class=\"box\">\n" +
    "            <!-- <div class=\"box-header with-border\">\n" +
    "                <div class=\"col-md-12\">\n" +
    "                    <strong class=\"pull-left\"> Settings</strong>\n" +
    "                    <a class=\"pull-right\" ng-click=\"openDetailsModal()\">About plProfiler</a>\n" +
    "                </div>\n" +
    "            </div> -->\n" +
    "            <!-- <div class=\"box-body\">\n" +
    "                <form class=\"form plProfiler-form\">\n" +
    "                    <div class=\"form-group\">\n" +
    "                        <div class=\"col-md-4 col-sm-3 col-xs-3\">\n" +
    "                            <select class=\"form-control\" id=\"logComponents\" ng-model=\"selectComp\" ng-change=\"onSelectChange(selectComp)\">\n" +
    "                                <option value=\"\">Select Instance</option>\n" +
    "                                <option value=\"{{c.component}}\" ng-repeat=\"c in components\">{{c.component}}</option>\n" +
    "                            </select>\n" +
    "                            <span class=\"required-pgbadger-form\">*</span>\n" +
    "                        </div>\n" +
    "                        <br>\n" +
    "                        <br>\n" +
    "                    </div>\n" +
    "                    <div class=\"form-group\">\n" +
    "                        <div class=\"col-md-4 col-sm-3 col-xs-3\">\n" +
    "                            <select class=\"form-control\" id=\"logComponents\" ng-model=\"selectDatabase\" ng-change=\"onDatabaseChange(selectDatabase)\">\n" +
    "                                <option value=\"\">Select Database</option>\n" +
    "                                <option value=\"{{c.datname}}\" ng-repeat=\"c in databases\">{{c.datname}}</option>\n" +
    "                            </select>\n" +
    "                            <span class=\"required-pgbadger-form\">*</span>\n" +
    "                            <br>\n" +
    "                            <br>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    <div class=\"form-group\">\n" +
    "                        <div class=\"col-md-4 col-sm-3 col-xs-3\">\n" +
    "                            <input type=\"text\" ng-model=\"pgPort\" required class=\"form-control\" placeholder=\"DB Port\">\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </form>\n" +
    "            </div>\n" +
    "            </div> -->\n" +
    "            <div class=\"box-header with-border\">\n" +
    "            <div class=\"pull-left\" ng-click=\"refreshFields(selectComp)\"><i class=\"fa fa-refresh fa-fw\">&nbsp;</i>Refresh</div>\n" +
    "                <a class=\"pull-right\" ng-click=\"openDetailsModal()\">About plProfiler</a>\n" +
    "            </div>\n" +
    "            <div class=\"box-body\">\n" +
    "                <form class=\"form plProfiler-form\">\n" +
    "                    <div class=\"col-md-12\">\n" +
    "                    <label class=\"col-md-7 col-sm-6 col-xs-6\">Cluster Instance</label>\n" +
    "                    <div class=\"form-group col-md-5 col-sm-6 col-xs-6\">\n" +
    "                        <select class=\"form-control\" id=\"logComponents\" ng-disabled=\"refreshingFields\" ng-model=\"selectComp\" ng-change=\"onSelectChange(selectComp)\">\n" +
    "                            <option value=\"\">Select</option>\n" +
    "                            <option value=\"{{c.component}}\" ng-repeat=\"c in components\">{{c.component}}</option>\n" +
    "                        </select>\n" +
    "                        <span class=\"required-plprofiler-form\" style=\"right: 0px !important\">*</span>\n" +
    "                    </div>\n" +
    "                    </div>\n" +
    "                    <!-- <div class=\"col-md-12\">\n" +
    "                    <div class=\"form-group\">\n" +
    "                        <input type=\"text\" ng-model=\"pgUser\" required class=\"form-control\" placeholder=\"DB User\">\n" +
    "                        <span class=\"required-plprofiler-form\">*</span>\n" +
    "                    </div>\n" +
    "                    </div>\n" +
    "                    <div class=\"col-md-12\">\n" +
    "                    <div class=\"form-group\">\n" +
    "                        <input type=\"password\" ng-model=\"pgPass\" class=\"form-control\" placeholder=\"DB Password\">\n" +
    "                    </div>\n" +
    "                    </div> -->\n" +
    "                    <div class=\"col-md-12\">\n" +
    "                    <label class=\"col-md-7 col-sm-6 col-xs-6\">Database</label>\n" +
    "                    <div class=\"form-group col-md-5 col-sm-6 col-xs-6\">\n" +
    "                        <select ng-disabled=\"!selectComp || refreshingFields\" class=\"form-control\" id=\"logComponents\" ng-model=\"selectDatabase\" ng-change=\"onDatabaseChange(selectDatabase)\">\n" +
    "                            <option value=\"\">Select</option>\n" +
    "                            <option value=\"{{c.datname}}\" ng-repeat=\"c in databases\">{{c.datname}}</option>\n" +
    "                        </select>\n" +
    "                        <span class=\"required-plprofiler-form\" style=\"right: 0px !important\">*</span>\n" +
    "                    </div>\n" +
    "                    </div>\n" +
    "                    <div class=\"col-md-12\">\n" +
    "                    <div class=\"form-group col-md-12\" ng-if=\"status && selectDatabase && !refreshingFields\">Global Profiling is {{status.status}}</div>\n" +
    "                    <div class=\"form-group col-md-12\" ng-if=\"refreshingFields\"><i class='fa fa-spinner fa-2x  fa-pulse'></i> Refreshing fields...</div>\n" +
    "                    <!-- <div class=\"form-group\">\n" +
    "                        <input ng-disabled=\"!selectComp\" type=\"text\" ng-model=\"pgPort\" required class=\"form-control\" placeholder=\"DB Port\">\n" +
    "                        <span class=\"required-plprofiler-form\">*</span>\n" +
    "                    </div> -->\n" +
    "                    </div>\n" +
    "                </form>\n" +
    "                <div class=\"text-left col-md-12\">\n" +
    "                   <span class=\"required-symbol\">*</span> Required Field\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <button class=\"btn btn-default pull-left\" ng-disabled=\"!(selectComp && selectDatabase && pgPort && enableBtns)\" ng-click=\"queryProfiler(hostName, pgUser, pgPass, pgDB, pgPort, pgTitle, pgDesc)\"> Statement Profiling </button>\n" +
    "        <button class=\"btn btn-default pull-right\" ng-disabled=\"!(selectDatabase && selectComp && pgPort && enableBtns)\" ng-click=\"globalProfiling(hostName, pgUser, pgPass, pgDB, pgPort, pgTitle, pgDesc)\"> Global Profiling </button>\n" +
    "    </div>\n" +
    "    <div class=\"col-md-8 col-sm-6 col-xs-12\">\n" +
    "        <div ng-if=\"errorMsg\">\n" +
    "            {{errorMsg}}\n" +
    "        </div>\n" +
    "        <div ng-if=\"generatingReportSpinner\">\n" +
    "            <span>\n" +
    "                <i class=\"fa fa-cog fa-spin fa-3x fa-fw margin-bottom\"></i>Generating...\n" +
    "            </span>\n" +
    "        </div>\n" +
    "        <span ng-if=\"report_file\"><a href=\"/reports/{{ report_file }}\" target=\"_blank\">Click here to see the recent report in new tab</a>\n" +
    "        </span>\n" +
    "        <a class=\"btn btn-default pull-right\" ng-click=\"openRecentReports()\">\n" +
    "                            Recent Reports\n" +
    "                            </a>\n" +
    "        <iframe ng-if=\"report_file\" ng-src=\"{{ report_url }}\" width=\"100%\" height=\"500px\">\n" +
    "        </iframe>\n" +
    "    </div>\n" +
    " </div>\n" +
    "</section>")

$templateCache.put("../app/components/partials/recentReports.html","<div class=\"modal-header\">\n" +
    "    <div ng-click=\"cancel()\" class=\"close-modal pull-right\" data-dismiss=\"modal\" aria-hidden=\"true\">\n" +
    "        <i class=\"fa fa-lg fa-close\"></i>\n" +
    "    </div>\n" +
    "    <h3 class=\"modal-title\">Recent Reports</h3>\n" +
    "</div>\n" +
    "<div class=\"modal-body\">\n" +
    "        <div ng-if=\"!showError\">\n" +
    "            <div style=\"border-bottom: 1px solid #f4f4f4;\">\n" +
    "            <span style=\"padding-left: 15px;\"><label>Report</label>&nbsp; &nbsp;<input type=\"checkbox\" ng-click=\"toggleAll()\" ng-model=\"isAllSelected\">&nbsp;Select all </span>\n" +
    "            <span class=\"pull-right\" style=\"padding-right: 15px;\"><label>Created on</label></span>\n" +
    "            </div>\n" +
    "            <div class=\"box-body\" style=\"padding-left: 20px; max-height: 300px; overflow: auto;\">\n" +
    "                <div ng-repeat = \"option in files_list\">\n" +
    "                    <label>\n" +
    "                    <input type=\"checkbox\" ng-model=\"option.selected\" ng-change=\"optionToggled()\">\n" +
    "                    <span>&nbsp;{{ option.file }}</span>\n" +
    "                    </label>\n" +
    "                    &nbsp;&nbsp;<a target=\"_blank\" href=\"{{ option.file_link }}\"><i class=\"fa fa-external-link\"></i></a>\n" +
    "                    <span class=\"pull-right\">{{ option.mtime }}</span>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div ng-if=\"showError\">\n" +
    "            You haven't generated any reports.\n" +
    "        </div>\n" +
    "</div>\n" +
    "<div class=\"modal-footer\">\n" +
    "    <button class=\"btn btn-default pull-right\" ng-click=\"removeFiles(files_list, false)\" ng-if=\"!showError\" ng-disabled=\"!isAllSelected && !checked\" ng-click=\"deleteReports(files_list, true)\">Delete</button>\n" +
    "</div>")

$templateCache.put("../app/components/partials/settings.html","<script type=\"text/ng-template\" id=\"alert.html\">\n" +
    "    <div class=\"alert\" style=\"background-color:#fa39c3;color:white;\" role=\"alert\">\n" +
    "        <div ng-transclude></div>\n" +
    "    </div>\n" +
    "</script>\n" +
    "<uib-alert ng-repeat=\"alert in alerts\" type=\"{{alert.type}}\" dismiss-on-timeout=\"8000\" close=\"closeAlert($index)\" class=\"uib-text\">{{alert.msg}}</uib-alert>\n" +
    "<section class=\"content-header\">\n" +
    "     <server-info-details title=\"Settings\"></server-info-details>\n" +
    "    <div id=\"pgcInfoText\" class=\"pull-left\"></div>\n" +
    "</section>\n" +
    "<section class=\"content\">\n" +
    "    <div class=\"col-md-6 col-sm-6 col-xs-6\">\n" +
    "    <div class=\"box\">\n" +
    "        <div class=\"box-header with-border\">\n" +
    "            <h4><strong> PGC Server Info </strong></h4></div>\n" +
    "        <div class=\"box-body\">\n" +
    "            <form class=\"form-horizontal\">\n" +
    "                <div class=\"form-group\">\n" +
    "                    <div class=\"col-sm-12 col-md-12 col-xs-12\">\n" +
    "                        <div class=\"col-md-3\"><strong>PGC:</strong></div>\n" +
    "                        <div class=\"col-md-9\">{{pgcInfo.version}}</div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "                <div class=\"form-group\">\n" +
    "                    <div class=\"col-sm-12 col-md-12 col-xs-12\">\n" +
    "                        <div class=\"col-md-3\"><strong>User &amp; Host:</strong></div>\n" +
    "                        <div class=\"col-md-9\">{{pgcInfo.user}} &nbsp; {{pgcInfo.host}}</div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "                <div class=\"form-group\">\n" +
    "                    <div class=\"col-sm-12 col-md-12 col-xs-12\">\n" +
    "                        <div class=\"col-md-3\"><strong>OS:</strong></div>\n" +
    "                        <div class=\"col-md-9\">{{pgcInfo.os}}</div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "                <div class=\"form-group\">\n" +
    "                    <div class=\"col-sm-12 col-md-12 col-xs-12\">\n" +
    "                        <div class=\"col-md-3\"><strong>Hardware:</strong></div>\n" +
    "                        <div class=\"col-md-9\">{{pgcInfo.mem}} GB, {{pgcInfo.cpu}}</div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "                <div class=\"form-group\">\n" +
    "                    <div class=\"col-sm-12 col-md-12 col-xs-12\">\n" +
    "                        <div class=\"col-md-3\"><strong>Repo URL::</strong></div>\n" +
    "                        <div class=\"col-md-9\">{{pgcInfo.repo}}</div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </form>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    </div>\n" +
    "    <div class=\"col-md-6 col-sm-6 col-xs-6\">\n" +
    "    <div class=\"box\">\n" +
    "        <div class=\"box-header with-border\">\n" +
    "            <div class=\"col-md-8\">\n" +
    "                <h4><strong> Check for updates </strong></h4>\n" +
    "            </div>\n" +
    "            <div class=\"col-md-4\">\n" +
    "                <button type=\"button\" class=\"btn btn-default pull-right\" id=\"checkNow\" ng-click=\"open('manual')\">Check now</button>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div class=\"box-body\" ng-show=\"lastUpdateStatus\">\n" +
    "            \n" +
    "                <!-- <div class=\"form-group\">\n" +
    "                    <div class=\"col-sm-10\">\n" +
    "                        <div class=\"radio\">\n" +
    "                            <label>\n" +
    "                                <input type=\"radio\" ng-checked=\"settingType == 'manual'\" ng-model=\"settingType\" value=\"manual\" ng-change=\"updateManualSettings()\" /> Manually\n" +
    "                            </label>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "                <div class=\"form-group\">\n" +
    "                    <div class=\"col-sm-10\">\n" +
    "                        <div class=\"radio\">\n" +
    "                            <label>\n" +
    "                                <input type=\"radio\" ng-checked=\"settingType == 'auto'\" ng-model=\"settingType\" ng-change=\"onAutomaticOptionSelection()\"  value=\"auto\" /> Automatically\n" +
    "                            </label>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div> \n" +
    "                <div class=\"form-group\">\n" +
    "                    <div class=\"col-sm-6\">\n" +
    "                        <label for=\"inputPassword3\" class=\"col-sm-4 control-label\">Check for Updates</label>\n" +
    "                        <div class=\"col-sm-4\">\n" +
    "                            <select class=\"form-control\" name=\"singleSelect\" id=\"automaticSettings\" ng-change=\"onAutomaticOptionSelection()\" ng-model=\"automaticSettings\" ng-init=\"automaticSettings = settingsOptions[0]\"  ng-disabled=\"settingType=='manual' || settingType==undefined && settingType != 'auto'\" disabled=\"disable\" ng-options=\"option.name for option in settingsOptions\">\n" +
    "                            </select>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div> -->\n" +
    "                \n" +
    "                 <p class=\"col-md-12 col-xs-12 col-sm-12\">The last time you checked for updates was at {{lastUpdateStatus}}</p>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    </div>\n" +
    "    <div class=\"col-md-6 col-sm-6 col-xs-6\">\n" +
    "    <div class=\"box\">\n" +
    "        <div class=\"box-header with-border\">\n" +
    "            <label>\n" +
    "                <h4>\n" +
    "                    <strong> Beta Features </strong>\n" +
    "                </h4>\n" +
    "            </label>\n" +
    "        </div>\n" +
    "        <div class=\"box-body\">\n" +
    "            <form class=\"form-horizontal\">\n" +
    "                <div class=\"form-group\">\n" +
    "                    <div class=\"col-sm-6 col-md-6 col-xs-6\">\n" +
    "                        <label>\n" +
    "                            <input type=\"checkbox\" ng-model=\"hostManager\" ng-change=\"changeBetaFeature('hostManager', hostManager)\">&nbsp;Multi Host Manager\n" +
    "                        </label>\n" +
    "                    </div>\n" +
    "                    <div class=\"col-sm-6 col-md-6 col-xs-6\" ng-if=\"showPgDgFeature\">\n" +
    "                        <label>\n" +
    "                            <input type=\"checkbox\" ng-model=\"pgdg\" ng-change=\"changeBetaFeature('pgdg', pgdg)\">&nbsp;PGDG Linux Repositories\n" +
    "                        </label>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </form>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    </div>\n" +
    "</section>\n" +
    "")

$templateCache.put("../app/components/partials/statementProfilingModal.html","<div class=\"modal-header\">\n" +
    "    <div ng-click=\"cancel()\" class=\"close-modal pull-right\" data-dismiss=\"modal\" aria-hidden=\"true\">\n" +
    "        <i class=\"fa fa-lg fa-close\"></i>\n" +
    "    </div>\n" +
    "    <h3 class=\"modal-title\">PL/pgSQL Statement Profiling</h3>\n" +
    "</div>\n" +
    "<uib-alert ng-repeat=\"alert in alerts\" type=\"{{alert.type}}\" close=\"closeAlert()\" class=\"uib-text\" dismiss-on-timeout=\"8000\">\n" +
    "        {{alert.msg}}  \n" +
    "</uib-alert>\n" +
    "<div class=\"modal-body\">\n" +
    "<form class=\"form plProfiler-form\">\n" +
    "    <div class=\"form-group\">\n" +
    "        <textarea ng-model=\"pgQuery\" class=\"form-control\" placeholder=\"select plpgsql_function_to_profile(param_1, param_2)\"></textarea>\n" +
    "        <span class=\"required-plprofiler-form\">*</span>\n" +
    "    </div>\n" +
    "    <div class=\"form-group\">\n" +
    "        <input type=\"text\" ng-model=\"pgTitle\" required class=\"form-control\" placeholder=\"Report Title (Optional)\">\n" +
    "    </div>\n" +
    "     <div class=\"form-group\">\n" +
    "        <input type=\"text\" ng-model=\"pgDesc\" class=\"form-control\" placeholder=\"Report Desc (Optional)\">\n" +
    "    </div>\n" +
    "</form>\n" +
    "</div>\n" +
    "<div class=\"modal-footer\">\n" +
    "    <!-- <button class=\"btn btn-warning\" type=\"button\" ng-click=\"cancel()\">Cancel</button> -->\n" +
    "    <button type=\"submit\" class=\"btn btn-primary\" ng-disabled=\"!pgQuery\" ng-click=\"generateReport()\">Execute</button>\n" +
    "</div>")

$templateCache.put("../app/components/partials/status.html","<section class=\"content-header\">\n" +
    "    <server-info-details title=\"Server Status\"></server-info-details>\n" +
    "</section>\n" +
    "<uib-alert ng-repeat=\"alert in alerts\" type=\"{{alert.type}}\" dismiss-on-timeout=\"8000\" close=\"closeAlert()\" class=\"uib-text\">{{alert.msg}}</uib-alert>\n" +
    "<div id=\"pgcInfoText\" class=\"pull-left\"></div>\n" +
    "<span class=\"clearfix\"></span>\n" +
    "<section class=\"content\">\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-md-6 col-sm-12 col-xs-12\">\n" +
    "            <div ng-if=\"showMsg\" class=\"jumbotron\" style=\"background-color: #fff; margin-top: 15px; text-align: center;\"> \n" +
    "                <h4> No PostgreSQL or server components installed.<br \\> Visit the <a ui-sref=\"components.view\">Update Manager</a> to install components.</h4>\n" +
    "            </div>\n" +
    "            <div class=\"box\" ng-if='showMsg == false'>\n" +
    "                <div class=\"box-header with-border\">\n" +
    "                    <h3 class=\"box-title\">Services</h3>\n" +
    "                </div>\n" +
    "                <!-- /.box-header -->\n" +
    "                <div class=\"box-body\">\n" +
    "                    <table class=\"table\" id=\"serversTable\">\n" +
    "                        <thead>\n" +
    "                            <tr>\n" +
    "                                <th class=\"col-md-3 col-xs-3\">Component</th>\n" +
    "                                <th class=\"col-md-5 col-xs-5\">Status</th>\n" +
    "                                <th class=\"col-md-1 col-xs-1\"></th>\n" +
    "                                <th class=\"col-md-3 col-xs-3\">Actions</th>\n" +
    "                            </tr>\n" +
    "                        </thead>\n" +
    "                        <tbody id=\"serversTableBody\">\n" +
    "                            <tr ng-repeat=\"comp in comps\" ng-if=\"comp.component != 'devops'\">\n" +
    "                                <td class=\"col-md-3 col-xs-3\">\n" +
    "                                    <div ng-if=\"comp.category != 1\">\n" +
    "                                         <a ui-sref=\"components.detailsView({component:comp.component}) \">\n" +
    "                                                {{comp.component}}\n" +
    "                                            </a>\n" +
    "                                    </div>\n" +
    "                                    <div ng-if=\"comp.category == 1\">\n" +
    "                                         <a ui-sref=\"components.detailspg95({component:comp.component}) \">\n" +
    "                                                {{comp.component}}\n" +
    "                                            </a>\n" +
    "                                    </div>\n" +
    "                                </td>\n" +
    "                                <td class=\"col-md-5 col-xs-5\"><i ng-class=\"statusColors[comp.state]\" style=\"margin-top:2px;margin-right:10px\" class=\"fa fa-stop fa-2x pull-left\"></i>\n" +
    "                                    <div style=\"margin-top: 5px\" ng-show=\"comp.port\">{{comp.state}} on port {{comp.port}}</div>\n" +
    "                                    <div style=\"margin-top: 5px\" ng-show=\"!comp.port\">{{comp.state}}</div>\n" +
    "                                </td>\n" +
    "                                <td class=\"col-md-1 col-xs-1\">\n" +
    "                                    <span ng-show=\"comp.showingSpinner\"><i class='fa fa-spinner fa-2x  fa-pulse'></i></span>\n" +
    "                                </td>\n" +
    "                                <td class=\"col-md-3 col-xs-3\" value=\"{{comp.component}}\" ng-click=\"action($event)\">\n" +
    "                                    <a class=\"btn btn-default\" ng-show=\"comp.state =='Not Initialized' \" ng-click=\"openInitPopup(comp.component)\">Initialize</a>\n" +
    "                                    <a class=\"btn btn-default\" id=\"install\" ng-show=\"comp.state =='Stopped'\" ng-disabled=\" comp.showingSpinner != undefined\">Start</a>\n" +
    "                                    <div class=\"btn-group\" uib-dropdown ng-show=\"comp.state =='Running'\" >\n" +
    "                                        <button id=\"split-button\" type=\"button\" class=\"btn btn-default\" ng-disabled=\"{{comp.component=='devops'}}\">Action</button>\n" +
    "                                        <button type=\"button\" class=\"btn btn-default\" uib-dropdown-toggle ng-disabled=\"{{comp.component=='devops'}}\">\n" +
    "                                            <span class=\"caret\"></span>\n" +
    "                                            <span class=\"sr-only\">Split button!</span>\n" +
    "                                        </button>\n" +
    "                                        <ul uib-dropdown-menu role=\"menu\" aria-labelledby=\"split-button\">\n" +
    "                                            <li role=\"menuitem\"><a>Stop</a></li>\n" +
    "                                            <li role=\"menuitem\"><a>Restart</a></li>\n" +
    "                                        </ul>\n" +
    "                                    </div>\n" +
    "                                </td>\n" +
    "                            </tr>\n" +
    "                        </tbody>\n" +
    "                    </table>\n" +
    "                </div>\n" +
    "                <!-- /.box-body -->\n" +
    "            </div>\n" +
    "            <!-- /.box -->\n" +
    "            <!-- /.box -->\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-md-12 col-sm-12 col-xs-12\">\n" +
    "            <div class=\"box\">\n" +
    "            <div class=\"box-header with-border\">\n" +
    "                    <h3 class=\"box-title\">CPU Load</h3>\n" +
    "                </div>\n" +
    "            <nvd3 options=\"cpuChart\" data=\"cpuData\"></nvd3>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div class=\"col-md-12 col-sm-12 col-xs-12\">\n" +
    "            <div class=\"box\">\n" +
    "            <div class=\"box-header with-border\">\n" +
    "                    <h3 class=\"box-title\">Disk IO</h3>\n" +
    "                </div>\n" +
    "            <nvd3 options=\"ioChart\" data=\"diskIO\"></nvd3>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</section>")

$templateCache.put("../app/components/partials/switchLogfile.html","<div class=\"modal-header\">\n" +
    "    <div ng-click=\"cancel()\" class=\"close-modal pull-right\" data-dismiss=\"modal\" aria-hidden=\"true\">\n" +
    "        <i class=\"fa fa-lg fa-close\"></i>\n" +
    "    </div>\n" +
    "    <h3 class=\"modal-title\">Switch log file</h3>\n" +
    "</div>\n" +
    "<div class=\"modal-body\">\n" +
    "    <form class=\"form-horizontal\">\n" +
    "      <div class=\"form-group\">\n" +
    "        <label class=\"col-sm-4 control-label\">Current log file :</label>\n" +
    "        <div class=\"col-sm-6\">\n" +
    "            {{currentLogfile}}\n" +
    "        </div>\n" +
    "      </div>\n" +
    "      <div class=\"form-group\">\n" +
    "        <label for=\"password_c\" class=\"col-sm-4 control-label\">New log file name :</label>\n" +
    "        <div class=\"col-sm-5\">\n" +
    "          <input type=\"text\" class=\"form-control\" ng-model=\"logFile\" required />\n" +
    "        </div>\n" +
    "        <div class=\"col-sm-3\">\n" +
    "            <button type=\"submit\" class=\"btn btn-primary\" ng-disabled=\"logAction\" ng-model=\"switchBtn\" ng-click=\"switchFile(logFile)\">Switch</button>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "      <div ng-if=\"logAction\" style=\"text-align: center;\"> \n" +
    "        <i class=\"fa fa-pulse fa-3x fa-fw fa-spinner\"></i>Switching log file...\n" +
    "    </div>\n" +
    "    </form>\n" +
    "</div>\n" +
    "<div class=\"modal-footer\">\n" +
    "    <button class=\"btn btn-success pull-right\" ng-disabled=\"logAction\" type=\"button\" ng-click=\"switchFile('')\">Reset to default</button>\n" +
    "    <!-- <button class=\"btn btn-warning\" type=\"button\" ng-disabled=\"switchBtn\" ng-click=\"cancel()\">Close</button>  -->\n" +
    "</div>")

$templateCache.put("../app/components/partials/topModal.html","<div class=\"modal-header\">\n" +
    "    <h2 class=\"modal-title\" id=\"updateModalLabel\"> Top ({{ host }}) </h2>\n" +
    "</div>\n" +
    "<div ng-click=\"cancel()\" class=\"close-modal\" data-dismiss=\"modal\" aria-hidden=\"true\">\n" +
    "    <div class=\"lr\">\n" +
    "        <div class=\"rl\">\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "<uib-alert ng-repeat=\"alert in alerts\" type=\"{{ alert.type }}\" dismiss-on-timeout=\"8000\" close=\"closeAlert()\"\n" +
    "           class=\"uib-text\">{{ alert.msg }}</uib-alert>\n" +
    "\n" +
    "<div class=\"container-fluid\" ng-show=\"loadingSpinner\">\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-md-12 col-xs-12\">\n" +
    "            <div class=\"well\">\n" +
    "                <i class=\"fa fa-spinner fa-2x  fa-pulse\"></i>&#160;&#160;&#160;Checking for Top Process..\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"modal-body\">\n" +
    "    <div class=\"container-fluid\">\n" +
    "        <div class=\"row\">\n" +
    "            <div class=\"col-md-12\">\n" +
    "                <h5>\n" +
    "                    <strong> OS </strong> : {{ hostinfo.os }} &nbsp;\n" +
    "                    <strong>HW </strong>: {{ hostinfo.mem }} GB, {{ hostinfo.cores }} x {{ hostinfo.cpu }} &nbsp;\n" +
    "                    <strong>PGC</strong> : {{ hostinfo.version }}\n" +
    "                </h5>\n" +
    "\n" +
    "                <h5 ng-if=\"topProcess.cpu_user\">\n" +
    "                    <strong> CPU Usage </strong>: {{ topProcess.cpu_user }} %user &nbsp; {{ topProcess.cpu_system }} %sys &nbsp;\n" +
    "                    {{ topProcess.cpu_idle }} %idle &nbsp; <span ng-if=\"topProcess.iowait\">{{ topProcess.iowait }} %wait &nbsp;</span>\n" +
    "                </h5>\n" +
    "                <h5>\n" +
    "                    <strong>DISK </strong>: kB_read {{ topProcess.kb_read_sec }}/sec &nbsp; ,\n" +
    "                    kB_written {{ topProcess.kb_write_sec }}/sec &nbsp;\n" +
    "                </h5>\n" +
    "                <h5 ng-if=\"topProcess.load_avg\"><strong>Load Average </strong>: {{ topProcess.load_avg }} &nbsp;\n" +
    "                    <strong>Uptime </strong>: {{ topProcess.uptime }} &nbsp;\n" +
    "                </h5>\n" +
    "\n" +
    "                <table class=\"table table-condensed table-bordered\">\n" +
    "                    <thead>\n" +
    "                        <tr>\n" +
    "                            <th class=\"col-md-1\">PID</th>\n" +
    "                            <th class=\"col-md-1\">User</th>\n" +
    "                            <th class=\"col-md-1\">%CPU</th>\n" +
    "                            <th class=\"col-md-1\">%MEM</th>\n" +
    "                            <th class=\"col-md-2\">TIME+</th>\n" +
    "                            <th class=\"col-md-6\">COMMAND</th>\n" +
    "                        </tr>\n" +
    "                    </thead>\n" +
    "                    <tbody>\n" +
    "                        <tr ng-repeat=\"(key, value) in topProcess.top\">\n" +
    "                            <td class=\"col-md-1\">{{ value.pid }}</td>\n" +
    "                            <td class=\"col-md-1\">{{ value.username }}</td>\n" +
    "                            <td class=\"col-md-1\">{{ value.cpu_percent }}</td>\n" +
    "                            <td class=\"col-md-1\">{{ value.memory_percent }}</td>\n" +
    "                            <td class=\"col-md-2\">{{ value.ctime }}</td>\n" +
    "                            <td class=\"col-md-6\">{{ value.name }}</td>\n" +
    "                        </tr>\n" +
    "                    </tbody>\n" +
    "                </table>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"modal-footer\">\n" +
    "    <button class=\"btn btn-danger\" type=\"button\" ng-click=\"cancel()\">Close</button>\n" +
    "</div>")

$templateCache.put("../app/components/partials/updateModal.html","<div class=\"updateModal\">\n" +
    "<div ng-click=\"cancel()\" class=\"close-modal pull-right\" style=\"margin-right: -41px;\n" +
    "    margin-top: 6px;\" data-dismiss=\"modal\" aria-hidden=\"true\">\n" +
    "    <i class=\"fa fa-close fa-lg\"></i>\n" +
    "</div>\n" +
    "<div class=\"modal-body\">\n" +
    "    <uib-alert ng-repeat=\"alert in alerts\" type=\"{{alert.type}}\" dismiss-on-timeout=\"8000\" close=\"closeAlert()\" class=\"uib-text\">{{alert.msg}}</uib-alert>\n" +
    "    <div class=\"container-fluid\">\n" +
    "        <div class=\"row\" id=\"updatesTable\" ng-hide=\"noUpdates\">\n" +
    "            <div ng-show=\"loadingSpinner\">\n" +
    "                <h4 class=\"control-label\" ng-hide=\"noUpdates\"><i class=\"fa fa-spinner fa-2x  fa-pulse\"></i>&#160;&#160;&#160; Checking for updates..</h4>\n" +
    "            </div>\n" +
    "            <h4 class=\"control-label\" ng-hide=\"noUpdates || loadingSpinner\">{{components.length}} Update(s) Available</h4>\n" +
    "            <div class=\"pull-right\" style=\"margin-top: -35px;\">\n" +
    "                <button class=\"btn btn-sm\" type=\"button\" ng-click=\"selectedUpdate()\" ng-hide=\"noUpdates || loadingSpinner\">Update All</button>\n" +
    "            </div>\n" +
    "            <div style=\"border-bottom: 2px solid #ddd;width: 100%;vertical-align: middle;\">\n" +
    "            </div>\n" +
    "            <div class=\"col-md-12 col-xs-12\" id=\"updatesTableTbody \" ng-repeat=\"(key, value) in components\" ng-if=\"value.updates>0 && value.component != 'bam2'\" style=\"border-bottom: 1px solid #ddd;\">\n" +
    "                <div class=\"component_box\" id=\"{{value.component}}\">\n" +
    "                    <div class=\"col-md-2 col-xs-2\">\n" +
    "                        <img class=\"img-responsive\" style=\"width: 35%; padding: 6px; margin-left: 35px;\" ng-src=\"assets/img/component-logos/{{value.componentImage || value.component }}.png\"  err-src=\"assets/img/component-logos/no_img.png\" alt=\"\">\n" +
    "                        <div style=\"text-align: center; white-space: nowrap;\">\n" +
    "                            <a ng-if=\"value.category != 1\"  ng-click=\"cancel(); openDetailsModal(value.component)\">\n" +
    "                                        <strong>{{value.component}}</strong>\n" +
    "                                    </a>\n" +
    "                            <a ng-if=\"value.category == 1\" ui-sref=\"components.detailspg95({component:value.component}) \" ng-click=\"cancel()\">\n" +
    "                                        <strong>{{value.component}}</strong>\n" +
    "                            </a>\n" +
    "                            <br />\n" +
    "                            <div>\n" +
    "                                <i style=\"font-size: smaller; white-space: pre-wrap;\">{{value.short_desc}}</i>\n" +
    "                                <div>Version {{value.current_version}}</div>\n" +
    "                                <div>Released {{value.curr_release_date}}</div>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    <div class=\"col-md-9 col-xs-9\">\n" +
    "                        <div style=\"overflow: auto; height: 100px; margin-bottom: 5px;\" id=\"relnotesId_{{value.component}}\">\n" +
    "                            <div class=\"update-comp-relnotes\" style=\"margin-top: -20px;\" ng-bind-html=\"value.rel_notes\"></div>\n" +
    "                        </div>\n" +
    "                        <a class=\"pull-right\" ng-if=\"value.rel_notes\" id=\"showText_{{value.component}}\" ng-click=\"changeHeight(value.component);\">More....</a>\n" +
    "                    </div>\n" +
    "                    <div class=\"col-md-1 col-xs-1\">\n" +
    "                        <button class=\"btn btn-sm\" type=\"button\" style=\"margin-left: 25px;\" ng-click=\"selectedUpdate(value.component)\" ng-hide=\"noUpdates\">Update</button>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "                <div class=\"row\" ng-show=\"value.installation != undefined\" style=\"width:100%;height:50px; margin-top: 10px;\">\n" +
    "                    <div>\n" +
    "                        <div ng-show=\"value.installationRunning != undefined\" class=\"col-md-4 col-xs-4\">\n" +
    "                            {{value.installationStart.msg}}\n" +
    "                        </div>\n" +
    "                        <div class=\"col-md-3 col-xs-3\" ng-show=\"value.installationRunning != undefined\">\n" +
    "                            <progressbar value=\"value.progress\"></progressbar>\n" +
    "                            <button class=\"btn btn-default btn-xs center-block\" ng-click=\"cancelInstallation('cancelInstall') \">Cancel</button>\n" +
    "                        </div>\n" +
    "                        <div class=\"col-md-2 col-xs-1\" ng-show=\"value.installationRunning != undefined\">\n" +
    "                            {{value.installationRunning.pct}}%\n" +
    "                        </div>\n" +
    "                        <div class=\"col-md-3 col-xs-3\" ng-show=\"value.installationRunning != undefined\">\n" +
    "                            {{value.installationRunning.mb}}\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <br />\n" +
    "        <div class=\"row components-update-msg\" ng-show=\"noUpdates\">\n" +
    "        <div class=\"well\">\n" +
    "            <h4 style=\"padding: 8px;\">All installed components are up-to-date. </h4>\n" +
    "        </div>\n" +
    "        </div>\n" +
    "        <div class=\"row\" ng-hide=\"hideLatestInstalled\">\n" +
    "            <uib-accordion>\n" +
    "                <uib-accordion-group is-open=\"uibStatus.newComponents\">\n" +
    "                  <uib-accordion-heading>\n" +
    "                    <span> Components installed/updated in last 30 days\n" +
    "                    <i class=\"pull-right glyphicon\" ng-class=\"{'fa fa-plus': !uibStatus.newComponents, 'fa fa-minus': uibStatus.newComponents}\"></i>\n" +
    "                    </span> \n" +
    "                  </uib-accordion-heading>\n" +
    "                <div class=\"col-md-12 col-xs-12\" id=\"updatesTableTbody \" ng-repeat=\" value in allComponents | toArray:false | orderBy : 'install_date' : true\" ng-if=\"value.is_updated == 1  && value.component != 'bam2' \" style=\"border-bottom: 1px solid #ddd;\">\n" +
    "                <div class=\"component_box\" id=\"{{value.component}}\">\n" +
    "                    <div class=\"col-md-2 col-xs-2\">\n" +
    "                        <!-- <input type=\"checkbox\" ng-model=\"value.selected\" ng-checked=\"selectedComp.component == value.component\"> -->\n" +
    "                        <img class=\"img-responsive\" style=\"width: 35%; padding: 5px; margin-left: 35px;\" ng-src=\"assets/img/component-logos/{{value.componentImage || value.component}}.png\"  err-src=\"assets/img/component-logos/no_img.png\" alt=\"\">\n" +
    "                        <div style=\"text-align: center; white-space: nowrap;\">\n" +
    "                            <a ng-if=\"value.category != 1\"  ng-click=\"cancel(); openDetailsModal(value.component)\">\n" +
    "                                        <strong>{{value.component}}</strong>\n" +
    "                                    </a>\n" +
    "                            <a ng-if=\"value.category == 1\" ui-sref=\"components.detailspg95({component:value.component}) \" ng-click=\"cancel()\">\n" +
    "                                        <strong>{{value.component}}</strong>\n" +
    "                            </a>\n" +
    "                            <br />\n" +
    "                            <i style=\"font-size: smaller;\">{{value.short_desc}}</i>\n" +
    "                            <div>Version {{value.version}}</div>\n" +
    "                            <div>Install Date {{value.install_date}}</div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    <div class=\"col-md-1 col-xs-1\"></div>\n" +
    "                    <div class=\"col-md-9 col-xs-9\">\n" +
    "                        <div style=\"overflow: auto; height: 100px; margin-bottom: 5px;\" id=\"installedRelnotes_{{value.component}}\">\n" +
    "                            <div class=\"update-comp-relnotes\" style=\"margin-top: -20px;\" ng-bind-html=\"value.rel_notes\"></div>\n" +
    "                        </div>\n" +
    "                        <a class=\"pull-right\" ng-if=\"value.rel_notes\" id=\"installedshowText_{{value.component}}\" ng-click=\"changeHeightInstalled(value.component);\">More....</a>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "                </uib-accordion-group>    \n" +
    "            </uib-accordion>\n" +
    "\n" +
    "        </div>\n" +
    "        <div class=\"row components-update-msg\" ng-hide=\"!hideLatestInstalled\">\n" +
    "        <div class=\"well\">\n" +
    "            <h4 style=\"padding: 8px;\">No components installed/updated in the last 30 days </h4>\n" +
    "        </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"row\" ng-if=\"hideNewComponents\">\n" +
    "            <uib-accordion>\n" +
    "                <uib-accordion-group is-open=\"uibStatus.installedComponents\">\n" +
    "                  <uib-accordion-heading>\n" +
    "                    <span> New components released in the last 30 days \n" +
    "                    <i class=\"pull-right glyphicon\" ng-class=\"{'fa fa-plus': !uibStatus.installedComponents, 'fa fa-minus': uibStatus.installedComponents}\"></i>\n" +
    "                    </span> \n" +
    "                  </uib-accordion-heading>\n" +
    "                    <!-- <div class=\"box-body update-modal-table-header\">\n" +
    "                        <div class=\"col-md-4 col-xs-4\"><strong>Release Date</strong></div>\n" +
    "                        <div class=\"col-md-4 col-xs-4\"><strong>Component Type</strong></div>\n" +
    "                        <div class=\"col-md-4 col-xs-4\"><strong>Component</strong></div>\n" +
    "                    </div>\n" +
    "                    <div class=\"col-md-12 col-xs-12 update-modal-table\" id=\"updatesTableTbody \" ng-repeat=\"(key, value) in allComponents | toArray:false | orderBy : 'release_date' : true\" ng-if=\"value.is_new == 1 && value.component != 'bam2' \">\n" +
    "                        <div class=\"component_box\" id=\"{{value.component}}\">\n" +
    "                            <div class=\"col-md-4 col-xs-4\">\n" +
    "                                <span>{{value.release_date}}</span>\n" +
    "                            </div>\n" +
    "                            <div class=\"col-md-4 col-xs-4\">\n" +
    "                                <span>{{value.category_desc}}</span>\n" +
    "                            </div>\n" +
    "                            <div class=\"col-md-4 col-xs-4\">\n" +
    "                                <a ng-if=\"value.category != 1\" ng-click=\"cancel(); openDetailsModal(value.component)\">\n" +
    "                                    {{value.disp_name}}\n" +
    "                                </a> \n" +
    "                                <a ng-if=\"value.category == 1\" ui-sref=\"components.detailspg95({component:value.component}) \" ng-click=\"cancel()\">\n" +
    "                                {{value.disp_name}}\n" +
    "                                </a>                   \n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                    </div> -->\n" +
    "                    <div class=\"col-md-12 col-xs-12\" id=\"updatesTableTbody \" ng-repeat=\"(key, value) in allComponents | toArray:false | orderBy : 'release_date' : true\" ng-if=\"value.is_new == 1 && value.component != 'bam2' \" style=\"border-bottom: 1px solid #ddd;\">\n" +
    "                <div class=\"component_box\" id=\"{{value.component}}\">\n" +
    "                    <div class=\"col-md-2 col-xs-2\">\n" +
    "                        <!-- <input type=\"checkbox\" ng-model=\"value.selected\" ng-checked=\"selectedComp.component == value.component\"> -->\n" +
    "                        <img class=\"img-responsive\" style=\"width: 35%; padding: 5px;margin-left: 35px;\" ng-src=\"assets/img/component-logos/{{value.componentImage || value.component}}.png\"  err-src=\"assets/img/component-logos/no_img.png\" alt=\"\">\n" +
    "                        <div style=\"text-align: center; white-space: nowrap;\">\n" +
    "                            <a ng-if=\"value.category != 1\"  ng-click=\"cancel(); openDetailsModal(value.component)\">\n" +
    "                                        <strong>{{value.component}}</strong>\n" +
    "                                    </a>\n" +
    "                            <a ng-if=\"value.category == 1\" ui-sref=\"components.detailspg95({component:value.component}) \" ng-click=\"cancel()\">\n" +
    "                                        <strong>{{value.component}}</strong>\n" +
    "                            </a>\n" +
    "                            <br />\n" +
    "                            <i style=\"font-size: smaller;\">{{value.short_desc}}</i>\n" +
    "                            <div>Version {{value.version}}</div>\n" +
    "                            <div>Released {{value.curr_release_date}}</div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    <div class=\"col-md-1 col-xs-1\"></div>\n" +
    "                    <div class=\"col-md-9 col-xs-9\">\n" +
    "                        <div style=\"overflow: auto; height: 100px; margin-bottom: 5px;\" id=\"releasedRelnotesId_{{value.component}}\">\n" +
    "                            <div class=\"update-comp-relnotes\" style=\"margin-top: -20px;\" ng-bind-html=\"value.rel_notes\"></div>\n" +
    "                        </div>\n" +
    "                        <a class=\"pull-right\" ng-if=\"value.rel_notes\" id=\"releasedShowText_{{value.component}}\" ng-click=\"changeHeightReleased(value.component);\">More....</a>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "                </uib-accordion-group>    \n" +
    "             </uib-accordion>\n" +
    "\n" +
    "        <!-- /.box -->\n" +
    "        <!-- /.box -->\n" +
    "    </div>\n" +
    "    <div class=\"row components-update-msg\" ng-if=\"!hideNewComponents\">\n" +
    "        <div class=\"well\">\n" +
    "            <h4 style=\"padding: 8px;\">No new components released in the last 30 days </h4>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "        <div class=\"modal-footer\">\n" +
    "        </div>\n" +
    "</div>")

$templateCache.put("../app/components/partials/userForm.html","<form class=\"form\" name=\"userForm\">\n" +
    "    <div class=\"col-md-1\">\n" +
    "        <button class=\"btn btn-default\" ng-model=\"value.id\" ng-disabled=\"value.id == 1\" ng-click=\"deleteUser(value.id)\"> \n" +
    "            <i class=\"fa fa-trash\"></i>\n" +
    "        </button>\n" +
    "    </div>\n" +
    "    <div class=\"col-md-4\">\n" +
    "        <div class=\"form-group\">\n" +
    "            <input type=\"email\" ng-disabled=\"!value.new\" ng-model=\"value.email\" name=\"email\" class=\"form-control\" ng-model=\"main.email\" ng-minlength=\"5\" ng-maxlength=\"20\" required>\n" +
    "            <span ng-show = \"userForm.email.$error.email\"> Invalid Email</span>\n" +
    "            <!-- ngMessages goes here -->\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"col-md-2\">\n" +
    "        <div class=\"form-group\">\n" +
    "            <select class=\"form-control form-control-sm\" ng-disabled=\"value.id == 1\" ng-model=\"value.role\" ng-change=\"updateRole()\" ng-options=\"role.id as role.name for (key, role) in roles\" required>\n" +
    "            </select>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"col-md-1\">\n" +
    "        <label>\n" +
    "            <input type=\"checkbox\" ng-model=\"value.active\" ng-disabled=\"value.id == 1\" ng-change=\"updateActive()\" ng-checked=\"value.active\">\n" +
    "            <span class=\"custom-control-indicator\"></span>\n" +
    "        </label>\n" +
    "    </div>\n" +
    "    <div class=\"col-md-2\">\n" +
    "        <div class=\"form-group\">\n" +
    "            <input class=\"form-control\" ng-disabled=\"!value.email && value.id != 1\" type=\"password\" id=\"inputPassword\" name=\"password\" ng-model=\"formdata.password\" valid-user-password required />\n" +
    "            <span ng-show=\"!!userForm.password.$error.invalidLen\">Must be 6 characters.</span>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"col-md-2\">\n" +
    "        <div class=\"form-group\">\n" +
    "            <input class=\"form-control\" ng-disabled=\"!value.email && value.id != 1\" type=\"password\" id=\"password_c\" name=\"password_c\" ng-model=\"formdata.password_c\" confirm-password required/>\n" +
    "        </div>\n" +
    "        <span ng-show=\"!userForm.password_c.$error.required && userForm.password_c.$error.noMatch && userForm.password.$dirty\">Passwords do not match.</span>\n" +
    "    </div>\n" +
    "    <span class=\"form-actions\" ng-show=\"formSave()\">\n" +
    "    </span>\n" +
    "</form>")

$templateCache.put("../app/components/partials/usersModal.html","<div class=\"modal-header\">\n" +
    "    <h2 class=\"modal-title\" id=\"updateModalLabel\"> User Management</h2>\n" +
    "</div>\n" +
    "<div ng-click=\"cancel()\" class=\"close-modal\" data-dismiss=\"modal\" aria-hidden=\"true\">\n" +
    "    <div class=\"lr\">\n" +
    "        <div class=\"rl\">\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "<uib-alert ng-repeat=\"alert in alerts\" type=\"{{alert.type}}\" dismiss-on-timeout=\"8000\" close=\"closeAlert()\" class=\"uib-text\">{{alert.msg}}</uib-alert>\n" +
    "\n" +
    "<div class=\"container-fluid\" ng-show=\"loadingSpinner\">\n" +
    "    <div class=\"row\">\n" +
    "        <div class=\"col-md-12 col-xs-12\">\n" +
    "            <div class=\"well\">\n" +
    "                <i class=\"fa fa-spinner fa-2x  fa-pulse\"></i>&#160;&#160;&#160;Checking for users..\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"modal-body\">\n" +
    "            <div class=\"row\">\n" +
    "                <span class=\"pull-right\" ng-click=\"addAuserForm()\">\n" +
    "                    <i class=\"fa fa-user-plus\" aria-hidden=\"true\"></i>  \n" +
    "                    <strong>Add User</strong> &nbsp;&nbsp;\n" +
    "                </span>     \n" +
    "            </div>\n" +
    "            <br />\n" +
    "            <div class=\"row\" >\n" +
    "                <div class=\"col-md-1 col-xs-1\"><strong></strong></div>\n" +
    "                <div class=\"col-md-4 col-xs-4\"><strong>Email</strong></div>\n" +
    "                <div class=\"col-md-2 col-xs-2\"><strong>Role</strong></div>\n" +
    "                <div class=\"col-md-1 col-xs-1\"><strong>Active</strong></div>\n" +
    "                <div class=\"col-md-2 col-xs-2\"><strong>New Password</strong></div>\n" +
    "                <div class=\"col-md-2 col-xs-2\"><strong>Confirm Password</strong></div>\n" +
    "            </div>\n" +
    "            <div class=\"row\" id=\"updatesTableTbody \" ng-repeat=\"(key, value) in users\">\n" +
    "                \n" +
    "                <user-details-row roles=\"roles\" value=\"value\"></user-details-row> \n" +
    "                \n" +
    "            </div>\n" +
    "\n" +
    "        <!-- /.box -->\n" +
    "        <!-- /.box -->\n" +
    "</div>\n" +
    "<div class=\"modal-footer\">\n" +
    "    <button class=\"btn btn-danger\" type=\"button\" ng-click=\"cancel()\">Close</button>\n" +
    "</div>")

$templateCache.put("../app/components/partials/view.html","<section class=\"content-header\">\n" +
    "    <server-info-details title=\"Package Manager\"></server-info-details>\n" +
    "    <div class=\"components-update-button-wrapper\">\n" +
    "        <label>\n" +
    "            <input type=\"checkbox\" ng-model=\"isList\" ng-click=\"setTest()\">&nbsp; Show test components</input>\n" +
    "        </label>\n" +
    "        &nbsp;\n" +
    "        &nbsp;\n" +
    "        <label>\n" +
    "            <input type=\"checkbox\" ng-model=\"showInstalled\" ng-disabled=\"disableShowInstalled\" ng-click=\"installedComps()\"></input> Show installed only\n" +
    "        </label>\n" +
    "        &nbsp;\n" +
    "        &nbsp;\n" +
    "        <button ng-click=\"open('manual')\" class=\"btn btn-default\" type=\"button\" ng-if=\"updateSettings == 'manual'\"> Check for updates now</button>         \n" +
    "    </div>\n" +
    "    <uib-alert ng-repeat=\"alert in alerts\" type=\"{{alert.type}}\" dismiss-on-timeout=\"8000\" close=\"closeAlert()\" class=\"uib-text\">{{alert.msg}}</uib-alert>\n" +
    "</section>\n" +
    "\n" +
    "<span id=\"components\"></span>\n" +
    "<section class=\"content\">\n" +
    "    <uib-tabset>\n" +
    "        <uib-tab  heading=\"PostgreSQL\">\n" +
    "            <uib-tab-heading>\n" +
    "              <div style=\"text-align: center;\">BigSQL Repository</div>\n" +
    "            </uib-tab-heading>\n" +
    "            <div class=\"box\" style=\"border-top: 0px;\">\n" +
    "            <div class=\"box-body\">\n" +
    "            <div ng-if=\"loading\"  style=\"height: 250px\">\n" +
    "            <div ng-if=\"loading\" style=\"position: absolute;width: 100px; top: 50%;left: 50%; margin-left: -50px; margin-top: -25px;\">\n" +
    "                <i class=\"fa fa-cog fa-spin fa-5x fa-fw margin-bottom\"></i>\n" +
    "                <span><h3>Loading...</h3></span>\n" +
    "            </div>\n" +
    "            </div>\n" +
    "            <span ng-if=\"retry\" style=\"text-align: center;\"> <h4>Cannot connect to PGC. Retrying connection ... </h4> </span>\n" +
    "            <div ng-if=\"nothingInstalled\" class=\"jumbotron\" style=\"background-color: #fff; margin-top: 15px; text-align: center;\"> <h3> You haven't installed anything yet</h3>\n" +
    "            </div>\n" +
    "            <div ng-if=\"!loading && !retry\">\n" +
    "                <div ng-repeat=\"(key, value) in components | groupBy: 'category_desc'\">\n" +
    "                    <div class=\"box-header\" ng-if=\"key != 'Extensions'\">\n" +
    "                        <h3 class=\"box-title\" ng-bind=\"key\" ng-if=\"value.length\"></h3>\n" +
    "                    </div>\n" +
    "                    <div class=\"row\">\n" +
    "                        <div class=\"col-md-2 col-sm-3 col-xs-6\" ng-repeat=\"c in value\" ng-if=\"c.category_desc == 'PostgreSQL'\">\n" +
    "                            <i class=\"fa fa-check-circle-o fa-2x pull-right installedSymbol\" ng-if=\"c.status == 'Installed'|| c.status == 'NotInitialized'\"></i>\n" +
    "                            <span class=\"update-component-arrow-wrapper\" tooltip-append-to-body=\"true\" uib-tooltip=\"New version available: {{c.current_version}}\" ng-if=\"c.updates>0\">\n" +
    "                                <i class=\"fa fa-arrow-circle-down fa-2x\" id=\"updateIcon\" style=\"color: #FF8A21\"></i>\n" +
    "                            </span>\n" +
    "                            <span class=\"test-comp-icon\" ng-if=\"c.stage != 'prod'\" tooltip-append-to-body=\"true\" uib-tooltip=\"Test Component\"></span>\n" +
    "                            <div ng-class=\"c.extensionOpened && extensionsList.length ? 'select-comp-area' : 'comp-area'\" ng-click=\"getExtensions(c.component, $index)\">\n" +
    "                                <img class=\"comp-img img-responsive\" ng-src=\"assets/img/component-logos/{{ c.component }}.png\"  err-src=\"assets/img/component-logos/no_img.png\" alt=\"\">\n" +
    "                                <div class=\"caption\">\n" +
    "                                    <div style=\"white-space: nowrap; text-align: center;\">\n" +
    "                                        <h5>\n" +
    "                                            <a href=\"#/details-pg/{{c.component}}\">{{c.disp_name}}</a>\n" +
    "                                        </h5>\n" +
    "                                    </div>\n" +
    "                                    <div ng-class=\"c.extensionOpened ? 'expandExt' : ''\" ng-if=\"extensionsList.length\">\n" +
    "                                        <h5 ng-if=\"c.extensionOpened\">\n" +
    "                                            <strong>Extensions</strong>\n" +
    "                                        </h5>\n" +
    "                                    </div>\n" +
    "                                </div>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    <div class=\"row extensions-row\" ng-if=\"$index == 0 && extensionsList.length\">\n" +
    "                        <div class=\"col-md-2 col-sm-3 col-xs-6 extensions-area\" ng-click=\"openDetailsModal(ext.component)\" style=\"width: 11.499999995% ; padding: 13px;\" ng-repeat=\"ext in extensionsList\">\n" +
    "                            <span class=\"badge new-comp-wrapper\" ng-if=\"ext.is_new == 1 && ext.status == 'NotInstalled'\" style=\"position: absolute;\" tooltip-append-to-body=\"true\" uib-tooltip=\"Release date: {{ ext.release_date }}\">New</span>\n" +
    "                            <i class=\"fa fa-check-circle-o pull-right installedSymbol\" ng-if=\"ext.status == 'Installed'|| ext.status == 'NotInitialized'\" style=\"position: absolute; margin-left: 95px\"></i>\n" +
    "                            <span class=\"update-component-arrow-wrapper\" style=\"position: absolute;\" tooltip-append-to-body=\"true\" uib-tooltip=\"New version available: {{ext.current_version}}\" ng-if=\"ext.updates>0\">\n" +
    "                                <i class=\"fa fa-arrow-circle-down\" id=\"updateIcon\" style=\"color: #FF8A21\"></i>\n" +
    "                            </span>\n" +
    "                            <span class=\"test-comp-icon\" ng-if=\"ext.stage != 'prod'\" tooltip-append-to-body=\"true\" uib-tooltip=\"Test Component\"></span>\n" +
    "                            <div class=\"extension-area-comp\">\n" +
    "                                <img class=\"comp-img img-responsive ext-img\" ng-src=\"assets/img/component-logos/{{ ext.modifiedName }}.png\"  err-src=\"assets/img/component-logos/no_img.png\" alt=\"\">\n" +
    "                                <div class=\"description-style\">\n" +
    "                                    <h5 style=\"margin-bottom: 4px;\">\n" +
    "                                        <a>{{ext.disp_name}}</a>\n" +
    "                                    </h5>\n" +
    "                                    <i>{{ext.short_desc}}</i>\n" +
    "                                </div>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                    <div class=\"row non-pg-comp-row\">\n" +
    "                        <div class=\"col-md-2 col-sm-3 col-xs-6\" ng-click=\"openDetailsModal(c.component)\" style=\"width: 11.499999995% ; padding: 0px 13px 13px 13px;\" ng-repeat=\"c in value\" ng-if=\"c.category_desc != 'PostgreSQL' && c.category_desc != 'Extensions' && c.component != 'devops' && c.component != 'bam2'\">\n" +
    "                            <span class=\"badge new-comp-wrapper\" ng-if=\"c.is_new == 1 && c.status == 'NotInstalled'\" tooltip-append-to-body=\"true\" uib-tooltip=\"Release date: {{ c.release_date }}\" style=\"position: absolute;\">New</span>\n" +
    "                            <i class=\"fa fa-check-circle-o pull-right installedSymbol\" ng-if=\"c.status == 'Installed'|| c.status == 'NotInitialized'\" style=\"position: absolute; margin-left: 95px\"></i>\n" +
    "                            <span class=\"update-component-arrow-wrapper\" style=\"position: absolute;\" tooltip-append-to-body=\"true\" uib-tooltip=\"New version available: {{c.current_version}}\" ng-if=\"c.updates>0\">\n" +
    "                                <i class=\"fa fa-arrow-circle-down\" id=\"updateIcon\" style=\"color: #FF8A21\"></i>\n" +
    "                            </span>\n" +
    "                            <span class=\"test-comp-icon\" ng-if=\"c.stage != 'prod'\" tooltip-append-to-body=\"true\" uib-tooltip=\"Test Component\"></span>\n" +
    "                            <div class=\"extension-area-comp\">\n" +
    "                                <img class=\"comp-img ext-img img-responsive\" ng-src=\"assets/img/component-logos/{{ c.component }}.png\"  err-src=\"assets/img/component-logos/no_img.png\" alt=\"\">\n" +
    "                                <div class=\"description-style\">\n" +
    "                                    <h5 style=\"margin-bottom: 4px;\">\n" +
    "                                        <a>{{c.disp_name}}</a>\n" +
    "                                    </h5>\n" +
    "                                    <i>{{c.short_desc}}</i>\n" +
    "                                </div>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            </div>\n" +
    "            </div>\n" +
    "    </uib-tab>\n" +
    "    <uib-tab ng-if=\"showPgDgTab && checkpgdgSetting\" select=\"selectPgDg($event)\">\n" +
    "        <uib-tab-heading>\n" +
    "          <div style=\"text-align: center;\">PGDG Repositories</div>\n" +
    "        </uib-tab-heading>\n" +
    "        <div class=\"box\" style=\"border-top: 0px;\">\n" +
    "        <div class=\"box-body\">\n" +
    "        <div style=\"display: table;\" ng-if=\"showRepoList && !noRepoFound\">\n" +
    "            <label style=\"display: table-cell;\">Repository:&nbsp;</label>\n" +
    "            <select style=\"display: table-cell;\" class=\"form-control\" ng-model=\"selectRepo\" ng-change=\"repoChange(selectRepo)\" ng-options=\"repo.repo as repo.repo for repo in pgdgRepoList\">\n" +
    "            </select>\n" +
    "        </div>\n" +
    "        <br>\n" +
    "        <div ng-if=\"noRepoFound\">\n" +
    "            <div class=\"alert alert-warning\" role=\"alert\">\n" +
    "                    You haven't registered any pgdg repositories. Select a repository below to register it.\n" +
    "            </div>\n" +
    "            <br>\n" +
    "            <div class=\"pull-left\" style=\"display: table;\">\n" +
    "                <label style=\"display: table-cell;\">Available Repositories : &nbsp;</label>\n" +
    "                <select style=\"display: table-cell;\" class=\"form-control\" ng-model=\"selectAvailRepo\" ng-options=\"rep.repo as rep.repo for rep in availRepos\">\n" +
    "                </select>\n" +
    "            </div>\n" +
    "            <div> \n" +
    "                &nbsp;<button class=\"btn btn-default\" ng-click=\"registerRepo(selectAvailRepo)\" ng-disabled=\"registeringRepo\">Register</button>                \n" +
    "            </div>\n" +
    "            <div ng-if=\"registeringRepo\"><i class='fa fa-spinner fa-2x  fa-pulse'></i> &nbsp;Registering {{selectAvailRepo}}.....</div>\n" +
    "        </div>\n" +
    "        <div ng-if=\"repoNotRegistered\">\n" +
    "            <div class=\"alert alert-warning\" role=\"alert\">\n" +
    "                    {{errorMsg}}\n" +
    "            </div>\n" +
    "            <br>\n" +
    "            <div> \n" +
    "                &nbsp;<button class=\"btn btn-default\" ng-click=\"registerRepo(selectRepo)\" ng-disabled=\"registeringRepo\">Register</button>                \n" +
    "            </div>\n" +
    "            <div ng-if=\"registeringRepo\"><i class='fa fa-spinner fa-2x  fa-pulse'></i> &nbsp;Registering {{selectAvailRepo}}.....</div>\n" +
    "        </div>\n" +
    "        <!-- <span ng-if=\"repoNotRegistered\"> Repo is not registerd.</span> -->\n" +
    "        <div ng-if=\"gettingPGDGdata \"  style=\"height: 250px\">\n" +
    "        <div style=\"position: absolute; width: 100px; top: 50%;left: 50%; margin-left: -50px; margin-top: -25px;\">\n" +
    "            <i class=\"fa fa-cog fa-spin fa-5x fa-fw margin-bottom\"></i>\n" +
    "            <span><h3>Loading...</h3></span>\n" +
    "        </div>\n" +
    "        </div>\n" +
    "        <div class=\"box\" ng-if=\"!gettingPGDGdata && !noRepoFound && !repoNotRegistered\">\n" +
    "            <div class=\"box-body\">\n" +
    "                <div id=\"serversTable\">\n" +
    "                    <div class=\"component_head_box\">\n" +
    "                        <div class=\"col-md-3 col-sm-3 col-xs-3\"><strong>Component</strong></div>\n" +
    "                        <div class=\"col-md-3 col-sm-3 col-xs-3\"><strong>Version</strong></div>\n" +
    "                        <div class=\"col-md-2 col-sm-2 col-xs-2\"><strong>Release Date</strong></div>\n" +
    "                        <div class=\"col-md-1 col-sm-1 col-xs-1\"><strong>Installed</strong></div>\n" +
    "                        <div class=\"col-md-3 col-sm-3 col-xs-3\"><strong>Actions</strong></div>\n" +
    "                    </div>\n" +
    "                    <div id=\"serversTableTbody\">\n" +
    "                        <div ng-repeat=\"c in repoList\" class= \"component_box\" ng-class-odd=\"'oddRow'\" style=\"border-bottom: 1px solid #f4f4f4;\">\n" +
    "                            <div class=\"col-md-3 col-sm-3 col-xs-3\">\n" +
    "                                <div class=\"comp-name\">\n" +
    "                                    <a class=\"serversTableTbody-component--link\" tooltip-append-to-body=\"true\" ng-bind = \"c.component\">\n" +
    "                                    {{c.component}}\n" +
    "                                    </a>\n" +
    "                                </div>\n" +
    "                            </div>\n" +
    "                            <div class=\"col-md-3 col-sm-3 col-xs-3\">\n" +
    "                                {{c.version}}\n" +
    "                            </div>\n" +
    "                            <div class=\"col-md-2 col-sm-2 col-xs-2\">{{c.release_date}}</div>\n" +
    "                            <div class=\"col-md-1 col-sm-1 col-xs-1\">\n" +
    "                            <i style=\"color:green; \" class=\"fa fa-check-circle-o fa-2x \" ng-if=\"c.status == 'Installed' && c.removing == undefined || c.status == 'NotInitialized' && c.removing == undefined && c.init == undefined \" ng-hide=\"c.showingSpinner\"></i>\n" +
    "                            <i class='fa fa-spinner fa-2x  fa-pulse' ng-if=\"c.removing || c.init || c.showingSpinner\">\n" +
    "                            </i>\n" +
    "                            </div>\n" +
    "                            <div class=\"col-md-3 col-sm-3 col-xs-3\" style=\"padding-left: 10px; margin-top: -7px;\">\n" +
    "                                <a class=\"btn btn-default\" ng-click=\"pgdgAction( 'install', c.component) \" ng-if=\"c.status == 'NotInstalled' || c.status == ''\" ng-disabled=\" c.showingSpinner || true\">Install</a>\n" +
    "                                <a class=\"btn btn-default\" ng-click=\"pgdgAction( 'remove', c.component) \" ng-if=\"c.status == 'Installed'\" ng-disabled=\" c.showingSpinner || true\">Remove</a>\n" +
    "                            </div>\n" +
    "                        </div>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        </div>\n" +
    "        </div>\n" +
    "        </uib-tab>\n" +
    "    </uib-tabset>\n" +
    "</section>")

$templateCache.put("../app/components/partials/whatsNew.html","<div ng-click=\"cancel()\" style=\"padding: 10px;\" class=\"close-modal pull-right\" data-dismiss=\"modal\" aria-hidden=\"true\">\n" +
    "        <i class=\"fa fa-lg fa-close\"></i>\n" +
    "    </div>\n" +
    "<div class=\"modal-header\">\n" +
    "    <h3 class=\"modal-title\">What's New</h3>\n" +
    "</div>\n" +
    "<div class=\"modal-body\">\n" +
    "	<div style=\"height: 500px; overflow: auto;\">\n" +
    "    	<span ng-bind-html=\"whatsNewText\"></span>\n" +
    "    </div>\n" +
    "</div>")

$templateCache.put("../app/menus/partials/bamHeaderUpdate.html","<div ng-show=\"bamUpdate\">\n" +
    "    <div class=\"bamUpdateVisor\">\n" +
    "    	<span>An update to the BigSQL Ops Manager is available. Click the button to continue </span><button class=\"btn btn-default\" ng-click=\"open()\">Update</button>\n" +
    "    </div>\n" +
    "</div>")

$templateCache.put("../app/menus/partials/leftMenu.html","<aside class=\"main-sidebar\">\n" +
    "    <!-- sidebar: style can be found in sidebar.less -->\n" +
    "    <section class=\"sidebar\">\n" +
    "        <!-- search form -->\n" +
    "        <form action=\"#\" method=\"get\" class=\"sidebar-form\">\n" +
    "            <div class=\"input-group\">\n" +
    "                <input type=\"text\" name=\"q\" class=\"form-control\" placeholder=\"Search...\">\n" +
    "                <span class=\"input-group-btn\">\n" +
    "                <button type=\"submit\" name=\"search\" id=\"search-btn\" class=\"btn btn-flat\"><i class=\"fa fa-search\"></i>\n" +
    "                </button>\n" +
    "              </span>\n" +
    "            </div>\n" +
    "        </form>\n" +
    "        <!-- /.search form -->\n" +
    "        <!-- sidebar menu: : style can be found in sidebar.less -->\n" +
    "        <ul class=\"sidebar-menu\">\n" +
    "            <li class=\"header\">MAIN NAVIGATION</li>\n" +
    "            <li>\n" +
    "                <a href=\"/\">\n" +
    "                    <i class=\"fa fa-home\"></i> <span>Dashboard</span>\n" +
    "                    <i class=\"fa fa-angle-left pull-right\"></i>\n" +
    "                </a>\n" +
    "            </li>\n" +
    "            <li>\n" +
    "                <a ui-sref=\"components.view\">\n" +
    "                    <i class=\"bgs bgs-sm bgs-package-manager-menu\"></i> <span>Package Manager</span>\n" +
    "                </a>\n" +
    "            </li>\n" +
    "            <!--<li>\n" +
    "                <a ui-sref=\"components.status\">\n" +
    "                    <i class=\"fa fa-dashboard\"></i> <span>Server Status</span>\n" +
    "                </a>\n" +
    "            </li> -->\n" +
    "            <li>\n" +
    "                <a ui-sref=\"components.badger\">\n" +
    "                    <i class=\"bgs bgs-sm bgs-pgbadger-menu\">&nbsp;&nbsp;&nbsp;&nbsp;</i> <span>pgBadger Console</span>\n" +
    "                </a>\n" +
    "            </li>\n" +
    "            <li>\n" +
    "                <a ui-sref=\"components.profiler\">\n" +
    "                    <i class=\"bgs bgs-sm bgs-plprofiler-menu\">&nbsp;&nbsp;&nbsp;&nbsp;</i> <span>plProfiler Console</span>\n" +
    "                </a>\n" +
    "            </li>\n" +
    "            <li>\n" +
    "                <a ui-sref=\"components.componentLog({component:'pgcli'})\">\n" +
    "                    <i class=\"fa fa-file-text-o\"></i> <span>Log Tailer</span>\n" +
    "                </a>\n" +
    "            </li>\n" +
    "            <li>\n" +
    "                <a ui-sref=\"components.hosts\">\n" +
    "                    <i class=\"fa fa-cloud\"></i> <span>Host Manager</span>\n" +
    "                    <!-- <i class=\"fa fa-angle-left pull-right\"></i> -->\n" +
    "                </a>\n" +
    "            </li>\n" +
    "            <!-- <li>\n" +
    "                <a href=\"/admin\">\n" +
    "                    <i class=\"fa fa-paw\"></i> <span>Dev Manager </span>\n" +
    "                </a>\n" +
    "            </li> -->\n" +
    "            <li>\n" +
    "                <a ui-sref=\"components.settingsView\">\n" +
    "                    <i class=\"fa fa-cog\"></i> <span>Settings</span>\n" +
    "                </a>\n" +
    "            </li>\n" +
    "        </ul>\n" +
    "    </section>\n" +
    "    <!-- /.sidebar -->\n" +
    "</aside>")

$templateCache.put("../app/menus/partials/topMenu.html","<header class=\"main-header\">\n" +
    "    <div class=\"btn-group pull-left hamburger-menu\" uib-dropdown>\n" +
    "        <a class=\"btn btn-dropdown sidebar-toggle\" uib-dropdown-toggle>\n" +
    "            <span class=\"icon-bar\"></span>\n" +
    "            <span class=\"icon-bar\"></span>\n" +
    "            <span class=\"icon-bar\"></span>        \n" +
    "        </a>\n" +
    "        <ul uib-dropdown-menu role=\"menu\" style=\"margin-top: 0px\" \n" +
    "            aria-labelledby=\"btn-append-to-single-button\" >\n" +
    "            <li role=\"menuitem\"><a href=\"/admin\">pgAdmin4 Web</a></li>\n" +
    "        </ul>\n" +
    "    </div>\n" +
    "    <!-- Logo -->\n" +
    "    <!-- <a href=\"/\" class=\"logo\"> -->\n" +
    "        <!-- mini logo for sidebar mini 50x50 pixels -->\n" +
    "        <!-- <span class=\"logo-mini\"></span> -->\n" +
    "        <!-- logo for regular state and mobile devices -->\n" +
    "        <!-- <span class=\"logo-lg\"></span> -->\n" +
    "    <!-- </a> -->\n" +
    "    <!-- Header Navbar: style can be found in header.less -->\n" +
    "    <nav class=\"navbar navbar-static-top\" role=\"navigation\">\n" +
    "        <!-- Sidebar toggle button-->\n" +
    "        <!--  <a href=\"#\" class=\"sidebar-toggle\" data-toggle=\"offcanvas\" role=\"button\">\n" +
    "                    <span class=\"sr-only\">Toggle navigation</span>\n" +
    "                </a> -->\n" +
    "        <!-- Navbar Right Menu -->\n" +
    "        <a href=\"/\" class=\"logo\"></a>\n" +
    "        <h1 id=\"pgc-logo\">pgDevOps by BigSQL</h1>\n" +
    "\n" +
    "        <div class=\"navbar-custom-menu\">\n" +
    "            <ul class=\"nav navbar-nav\">\n" +
    "                <!-- Notifications: style can be found in dropdown.less -->\n" +
    "                <li>\n" +
    "\n" +
    "                </li>\n" +
    "                <li ng-click=\"openDetailsModal()\" id=\"pgDevOpsUpdate\" ng-if=\"pgdevopsUpdate\">\n" +
    "                    <!-- <button class=\"btn btn-default btn-sm btn-warning\" style=\"margin-top: 12px\">New version of pgDevOps available</button> -->\n" +
    "                    <a href=\"\">\n" +
    "                        <div>\n" +
    "                            <small class=\"label bg-orange\">New version of pgDevOps available\n" +
    "                            </small>\n" +
    "                        </div>\n" +
    "                    </a>\n" +
    "                </li>\n" +
    "                <li ng-click=\"open()\" id=\"updatesAvailable\" ng-if=\"updates\">\n" +
    "                    <a href=\"\">\n" +
    "                        <div>\n" +
    "                            <small class=\"label bg-orange\"><i class=\"fa fa-arrow-circle-down\"></i> {{ updates }} Updates\n" +
    "                                Available\n" +
    "                            </small>\n" +
    "                        </div>\n" +
    "                    </a>\n" +
    "                </li>\n" +
    "                <li>\n" +
    "                    <div class=\"btn-group userinfo-btn\" uib-dropdown >\n" +
    "                        <button id=\"btn-append-to-single-button\" type=\"button\" class=\"btn btn-dropdown\" uib-dropdown-toggle>\n" +
    "                        Help  <span class=\"caret\"></span>\n" +
    "                        </button>\n" +
    "                        \n" +
    "                         <ul class=\"dropdown-menu\" style=\"margin-left: -80px\" uib-dropdown-menu role=\"menu\" aria-labelledby=\"btn-append-to-single-button\">\n" +
    "                           <li><a target=\"_blank\" href=\"https://www.bigsql.org/about.jsp\"><i class=\"fa fa-external-link\" aria-hidden=\"true\"></i>About BigSQL</a></li>\n" +
    "                           <li><a target=\"_blank\" href=\"https://www.bigsql.org/forum.jsp\"><i class=\"fa fa-external-link\" aria-hidden=\"true\"></i>Feedback</a></li>\n" +
    "                           <li><a target=\"_blank\" href=\"https://www.bigsql.org/docs/\"><i class=\"fa fa-external-link\" aria-hidden=\"true\"></i>Documentation</a></li>\n" +
    "                           <li role=\"separator\" class=\"divider\"></li>\n" +
    "                           <li><a ng-click=\"openDetailsModal()\"><i class=\"fa fa-info-circle\" aria-hidden=\"true\"></i>About pgDevOps</a></li>\n" +
    "                         </ul>\n" +
    "                     </div>\n" +
    "                </li>\n" +
    "                <li>\n" +
    "                    <div class=\"btn-group userinfo-btn\" uib-dropdown>\n" +
    "\n" +
    "                        <button id=\"btn-append-to-single-button\" type=\"button\" class=\"btn btn-dropdown\"\n" +
    "                                uib-dropdown-toggle>\n" +
    "                            <img\n" +
    "                            src=\"{{ userInfo.gravatarImage }}\" width=\"18\" height=\"18\"\n" +
    "                            alt=\"Gravatar image for {{ userInfo.email }}\">\n" +
    "                            {{ userInfo.email }} <span class=\"caret\"></span>\n" +
    "                        </button>\n" +
    "                        <ul class=\"dropdown-menu\" uib-dropdown-menu role=\"menu\"\n" +
    "                            aria-labelledby=\"btn-append-to-single-button\">\n" +
    "                            <li role=\"menuitem\"><a href=\"/change\">Change Password</a></li>\n" +
    "                            <li role=\"menuitem\" ng-if=\"userInfo.isAdmin\" ng-click=\"usersPopup('lg')\">\n" +
    "                                <a href=\"\">Users</a>\n" +
    "                            </li>\n" +
    "                            <li role=\"menuitem\"><a href=\"/logout\">Logout</a></li>\n" +
    "                        </ul>\n" +
    "                    </div>\n" +
    "\n" +
    "\n" +
    "                    <!--<div id=\"pgcHost\">\n" +
    "                        {{userInfo.email}}\n" +
    "                    </div>-->\n" +
    "                </li>\n" +
    "                <!--<li>\n" +
    "                    <a class=\"feedback-link\" target=\"_blank\" href=\"https://www.bigsql.org/feedback/index.jsp\"\n" +
    "                       tooltip-placement=\"bottom-right\" uib-tooltip=\"Give Your Feedback\">\n" +
    "                        <i class=\"fa fa-comments-o\" aria-hidden=\"true\"></i>\n" +
    "                    </a>\n" +
    "                </li>-->\n" +
    "                <!-- Control Sidebar Toggle Button -->\n" +
    "            </ul>\n" +
    "        </div>\n" +
    "    </nav>\n" +
    "</header>")
}]);
})();