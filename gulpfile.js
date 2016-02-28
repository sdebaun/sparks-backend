var gulp = require('gulp'),
  babel = require('gulp-babel'),
  plumber = require('gulp-plumber'),
  nodemon = require('gulp-nodemon');

var SRC_PATH = 'src/**/*.js',
  DIST_PATH = 'dist';

gulp.task('default',['serve']);

gulp.task('watch', ['build'], function() {
  return gulp.watch( SRC_PATH, ['build']);
})

gulp.task('serve', ['watch'], function () {
  return nodemon({
    script: DIST_PATH,
    watch: [ DIST_PATH ]
  })
});

gulp.task('build', function(done) {
  return gulp.src( SRC_PATH )
    .pipe( plumber() )
    .pipe( babel({presets:['es2015','stage-0']}) )
    .pipe( gulp.dest( DIST_PATH ) )
});
