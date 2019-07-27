const {src, dest, task, series, watch, parallel} = require("gulp");
const rm = require( "gulp-rm" );
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const sassGlob = require('gulp-sass-glob');
const autoprefixer = require('gulp-autoprefixer');
const px2rem = require('gulp-smile-px2rem');
const gcmq = require('gulp-group-css-media-queries');
const browserSync = require('browser-sync').create();
const cleanCSS = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const svgo = require('gulp-svgo');
const svgSprite = require('gulp-svg-sprite');
const imagemin = require('gulp-imagemin');
const gulpif = require('gulp-if');
const reload = browserSync.reload; 
const env = process.env.NODE_ENV;

sass.compiler = require('node-sass');

task('clean', () => {
    return src('dist/**/*', { read: false}).pipe(rm());
});

task('copy:html', () => {
    return src('src/*.html')
        .pipe(dest('dist'))
        .pipe(reload({ stream: true }));
});

task('copy:fonts', () => {
    return src('src/fonts/*.*')
        .pipe(dest('dist/fonts'))
        .pipe(reload({ stream: true }));
});

task('images', () => {
    return src('src/images/*.*')
    .pipe(imagemin([
        imagemin.gifsicle({interlaced: true}),
        imagemin.jpegtran({progressive: true}),
        imagemin.optipng({optimizationLevel: 5})
    ]))
    .pipe(dest('dist/images'));
});

const styles = [
    'node_modules/normalize.css/normalize.css',
    'src/styles/main.scss'
];

task('styles', () => {
    return src(styles)
        .pipe(gulpif(env === 'dev', sourcemaps.init()))
        .pipe(concat('main.min.css'))
        .pipe(sassGlob())
        .pipe(sass().on('error', sass.logError))
       // .pipe(px2rem())
        .pipe(
            gulpif(
                env === 'dev',
                autoprefixer({ overrideBrowserslist: ['last 2 versions'], cascade: false })
            )
        )
        .pipe(gulpif(env === 'prod', gcmq()))
        .pipe(gulpif(env === 'prod', cleanCSS()))
        .pipe(gulpif(env === 'dev', sourcemaps.write()))
        .pipe(dest('dist'))
        .pipe(reload({ stream: true }));
});

const libs = [
    'node_modules/jquery/dist/jquery.js',
    'src/scripts/*.js'
]

task('scripts', () => {
    return src(libs)
        .pipe(sourcemaps.init())
        .pipe(concat('main.min.js', {newLine: ';'}))
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(dest('dist'))
        .pipe(reload({ stream: true }));
});

task('icons', () => {
    return src('src/images/icons/*.svg')
        .pipe(svgo({
            plugins: [
                {
                    removeAttrs: { attrs: '(fill|stroke|style|width|height|data.*)' }
                }
            ]
        }))
        .pipe(svgSprite({
            mode: {
                symbol: {
                    sprite: '../sprite.svg'
                }
            }
        }))
        .pipe(dest('dist/images/icons'));
});

task('server', ( ) => {
    browserSync.init({
        server: {
            baseDir: "./dist"
        },
        open: false
    });
});

watch('./src/styles/**/*.scss', series('styles'));
watch('./src/scripts/*.js', series('scripts'));
watch('./src/*.html', series('copy:html'));
watch('./src/images/icons/*.svg', series('icons'));
watch('./src/images/*.*', series('images'));

task(
    'default', 
    series('clean', parallel('copy:fonts', 'copy:html', 'styles', 'scripts', 'icons', 'images'), 'server'));
