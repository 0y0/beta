/*
  RSS Wall Utility

  Main function: fetchRss(links, hours, local, filter, everything)
  Function parameters:
    links = a list of URLs providing RSS feeds (mandatory)
    hours = exclude items with pubDate older than this (default: 24*7, 0=disabled)
    local = disable CORS proxy (for local feeds, default: false)
    filter = exclude items with title or link matching regex (default: none)
    everything = show every RSS items (for debugging, default: false)

  HTTP parameters:
    expire = override "hours" parameter (default: 24*7)
    exclude = override "filter" parameter (default: none)
    all = enable "everything" parameter (default: false)
    recent = set item highlight threshold in hours (default: 24)
    crop = set maximum number of items to show (default: no limit)
    debug = print debug messages
*/

//const proxyurl = "https://k34f75nkq2.onrender.com/";
const proxyurl = "https://corsproxy.io/?";

const htmlEntities = {
  nbsp: ' ',
  cent: '¢',
  pound: '£',
  yen: '¥',
  euro: '€',
  copy: '©',
  reg: '®',
  lt: '<',
  gt: '>',
  quot: '"',
  amp: '&',
  apos: '\''
};

function hashCode(str) {
  return str.split("").reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0);
}

function userLang() {
  var lang = window.navigator.language;
  if (!lang) lang = window.navigator["browserLanguage"];
  if (!lang) lang = "en-US";
  return lang.substring(0, 2);
}

function offsetDate(hours) {
  var now = new Date();
  now.setHours(now.getHours() + hours);
  return now;
}

function formatDatetime(dt) {
  var date = `${dt.getYear()+1900}-` + `${dt.getMonth()+1}-`.padStart(3,'0') + `${dt.getDate()}`.padStart(2,'0');
  var time = dt.toTimeString().split(' ')[0];
  return date + ' ' + time;
}

