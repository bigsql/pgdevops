var gulp = require('gulp'),
    gutil = require('gulp-util'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    watch = require('gulp-watch'),
    cssmin = require('gulp-cssmin'),
    html2js = require('gulp-html2js'),
    rename = require('gulp-rename');


// ============================================================================
// Concatenate all JS lib files 
gulp.task('app-scripts', function () {
    return gulp.src(['app/*.js', 'app/**/*.js'])
        .pipe(concat('app-scripts.js'))
        .pipe(gulp.dest(''));
});

gulp.task('vendor-scripts', function () {
    return gulp.src(['bower_components/angular/angular.js',
                    'bower_components/angular/angular-cookies.min.js',
                    'bower_components/jquery/dist/jquery.min.js',
                    'bower_components/angular-animate/angular-animate.min.js',
                    'bower_components/angular-ui-router/release/angular-ui-router.min.js',
                    'bower_components/angular-filter/dist/angular-filter.min.js',
                    'bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
                    'bower_components/autobahnjs/autobahn.min.js',
                    'ext-libs/d3.min.js',
                    'ext-libs/nv.d3.min.js',
                    'ext-libs/angular-nvd3.min.js',
                    'ext-libs/ui-grid.min.js' ,
                    'bower_components/resize-dialog/dist/js/gijgo.min.js',
                    'bigsql-layout-helpers.js'])
        .pipe(concat('vendor-scripts.js'))
        .pipe(rename('vendor-scripts.min.js'))
        .pipe(uglify({
            mangle: false
        }))
        .pipe(gulp.dest('../web'));
});

gulp.task('app-scripts-min', function () {
    return gulp.src(['app/*.js', 'app/**/*.js'])
        .pipe(concat('app-scripts.js'))
        .pipe(rename('app-scripts.min.js'))
        .pipe(uglify({
            mangle: false
        }))
        .pipe(gulp.dest('../web'));
});

gulp.task('vendor-css', function () {
    return gulp.src(['bower_components/bootstrap/dist/css/bootstrap.min.css',
        'bower_components/font-awesome/css/font-awesome.min.css',
        'styles/_all-skins.min.css',
        'ext-libs/nv.d3.min.css',
        'ext-libs/ui-grid.min.css',
        'bower_components/resize-dialog/dist/css/gijgo.min.css',
        'bower_components/Ionicons/css/ionicons.min.css'])
        .pipe(concat('vendor-css.css'))
        .pipe(gulp.dest('../web'));
});

gulp.task('app-css', function () {
    return gulp.src(['styles/bigSQL.css'])
        .pipe(cssmin())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest('../web'));
});


gulp.task('templates', function () {
    gulp.src(['app/*.html', 'app/**/*.html'])
        .pipe(html2js('templates.js', {
            adapter: 'angular',
            base: 'templates',
            name: 'templates'
        }))
        .pipe(gulp.dest('../web'));
});

gulp.task('templates-dev', function () {
    gulp.src(['app/*.html', 'app/**/*.html'])
        .pipe(html2js('templates.js', {
            adapter: 'angular',
            base: 'templates',
            name: 'templates'
        }))
        .pipe(gulp.dest(''));
});


gulp.task('index-file-copy', function () {
    gulp.src(['index-dist.html'])
        .pipe(rename('index.html'))
        .pipe(gulp.dest('../web'));
});


gulp.task('assets-copy', function () {
    gulp.src(['assets/**/*']).pipe(gulp.dest('../web/assets'));
});

gulp.task('fonts-copy', function () {
    gulp.src(['fonts/**/*']).pipe(gulp.dest('../web/fonts'));
});


gulp.task('modernizr-copy', function () {
    gulp.src(['m/*']).pipe(gulp.dest('../web/m'));
});

gulp.task('fontawesome-copy', function () {
    gulp.src('bower_components/font-awesome/fonts/*.{eot,svg,ttf,woff,woff2, otf}')
        .pipe(gulp.dest('../web/fonts'));
});

gulp.task('ui-grid-font', function () {
    gulp.src('ext-libs/*.{ttf,woff}')
        .pipe(gulp.dest('../web'))
})


//need to add the copy task as well
// ============================================================================
// Concatenate all JS lib files 


// ============================================================================
// Compile all less into single CSS file
//gulp.task('less', function () {
//    gulp.src('stylesheets/less/app.less')
//        .pipe(changed('**/*/*.less'))
//        .pipe(less())
//        .pipe(gulp.dest('stylesheets/css'))
//        .on('error', gutil.log);
//});

//Minify css files
//gulp.task('minify-css', function () {
//    return gulp.src('stylesheets/css/app.css')
//        .pipe(mincss({
//            compatibility: 'ie10'
//        }))
//        .pipe(gulp.dest('dist'));
//});

// ============================================================================
//// Start a local server
//gulp.task('webserver', function () {
//    gulp.src('./').pipe(webserver({
//        livereload: true,
//        host: '127.0.0.1',
//        port: '7777',
//        path: '/',
//        open: false
//    }));
//});

// ============================================================================
// Run tasks on file changes
gulp.task('watch', function () {
    gulp.watch(['app/app.js', 'app/**/*.js', 'app/**/*.html'], ['app-scripts', 'templates-dev']); // 
});

//This is to create a distribution build

gulp.task('dist-build', ['vendor-scripts', 'app-scripts-min', 'vendor-css', 'app-css', 'templates', 'index-file-copy', 'assets-copy', 'fonts-copy', 'modernizr-copy', 'fontawesome-copy', 'ui-grid-font']);


// Tasks to be run
gulp.task('default', ['watch']);