
// Load plugins
var gulp = require("gulp"),
    ts = require("gulp-typescript"),
    sourcemaps = require('gulp-sourcemaps'),
    runSequence = require('run-sequence');
    del = require('del');



var tsProject = ts.createProject("tsconfig.json");
gulp.task('compile-ts', function() {
  return gulp.src('src/**/*.ts')
    .pipe(sourcemaps.init())
    .pipe(tsProject())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));  
});




gulp.task('copy-js', function() {
  return gulp.src('src/**/*.js')
    .pipe(gulp.dest('dist'));
});


gulp.task('clean', function() {
  return del(['dist/*', '!dist/.gitkeep']);
});


gulp.task('watch', function() {
  gulp.watch('src/**/*.js', ['copy-js']);
  gulp.watch('src/**/*.ts', ['compile-ts']);
});


gulp.task('default', function(cb) {
  runSequence(
    'clean',
    ['copy-js', 'compile-ts'],
    cb);
});
