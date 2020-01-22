angular.module('bigSQL.common').directive('validPasswordC', function () {
    return {
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {
            ctrl.$parsers.unshift(function (viewValue, $scope) {
                var noMatch = viewValue != scope.initForm.password.$viewValue
                ctrl.$setValidity('noMatch', !noMatch)
            })
        }
    }
}).directive('validPort', function () {
    return {
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {
            ctrl.$parsers.unshift(function (viewValue, $scope) {
                var invalidLen = parseInt(viewValue) < 1000 || parseInt(viewValue) > 9999
                ctrl.$setValidity('invalidLen', !invalidLen)
                scope.portGood = !invalidLen
            })
        }
    }
}).directive('validUserPassword', function () {
    return {
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {
            ctrl.$parsers.unshift(function (viewValue, $scope) {
                var invalidLen = viewValue.length < 6
                ctrl.$setValidity('invalidLen', !invalidLen)
            })
        }
    }
}).directive('confirmPassword', function () {
    return {
        require: 'ngModel',
        link: function (scope, elm, attrs, ctrl) {
            ctrl.$parsers.unshift(function (viewValue, $scope) {
                var invalidLen = viewValue.length < 6
                var noMatch = viewValue != scope.userForm.password.$viewValue
                ctrl.$setValidity('invalidLen', !invalidLen)
                ctrl.$setValidity('noMatch', !noMatch)
                scope.passwordValid = !invalidLen && !noMatch 
            })
        }
    }
});