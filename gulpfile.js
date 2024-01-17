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
const PATH_TO_DIST = './dist/';
const PATHS_TO_STATIC = [
  `${PATH_TO_SOURCE}fonts/**/*.{woff2,woff}`,
  `${PATH_TO_SOURCE}*.ico`,
  `!${PATH_TO_SOURCE}**/README.md`,
];
let isDevelopment = true;

/* Работа с HTML - сборка частей и страниц */
export function createHTML () {
  return src([
    `${PATH_TO_SOURCE}/pages/*.html`,
    `${PATH_TO_SOURCE}/*.html`
    ])
    .pipe(includePartials())
    .pipe(dest(`${PATH_TO_DIST}/pages`))
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
    .pipe(dest(`${PATH_TO_DIST}styles`, { sourcemaps: isDevelopment }))
    .pipe(server.stream());
}

/* Работа со скриптами */
export function createScripts () {
  const gulpEsbuild = createGulpEsbuild({ incremental: isDevelopment });

  return src(`${PATH_TO_SOURCE}js/*.js`)
    .pipe(gulpEsbuild({
      bundle: true,
      format: 'esm',
      // splitting: true,
      platform: 'browser',
      minify: !isDevelopment,
      sourcemap: isDevelopment,
      target: browserslistToEsbuild(),
    }))
    .pipe(dest(`${PATH_TO_DIST}js`))
    .pipe(server.stream());
}

/* Создание stack файла */
export function createStack () {
  return src(`${PATH_TO_SOURCE}/icons/**/*.svg`)
    .pipe(stacksvg())
    .pipe(dest(`${PATH_TO_DIST}images`));
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
  return src(PATHS_TO_STATIC, { base: PATH_TO_SOURCE })
    .pipe(dest(PATH_TO_DIST));
}

export function lintBem () {
  return src(`${PATH_TO_DIST}pages/**/*.html`)
    .pipe(bemlinter())
}

/* Работа с локальным сервером */
export function startServer () {
  server.init({
    server: {
      baseDir: `${PATH_TO_DIST}`
    },
    startPath: `pages/index.html`,
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
  watch(`${PATH_TO_SOURCE}scripts/**/*.js`, series(createScripts));
  watch(`${PATH_TO_SOURCE}icons/**/*.svg`, series(createStack, reloadServer));
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
  series(
    removeDist,
    parallel(
      createHTML,
      createStyles,
      createScripts,
      createStack
    ),
    startServer,
  )(done);
}
