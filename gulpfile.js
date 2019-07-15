const gulp = require('gulp');
const uglify = require('gulp-uglify');
const sass = require('gulp-sass');
const rename = require('gulp-rename');

const ghPages = require('gulp-gh-pages');

function deploy() {
    return gulp.src('./public/**/*')
        .pipe(ghPages());
}

function js() {
    return gulp.src('./nivo-lightbox.js')
        .pipe(uglify())
        .pipe(rename('nivo-lightbox.min.js'))
        .pipe(gulp.dest('./public'));
}

function css() {
    return gulp.src('./themes/default/default.scss')
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(rename('nivo-lightbox.min.css'))
        .pipe(gulp.dest('./public'));
}

exports.deploy = deploy;
exports.js = js;
exports.css = css;
exports.default = gulp.parallel(js, css);
