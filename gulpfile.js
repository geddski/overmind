var gulp = require('gulp');
var deploy = require('gulp-gh-pages');

gulp.task('deploy', function () {
  gulp.src('./demo/**/*').pipe(deploy());
});
