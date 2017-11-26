var gulp = require('gulp');
var uglify = require('gulp-uglify');
var sass = require('gulp-ruby-sass');
var rename = require('gulp-rename');

var ghPages = require('gulp-gh-pages');

gulp.task('deploy', function() {
  return gulp.src('./public/**/*')
    .pipe(ghPages());
});

gulp.task('js', function() {
  return gulp.src('./nivo-lightbox.js')
    .pipe(gulp.dest('./public/'))
    .pipe(uglify())
    .pipe(rename('nivo-lightbox.min.js'))
    .pipe(gulp.dest('./public/'));
});

gulp.task('css', function () {
  return sass('./themes/default/default.scss', {
    style: 'compressed'
    })
    .on('error', sass.logError)
    .pipe(rename('nivo-lightbox.min.css'))
    .pipe(gulp.dest('./public/'));
});

gulp.task('default', ['js', 'css']);
