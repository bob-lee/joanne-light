import * as functions from 'firebase-functions';
import * as express from 'express';
import * as fs from 'fs';
import * as request from 'request-promise';
import * as templates from './templates';
import * as Handlebars from 'handlebars';
import * as embedcss from './embedcss';
import * as htmlmin from 'html-minifier';

const minify = htmlmin.minify;
export const app = express.Router();

Handlebars.registerHelper('imageSrc', function(image: any) {
  return image.url || '';
});
Handlebars.registerHelper('thumbSrc', function(image: any) {
  return image.thumbUrl || '';
});
Handlebars.registerHelper('isActive', function(path: string, me: string) {
  return path && me && path === me ? 'active' : '';
});
Handlebars.registerHelper('isWork', function(titleWork: string) {
  return titleWork && titleWork === 'work' ? '' : 'active';
});

const API = 'https://us-central1-joanne-lee.cloudfunctions.net/getUrls';

const SECTION_MATCHER = /^\/$|home|profile|contact/;
const WORK_MATCHER = /work\/(\w+$)/;

const PAGES: { [key: string]: { "template": string, "placeholder": string, "css": string } } = {
  "home": {
    "template": templates.home,
    "placeholder": "<!-- ::HOME:: -->",
    "css": "/home.css.html"
  },
  "profile": {
    "template": templates.profile,
    "placeholder": "<!-- ::PROFILE:: -->",
    "css": "/profile.css.html"
  },
  "contact": {
    "template": templates.contact,
    "placeholder": "<!-- ::CONTACT:: -->",
    "css": "/contact.css.html"
  },
  "work": {
    "template": templates.work,
    "placeholder": "<!-- ::WORK:: -->",
    "css": "/work.css.html"
  },
}

/**
 * Looks at a string path and returns the matching result.
 */
function topicLookup(path: string) {
  if (path === '/') {
    return 'home';
  }
  return `${path.match(SECTION_MATCHER)![0]}`
}

/**
 * Get urls from the API based on the given path
 * @param opts 
 */
async function getImages(path: string): Promise<any[]> {
  let images = await request(`${API}/${path}`);
  return JSON.parse(images);
}


async function createSimplePage(path: string) {
  const page = PAGES[path];
  const headerTemplate = Handlebars.compile(templates.header);
  const headerHtml = headerTemplate({ titleWork: 'work', path: path });

  // Embed CSS in HTML template
  const styledIndex = await embedcss.embedInHtml(
    __dirname + '/index.html',
    __dirname + page.css
  );
  // Dynamically render the stories in the HTML template
  const index = styledIndex
    .replace(page.placeholder, page.template)
    .replace('<!-- ::HEADER:: -->', headerHtml);
  return index;
}

async function createWorkPage(path: string, images: any[]) {
  console.log(`createWorkPage('${path}') got ${images.length} images`);
  const page = PAGES['work'];
  // compile html from template
  const template = Handlebars.compile(page.template);
  const headerTemplate = Handlebars.compile(templates.header);
  const worksHtml = template({ images });
  const headerHtml = headerTemplate({ titleWork: path, path: path });
  
  // Embed CSS in HTML template
  const styledIndex = await embedcss.embedInHtml(
    __dirname + '/index.html',
    __dirname + page.css
  );
  // Dynamically render the stories in the HTML template
  const index = styledIndex
    .replace(page.placeholder, worksHtml)
    .replace('<!-- ::HEADER:: -->', headerHtml);
  return index;
}

/**
 * Render simple page based on the given path
 */
async function renderSimplePage(path: string) {
  console.log(`renderSimplePage('${path}')`)
  const topic = topicLookup(path);
  const allIndex = await createSimplePage(topic);

  // minify html
  return minify(allIndex, {
    minifyJS: true,
    collapseWhitespace: true,
    removeAttributeQuotes: true
  });
}

/**
 * Render work page based on the given path
 */
async function renderWorkPage(path: string) {
  console.log(`renderWorkPage('${path}')`)
  const images = await getImages(path);
  const allIndex = await createWorkPage(path, images);

  // minify html
  return minify(allIndex, {
    minifyJS: true,
    collapseWhitespace: true,
    removeAttributeQuotes: true
  });
}

/**
 * Set the Cache-Control header as middleware so we don't have to set it for each and
 * every route. 
 */
function cacheControl(req: express.Request, res: express.Response, next: Function) {
  res.set('Cache-Control', 'public; max-age=300, s-maxage=600, stale-while-revalidate=400');
  res.set('Link', '</sw.reg.js>;rel=preload;as=script');
  next();
}

app.use(cacheControl);

/**
 * Handle main routes like 'home', 'profile', 'contact'
 */
app.get(SECTION_MATCHER, async (req, res) => {
  const html = await renderSimplePage(req.path);
  res.send(html);
});

/**
 * Handle 'work' routes (e.g. /work/portrait)
 */
app.get(WORK_MATCHER, async (req, res) => {
  const path = req.path.replace('/work/', '');
  const html = await renderWorkPage(path);
  res.send(html);
});

// otherwise redirect to home page
app.get('*', (req, res) => res.redirect('/home'));

/**
 * Export express app to Cloud Functions
 */
export let server = functions.https.onRequest(app as any);
