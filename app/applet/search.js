import * as cheerio from 'cheerio';
fetch('https://html.duckduckgo.com/html/?q="api.infinitepay.io"+payment+link').then(r => r.text()).then(t => {
  const $ = cheerio.load(t);
  $('.result__snippet').each((i, el) => console.log($(el).text()));
});
