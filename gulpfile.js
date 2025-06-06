const gulp = require('gulp')
const sass = require('gulp-sass')(require('node-sass'))
const fs = require('fs');
const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');
const webpack = require('webpack');


// css / sass
gulp.task('sass', function () {
  return gulp.src('styles/*.scss').pipe(sass()).pipe(gulp.dest('assets'))
})

gulp.task('watch', function () {
  gulp.watch('styles/**/*.scss', gulp.series('sass'))
})

// CSS.LIQUID

function processCssLiquid() {
  const cssFiles = [
    'styles/global.css.liquid',
    'styles/none-critical.css.liquid',
    'styles/global.v2-navigation.css.liquid',
  ];

  return Promise.all(
    cssFiles.map((cssFile) => {
      const importRegex = /^[\s]*@import ['"](.+\.css\.liquid)['"];/gm;

      let mainContent = fs.readFileSync(cssFile, 'utf8');
      const importStatements = mainContent.match(importRegex);


      const importPromises = !importStatements ? [] : importStatements.map((importStatement) => {
        const importFile = importStatement.match(/['"](.+\.css\.liquid)['"]/)[1];
        const importFilePath = `styles/${importFile}`;
        return new Promise((resolve, reject) => {
          fs.readFile(importFilePath, 'utf8', (err, importContent) => {
            if (err) {
              reject(err);
            } else {
              mainContent = mainContent.replace(importStatement, importContent);
              resolve();
            }
          });
        });
      });

      return Promise.all(importPromises)
        .then(() => {
          const minifiedContent = minifyCss(mainContent);
          let newFileName = cssFile.split('/').reverse()[0]
          const outputFilename = `assets/stylesheets.${newFileName}`;
          fs.writeFileSync(outputFilename, minifiedContent, 'utf8');
        });
    })
  );
}

function minifyCss(content) {
  return content
    .replace(/\s+/g, ' ')
    .replace(/\/\*(.*?)\*\//g, '')
    .replace(/(,|:|;|\{|})\s+/g, '$1')
    .replace(/\s+(,|:|;|\{|})/g, '$1');
}

gulp.task('css-liquid', function () {
  return processCssLiquid();
});
 
gulp.task('watch-css-liquid', function () {
  gulp.watch('styles/**/*.css.liquid', gulp.series('css-liquid'));
});

// JS
gulp.task('js', function (callback) {
  function handleStatsAndErrors(err, stats) {
    if (err) {
      console.error(err.stack || err);
      if (err.details) {
        console.error(err.details);
      }
      return;
    }
    const info = stats.toJson();
    if (stats.hasErrors()) {
      console.error(info.errors);
    }

    if (stats.hasWarnings()) {
      console.warn(info.warnings);
    }
  }

  // Define the base directory for components
  const componentsDir = path.resolve(__dirname, 'js/components/dist');
  
  // Read all JS files in the components directory
  const componentFiles = fs.readdirSync(componentsDir).filter(file => file.endsWith('.js'));

  // Create a dynamic entry object for Webpack
  const entries = {
    'chunks.core': './js/chunks.core.js',
    'chunks.global': './js/chunks.global.js',
    'chunks.loyaltyLionLanding': './js/chunks.loyaltyLionLanding.js',
    'chunks.search-template.algolia-version': './js/chunks.search-template.algolia-version.js',
    'chunks.v2-navigation': './js/chunks.v2-navigation.js',
    'dist.globalCartPlugins.discountsv2': './js/dist.globalCartPlugins.discountsv2',
    'dist.roswell_samples': './js/dist.roswell_samples.js',
    'dist.cart_upsells': './js/dist.cart_upsells.js',
    'dist.cart_cross-sells': './js/dist.cart_cross-sells.js',
    'dist.algolia-search': './js/dist.algolia-search.js',
  };

  // Add component files to the entry object
  componentFiles.forEach(file => {
    const fileNameWithoutExt = path.basename(file, '.js'); // Remove extension
    const entryName = `components.dist.${fileNameWithoutExt}`; // Create the entry name
    entries[entryName] = path.join(componentsDir, file); // Add to entries
  });

  // Run webpack with the dynamic entry
  webpack(
    {
      mode: 'production',
      entry: entries,
      output: {
        filename: 'scripts.[name].js', // Output based on entry key
        path: path.resolve(__dirname, 'assets'),
        libraryTarget: 'global',
      },
      optimization: {
        minimize: true,
        minimizer: [
          new TerserPlugin({
            terserOptions: {
              mangle: true,
              keep_classnames: true,
              keep_fnames: true,
            },
          }),
        ],
      },
    },
    function (err, stats) {
      handleStatsAndErrors(err, stats);
      callback();
    }
  );
});

gulp.task('watch-js', function () {
  gulp.watch('js/**/*.js', gulp.series('js'));
});

// update hreflang.liquid from assets/countries.json
// only needs running if / when countires.json is updated
gulp.task("hreflang", function (done) {
  const countries = require("./assets/countries.json");
  let hreflang = [
    `<link rel="alternate" hreflang="x-default" href="https://int.medik8.com{{ page.url }}" />`,
  ];
  countries.forEach(function (country) {
    if (country.isoAlpha2 != "na") {
      hreflang.push(
        `<link rel="alternate" hreflang="${
          country.isoAlpha2
        }" href="${country.website.replace(/\/+$/, "")}{{ page.url }}" />`
      );
    }
  });
  fs.writeFile("./snippets/hreflang.liquid", hreflang.join("\n"), done);
});