const {src, dest, watch, series, parallel} = require('gulp');

const htmlmin      = require('gulp-htmlmin');
const concat       = require('gulp-concat');
const autoprefixer = require('gulp-autoprefixer');
const cleancss     = require('gulp-clean-css');
const sourcemaps   = require('gulp-sourcemaps');
const browserSync  = require('browser-sync').create();
const del          = require('del');
const gulpif       = require('gulp-if');
const sprite       = require('gulp-svg-sprite');
const image        = require('gulp-image');
const babel        = require('gulp-babel');
const notify       = require('gulp-notify');
const uglify       = require('gulp-uglify-es').default;
const sass         = require('gulp-sass')(require('sass'));
const gcmq         = require('gulp-group-css-media-queries');
const isProd       = process.argv.includes('prod');
const isDev        = !isProd;

const html = () => {
  return src('./src/index.html')
  .pipe(gulpif(isProd, htmlmin({
    collapseWhitespace: true
  })))
  .pipe(gulpif(isProd, dest('./build')))
  .pipe(gulpif(isDev, dest('./dev')))
  .pipe(browserSync.stream())
}

const styles = () => {
  return src('./src/scss/main.scss')
  .pipe(gulpif(isDev, sourcemaps.init()))
  .pipe(sass())
  .pipe(concat('style.css'))
  .pipe(autoprefixer({
    overrideBrowserslist: ['last 10 versions'],
    grid: true
  }
))
  .pipe(gulpif(isProd, cleancss({
    level: 2
    })))
  .pipe(gcmq())
  .pipe(gulpif(isDev, sourcemaps.write()))
  .pipe(gulpif(isDev, dest('./dev/css')))
  .pipe(gulpif(isProd, dest('./build/css')))
  .pipe(browserSync.stream())
}

const svgSprites = () => {
  return src('src/img/svg/**/*.svg')
  .pipe(sprite({
    mode: {
      stack: {
        sprite: '../sprite.svg'
      }
    }
  }))
  .pipe(gulpif(isDev, dest('./dev/img')))
  .pipe(gulpif(isProd, dest('./build/img')))
}

const images = () => {
  return src([
    './src/img/**/*.jpg',
    './src/img/**/*.jpeg',
    './src/img/**/*.png',
    './src/img/**/*.svg',
  ])
  .pipe(gulpif(isDev, dest('./dev/img')))
  .pipe(gulpif(isProd, image()))
  .pipe(gulpif(isProd, dest('./build/img')))
}

const scripts = () => {
  return src([
    'src/js/modules/**/*.js',
    'src/js/main.js'
  ])
  .pipe(gulpif(isDev, sourcemaps.init()))
  .pipe(concat('app.js'))
  .pipe(babel({
    presets: ['@babel/env']
  }))
  .pipe(gulpif(isDev, sourcemaps.write()))
  .pipe(dest('./dev/js'))
  .pipe(gulpif(isProd, uglify().on('error', notify.onError())))
  .pipe(gulpif(isProd, dest('./build/js')))
  .pipe(browserSync.stream())
}

const resources = () => {
  return src('./src/assets/**/*')
  .pipe(gulpif(isDev, dest('./dev/assets')))
  .pipe(gulpif(isProd, dest('./prod/assets')))
}

const favicon = () => {
  return src('./src/favicon.ico')
    .pipe(gulpif(isDev, dest('./dev')))
    .pipe(gulpif(isProd, dest('./build')))
}

const watchFiles = () => {
  browserSync.init({
      server: {
        baseDir: './dev'
      }
    });
  watch('./src/index.html', html);
  watch('./src/scss/**/*.scss', styles);
  watch('./src/img/svg/**/*.svg', svgSprites);
  watch('./src/js/**/*.js', scripts);
  watch('./src/lib/**', resources);
}

const clean = () => del(['./build']);

exports.clean        = clean;
exports.html         = html;
exports.styles       = styles;
exports.svgSprites   = svgSprites;
exports.images       = images;
exports.scripts      = scripts;
exports.resources    = resources;
exports.favicon      = favicon;

exports.dev  = parallel(html, styles, images, scripts, svgSprites, resources, favicon, watchFiles);
exports.prod = series(clean, html, styles, images, scripts, resources, svgSprites, favicon);
