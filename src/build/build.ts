import { WorkboxBuild, Manifest } from './workbox.types';
import * as embed from '../server/embedcss';
const uglifyes = require('uglify-es');

import * as htmlmin from 'html-minifier';
import * as fs from 'fs-extra';
import * as ncpi from 'ncp';

const workbox: WorkboxBuild = require('workbox-build');

const PRECACHE_MATCHER = '[/** ::MANIFEST:: **/]';
const minify = htmlmin.minify;
const ncp = ncpi.ncp;

function copyDir(source: string, destination: string) {
  return new Promise((resolve, reject) => {
    ncp(source, destination, function ncpCopy(err) {
      if (err) {
        console.error('copyDir', err);
        reject(err);
      }
      resolve();
    });
  });
}

/**
 * Copy static assets into the directory to deploy to Firebase Hosting
 */
async function copyStatic() {
  const staticDir = process.cwd() + '/src/static';
  const distDir = process.cwd() + '/dist/static';
  await copyDir(staticDir, distDir)
  console.log(`Copying ${staticDir} to ${distDir}`);
}

async function copyServer() {
  const cwd = process.cwd();
  return [{
    data: fs.readFileSync(`${cwd}/src/server/package.json`, 'utf8'), 
    path: process.cwd() + '/dist/server/package.json',
  }, {
    data: fs.readFileSync(`${cwd}/src/server/package-lock.json`, 'utf8'), 
    path: process.cwd() + '/dist/server/package-lock.json',    
  }];
}

/**
 * Minify Javascript file
 */
async function minifiedJs(filename: string) {
  const code = fs.readFileSync(process.cwd() + `/src/static/${filename}`, 'utf8');
  const data = uglifyes.minify(code).code;
  console.log(`minified '${filename}' ${data.length} bytes`);
  const path = process.cwd() + `/dist/static/${filename}`;
  return [{ data,  path }];
}

/**
 * Copy workbox from npm
 */
async function copyWorkbox() {
  const cwd = process.cwd();
  const pkgPath = `${cwd}/node_modules/workbox-sw/package.json`;
  const pkg = require(pkgPath);
  const readPath = `${cwd}/node_modules/workbox-sw/${pkg.main}`;
  const data = fs.readFileSync(readPath, 'utf8');
  const path = `${cwd}/dist/static/workbox-sw.prod.js`;
  return [{ data, path }];
}

/**
 * Generate precache entries for the ServiceWorker
 */
function generateEntries() {
  return workbox.getFileManifestEntries({
    globDirectory: './src/static',
    globPatterns: ['**\/*.{html,js,css,png,jpg,json}'],
    globIgnores: ['sw.main.js','404.html', 'images/icons/**/*', 'index.html'],
  });
}

/**
 * Generate top level Service Worker given precache entries
 */
async function createSW(entries: Manifest[]) {
  const swTemplate = fs.readFileSync(process.cwd() + '/src/build/sw.main.js', 'utf8');
  const data = swTemplate.replace(PRECACHE_MATCHER, JSON.stringify(entries)); 
  const path = process.cwd() + '/dist/static/sw.main.js';
  return [{ data,  path }];
}

/**
 * Minify the SW registration code
 */
async function createMinifiedSWRegistration() {
  const swregTemplate = fs.readFileSync(process.cwd() + '/src/static/sw.reg.js', 'utf8');
  const data = uglifyes.minify(swregTemplate).code;
  const path = process.cwd() + '/dist/static/sw.reg.js'; 
  return [{ data,  path }];
}

/**
 * Compress the index.html template
 */
async function createCompressedIndex() {
   const indexFile = fs.readFileSync(process.cwd() + '/src/build/index.html', 'utf8');
   const data = minify(indexFile, {
      minifyJS: true,
      collapseWhitespace: true,
      removeAttributeQuotes: true
   });
   const path = process.cwd() + '/dist/server/index.html';
   return [{data, path }];
}

/**
 * Create the style tags for the "story" and "item" based pages. This styles
 * are generated statically once, and then dynamically plugged when a request
 * hits.
 */
async function generateStyles() {
  console.log('generating embedded styles');
  try {

    const homeCss = await embed.combineCss([
      process.cwd() + '/src/build/css/base.css',
      process.cwd() + '/src/build/css/home.css'
    ]);
    const profileCss = await embed.combineCss([
      process.cwd() + '/src/build/css/base.css',
      process.cwd() + '/src/build/css/profile.css'
    ]);
    const contactCss = await embed.combineCss([
      process.cwd() + '/src/build/css/base.css',
      process.cwd() + '/src/build/css/contact.css'
    ]);
    const workCss = await embed.combineCss([
      process.cwd() + '/src/build/css/base.css',
      process.cwd() + '/src/build/css/work.css'
    ]);

    const homeStyleTag = embed.style(homeCss);
    const profileStyleTag = embed.style(profileCss);
    const contactStyleTag = embed.style(contactCss);
    const workStyleTag = embed.style(workCss);
    return [
      { path: process.cwd() + '/dist/server/home.css.html', data: homeStyleTag },
      { path: process.cwd() + '/dist/server/profile.css.html', data: profileStyleTag },
      { path: process.cwd() + '/dist/server/contact.css.html', data: contactStyleTag },
      { path: process.cwd() + '/dist/server/work.css.html', data: workStyleTag },
    ];
  } catch (error) {
    console.error('generateStyles() failed', error);
    return [ ];
  }
}

/**
 * Build Steps
 *  (assume tsc has ran)
 *  - Copy assets from npm
 *  - Generate SW entries
 *  - Generate SW from entries
 *  - Minify SW
 *  - Minify SW registration
 *  - Minify index.html
 *  - Generate CSS HTML tags, write to server/css
 */
async function build() {
  await copyStatic();
  const dropdown = await minifiedJs('dropdown.js');
  const profile = await minifiedJs('profile.js');
  const contact = await minifiedJs('contact.js');
  const work = await minifiedJs('work.js');
  const polyfill = await minifiedJs('intersection-observer.js'); // for IE11
  const entries = await generateEntries();
  const sw = await createSW(entries);
  const reg = await createMinifiedSWRegistration();
  const index = await createCompressedIndex();
  const css = await generateStyles();
  
  const workbox = await copyWorkbox();
  const server = await copyServer();
  const all = sw.concat(dropdown, profile, contact, work, polyfill, reg, index, css, workbox, server);
  return all.map(file => {
    console.log(`Writing ${file.path}.`);
    return fs.writeFileSync(file.path, file.data, 'utf8');
  });
}

try {
  build();
} catch(e) {
  console.log(e);
}
