angular.module('bigSQL.common').directive('progressbar', function () {

    return {
        scope: {
            value: "="
        },
        restrict: 'E',
        template: "<div class='progressBar'><div></div></div>",
        link: function (scope, elem, attr) {

            var progressbar = jQuery(elem).contents();
            var bar = progressbar.find('div');
            scope.$watch('value', function (newVal) {
                if (newVal != undefined) {
                    var progressBarWidth = newVal * progressbar.width() / 100;
                    bar.width(progressBarWidth);
                }
            });
        }
    }
});