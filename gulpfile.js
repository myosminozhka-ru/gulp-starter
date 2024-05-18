import { rmSync } from 'node:fs';

import gulp from 'gulp';
import plumber from 'gulp-plumber';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
import postcss from 'gulp-postcss';
import rename from 'gulp-rename';
import autoprefixer from 'autoprefixer';
import csso from 'postcss-csso';
import sortMediaQueries from 'postcss-sort-media-queries';
import includePartials from 'gulp-file-include';
import { createGulpEsbuild } from 'gulp-esbuild';
import browserslistToEsbuild from 'browserslist-to-esbuild';
import imagemin, {gifsicle, mozjpeg, optipng, svgo} from 'gulp-imagemin';
import { stacksvg } from 'gulp-stacksvg';
import server from 'browser-sync';
import bemlinter from 'gulp-html-bemlinter';

const { src, dest, watch, series, parallel } = gulp;
const sass = gulpSass(dartSass);
const PATH_TO_SOURCE = './source/';
const PATH_TO_DEV = './dev-server/';
const PATH_TO_DIST = './dist/';
const PATHS_TO_STATIC = [
  `${PATH_TO_SOURCE}libs/**/*`,
  `${PATH_TO_SOURCE}fonts/**/*.{woff2,woff}`,
  `${PATH_TO_SOURCE}*.ico`,
  `!${PATH_TO_SOURCE}**/README.md`,
];
let isDevelopment = true;
let OUTPUT_PATH;

/* Работа с HTML - сборка частей и страниц */
export function createHTML () {
  return src([
    `${PATH_TO_SOURCE}/pages/*.html`,
    `${PATH_TO_SOURCE}/*.html`
    ])
    .pipe(plumber())
    .pipe(includePartials())
    .pipe(dest(`${OUTPUT_PATH}`))
    .pipe(server.stream());
}

/* Работа со стилями*/
export function createStyles () {
  return src(`${PATH_TO_SOURCE}styles/*.scss`, { sourcemaps: isDevelopment })
    .pipe(plumber())
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([
      autoprefixer(),
      sortMediaQueries(),
      csso()
    ]))
    .pipe(rename({
      extname: '.min.css'
    }))
    .pipe(dest(`${OUTPUT_PATH}styles`, { sourcemaps: isDevelopment }))
    .pipe(server.stream());
}

/* Работа со скриптами */
export function createScripts () {
  const gulpEsbuild = createGulpEsbuild({ incremental: isDevelopment });

  return src(`${PATH_TO_SOURCE}js/*.js`)
    .pipe(plumber())
    .pipe(gulpEsbuild({
      bundle: true,
      format: 'esm',
      platform: 'browser',
      minify: !isDevelopment,
      sourcemap: isDevelopment,
      target: browserslistToEsbuild(),
    }))
    .pipe(dest(`${OUTPUT_PATH}js`))
    .pipe(server.stream());
}

/* Создание stack файла */
export function createStack () {
  return src(`${PATH_TO_SOURCE}/icons/**/*.svg`)
    .pipe(stacksvg())
    .pipe(dest(`${OUTPUT_PATH}images`));
}

/* Оптимизация картинок */
export function optimizeImage () {
  return src([
    `${PATH_TO_SOURCE}images/**/*`,
    `!${PATH_TO_SOURCE}**/README.md`,
    ])
    .pipe(imagemin([
      gifsicle({interlaced: true}),
      mozjpeg({quality: 75, progressive: true}),
      optipng({optimizationLevel: 5}),
      svgo({
        plugins: [
          {
            name: 'removeViewBox',
            active: true
          },
          {
            name: 'cleanupIDs',
            active: false
          }
        ]
      })
    ]))
    .pipe(dest(`${PATH_TO_DIST}images/`));
}

/* Перенос статичных файлов */
export function copyAssets () {
  if(isDevelopment) {
    return src([
      `${PATH_TO_SOURCE}libs/**/*`,
      `!${PATH_TO_SOURCE}**/README.md`,
    ])
      .pipe(dest(`${PATH_TO_DEV}libs/`));
  } else {
    return src(PATHS_TO_STATIC, { base: PATH_TO_SOURCE })
      .pipe(dest(PATH_TO_DIST));
  }
}


/* Работа с локальным сервером */
export function startServer () {
  server.init({
    server: {
      baseDir: `${PATH_TO_DEV}`
    },
    startPath: `index.html`,
    serveStatic: [
      {
        route: '/fonts',
        dir: `${PATH_TO_SOURCE}fonts`,
      },
      {
        route: '/*.ico',
        dir: `${PATH_TO_SOURCE}*.ico`,
      },
      {
        route: '/images',
        dir: `${PATH_TO_SOURCE}images`,
      },
    ],
    cors: true,
    notify: false,
    ui: false,
  }, (err, bs) => {
    bs.addMiddleware('*', (req, res) => {
      // res.write(readFileSync(`${PATH_TO_DIST}404.html`));
      res.end();
    });
  });

  watch(`${PATH_TO_SOURCE}**/*.{html,njk}`, series(createHTML));
  watch(`${PATH_TO_SOURCE}styles/**/*.scss`, series(createStyles));
  watch(`${PATH_TO_SOURCE}js/**/*.js`, series(createScripts));
  watch(`${PATH_TO_SOURCE}icons/**/*.svg`, series(createStack, reloadServer));
  watch(`${PATH_TO_SOURCE}images/**/*`, reloadServer);
  watch(PATHS_TO_STATIC, series(copyAssets, reloadServer));
}

function reloadServer (done) {
  server.reload();
  done();
}

/* Очищение папки */
export function removeDist (done) {
  rmSync(PATH_TO_DIST, {
    force: true,
    recursive: true,
  });
  done();
}

/* Полная сборка */
export function buildProd (done) {
  isDevelopment = false;
  OUTPUT_PATH = isDevelopment ? PATH_TO_DEV : PATH_TO_DIST;
  series(
    removeDist,
    parallel(
      createHTML,
      createStyles,
      createScripts,
      optimizeImage,
      createStack,
      copyAssets
    ),
  )(done);
}
/* Сборка для разработки */
export function runDev (done) {
  OUTPUT_PATH = isDevelopment ? PATH_TO_DEV : PATH_TO_DIST
  series(
    removeDist,
    parallel(
      createHTML,
      createStyles,
      createScripts,
      createStack,
      copyAssets
    ),
    startServer,
  )(done);
}