function decodeEntity(str) {
  str = str.replace(/\&([^;]+);/g, function (entity, entityCode) {
    var match;
    if (entityCode in htmlEntities)
      return htmlEntities[entityCode];
    else if (match = entityCode.match(/^#x([\da-fA-F]+)$/))
      return String.fromCharCode(parseInt(match[1], 16));
    else if (match = entityCode.match(/^#(\d+)$/))
      return String.fromCharCode(~~match[1]);
    else
      return entity;
  });
  return str.replace(/\(.*\)\s*$/, ''); // remove source info
};

function unwrap(str) {
  return str ? str.replace(/^\s*<!\[CDATA\[|\]\]>\s*$/g, '') : str;
}

function dropTags(str) {
  return str ? str.replace(/[#＃]\S+\s*/g, '') : str;
}

function renderArticle(item, recent) {
  var ts = new Date(item.pubDate);
  var cl = (recent && ts > recent) ? ' class="recent"' : '';
  var img = item.image ? '<img src="' + item.image + '" alt="">\n        ' : '';
  var title = dropTags(item.title);
  var link = dropTags(item.link);
  var html = `
    <article${cl}>
      <div>${link}</div>
      <a href="${link}" target="_blank" rel="noopener">
        ${img}<h2>${title}</h2>
        <span>${formatDatetime(ts)}</span>
      </a>
    </article>
  `;
  document.body.insertAdjacentHTML("beforeend", html);
}

function asyncFetch(items, url, cutoff, rex, everything, debug) {
  return fetch(url)
    .then(response => {
      if (response.ok) return response.text();
      else throw new Error("status " + response.status + " fetching: " + url);
    })
    .then(text => {
      var count = 0;
      const xml = new window.DOMParser().parseFromString(text, "text/xml");

      // ATOM support
      if (xml.querySelector("feed")) xml.querySelectorAll("entry").forEach(e => {
        if (debug) console.log(e);
        var pubDate = Date.parse(unwrap(e.querySelector("published")?.innerHTML));
        if (isNaN(pubDate)) return; // ignore items with invalid date
        if (!cutoff || pubDate > cutoff) {
          // exclude items matching regexp
          var title = decodeEntity(e.querySelector("title")?.innerHTML);
          if (rex && title.match(rex)) return;
          var link = e.querySelector("link")?.getAttribute("href").replace('.youtube.com/watch?', '.youtube.com/watch?autoplay=1&');
          if (rex && link.match(rex)) return;

          // look for a picture
          var image = e.getElementsByTagName("media:thumbnail")[0]?.getAttribute("url");
          if (image) {
            items.push({
              pubDate: pubDate,
              title: title,
              image: image,
              link: link,
            });
            count++;
          }
          else if (everything) {
            items.push({
              pubDate: pubDate,
              title: title,
              //image: "https://picsum.photos/seed/" + hashCode(link) + "/400/300.webp",
              link: link,
            });
            count++;
          }
        }
      });

      // RSS support
      if (xml.querySelector("rss")) xml.querySelectorAll("item").forEach(i => {
        if (debug) console.log(i);
        var pubDate = Date.parse(unwrap(i.querySelector("pubDate")?.innerHTML));
        if (!pubDate) pubDate = Date.parse(i.getElementsByTagName("dcterms:modified")[0]?.innerHTML);
        if (isNaN(pubDate)) return; // ignore items with invalid date
        if (!cutoff || pubDate > cutoff || everything) {
          // exclude items matching rex
          var title = decodeEntity(unwrap(i.querySelector("title")?.innerHTML));
          if (rex && title.match(rex)) return;
          var link = unwrap(i.querySelector("link")?.innerHTML);
          if (rex && link.match(rex)) return;
          var desc = unwrap(i.querySelector("description")?.innerHTML);
          if (rex && desc.match(rex)) return;

          // look for a picture
          var image = unwrap(i.querySelector("image")?.innerHTML);
          if (!image) {
            image = i.getElementsByTagName("media:thumbnail")[0]?.getAttribute("url");
          }
          if (!image) {
            image = i.getElementsByTagName("media:thumbnail")[0]?.innerHTML;
          }
          if (!image) {
            for (var m of i.getElementsByTagName("media:content")) {
              var url = m.getAttribute("url");
              if (url.match(/(.jpg|.jpeg|.png|.gif)/i)) {
                image = url;
                break;
              }
            }
          }
          if (!image) {
            var enc = unwrap(i.getElementsByTagName("content:encoded")[0]?.innerHTML);
            if (enc) {
              var html = new DOMParser().parseFromString(enc, "text/html");
              for (var m of html.getElementsByTagName("img")) {
                var src = m.getAttribute("src");
                if (!src) src = m.getAttribute("file");
                if (src && src.indexOf('emoji') < 0) {
                  image = src;
                  break;
                }
              }
              if (title.indexOf("J-RISQ") > 0) { // go for better title
                var t = html.getElementsByTagName("p")[0]?.innerHTML;
                if (t) title = t;
              }
            }
          }
          if (!image) {
            if (desc) {
              var html = new DOMParser().parseFromString(desc, "text/html");
              for (var m of html.getElementsByTagName("img")) {
                var src = m.getAttribute("src");
                if (src.indexOf('data:') >= 0) continue; // skip embedded images
                if (src && src.indexOf('emoji') < 0) {
                  image = src;
                  break;
                }
              }
            }
          }

          // twitter handling
          if (link.match(/https?:\/\/twitter\./)) {
            if (title.match(/^R to @/)) return; // skip retweets
            // give priority to link within the title
            var re = /https?:\/\/\S+/;
            link = title.match(re) || link;
            if (Array.isArray(link)) link = link[0];
            title = title.replace(re, '').replace(/^RT?\s+[^:]*:/, '');
          }

          let item = {
            pubDate: pubDate,
            title: title,
            image: image,
            link: link,
          };

          if (debug) console.log(item);

          // add item
          if (image && image.indexOf('-thumb.') < 0) { // skip if no good picture
            items.push(item);
            count++;
          }
          else if (everything) {
            items.push(item);
            count++;
          }
        }
      });
      return count;
    });
}

async function fetchRss(links, hours, local, filter, everything) {
  const lang = userLang();
  const splash = document.getElementById("splash");
  if (splash) splash.innerHTML = (lang=="ja" ? '読み込み中' : 'Loading');

  const params = new URLSearchParams(window.location.search);
  const expire = params.get("expire");
  if (expire && expire >= 0) hours = expire; // override parameter

  if (hours == null) hours = 7 * 24; // default to one week
  const exclude = params.get("exclude");
  const debug = params.get("debug");
  const rex = exclude ? RegExp(exclude, 'i') : filter ? new RegExp(filter, 'i') : null; // pattern to exclude
  const title = document.title; // make a copy

  // load from RSS sources
  var items = [];
  var count = links.length;
  document.title = title + " " + "<".repeat(count); // show progress in title
  var batch = links.map(async url => {
    var link = local ? url : proxyurl + url;
    var all = params.get("all") != null;
    await asyncFetch(items, link, hours == 0 ? null : offsetDate(-hours), rex, all || everything, debug)
      .then(num => {
        console.log(url + " [" + num + "]");
      })
      .finally(_ => {
        document.title = title + " " + "<".repeat(--count); // update title
      })
      .catch(err => console.log(err));
  });
  const was = Date.now();
  await Promise.allSettled(batch).then(results => {
    console.log("fetch time: " + ((Date.now() - was)/1000).toFixed(2) + "s");
    // order from newest to oldest and remove duplicates
    items.sort((a, b) => (a.pubDate < b.pubDate) ? 1 : -1);
    items = items.filter((a, i, self) => i === self.findIndex((t) => (t.title == a.title && t.image == a.image)))
  });

  // stop splash and restore title
  splash.parentNode.removeChild(splash);
  document.title = title;

  // render to body
  const recent = params.get("recent");
  const hhours = (recent && recent >= 0) ? recent : 24; // default to one day
  const crop = params.get("crop");
  const end = (crop > 0 && crop <= items.length) ? crop : items.length;
  for (var i of items.slice(0, end)) {
    renderArticle(i, hhours == 0 ? null : offsetDate(-hhours));
  }
  console.log("render count: " + end);
}
