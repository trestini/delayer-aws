const gulp = require('gulp');
const install = require('gulp-install');
const zip = require('gulp-zip');
const del = require('del');
const run = require('gulp-run-command').default;
const runSequence = require('run-sequence');

const TMP_DIR = "./tmp/";
const DIST_DIR = "./dist/";

gulp.task('copy-src', () => {
  return gulp.src(['src/**/*', 'package.json'])
    .pipe(gulp.dest(TMP_DIR));
});

gulp.task('build-deps', () => {
  return gulp.src('package.json')
    .pipe(gulp.dest(TMP_DIR))
    .pipe(install({production: true}));
});

gulp.task('uninst-aws', run('npm uninstall --prefix ' + TMP_DIR + ' aws-sdk'));

gulp.task('zip', () => {
  return gulp.src(TMP_DIR + '/**/*')
    .pipe(zip('package.zip'))
    .pipe(gulp.dest(DIST_DIR));
});

gulp.task('clean-tmp', () => {
  del(TMP_DIR);
});

gulp.task('build', (callback) => {
  runSequence('copy-src', 'build-deps', 'uninst-aws', 'zip', 'clean-tmp', callback);
});
