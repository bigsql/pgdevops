angular.module('bigSQL.components').directive('bigsqlInstallComponent', function () {
    var directive = {};

    directive.restrict = 'E';
    /* restrict this directive to elements */
    directive.transclude = true;
    directive.template = "<div class='bigsqlInstallComponent' ng-transclude></div>";

    return directive;
});