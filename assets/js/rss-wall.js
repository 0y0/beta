const proxyurl = "https://k34f75nkq2.herokuapp.com/";

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

function offsetDate(hours) {
  var now = new Date();
  now.setHours(now.getHours() + hours);
  return now;
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
  var p = str.lastIndexOf('(');
  return p < 0 ? str : str.substring(0, p);
};

function unwrap(str) {
  return str ? str.replace(/^\s*<!\[CDATA\[|\]\]>\s*$/g, '') : str;
}

function renderArticle(item, recent) {
  var ts = new Date(item.pubDate);
  var cl = (recent && ts > recent) ? ' class="recent"' : '';
  var img = item.image ? '<img src="' + item.image + '" alt="">\n        ' : '';
  var html = `
    <article${cl}>
      <a href="${item.link}" target="_blank" rel="noopener">
        ${img}<h2>${item.title}</h2>
        <span>${ts.toISOString().split('T')[0]}&nbsp;${ts.toTimeString().split(' ')[0]}</span>
      </a>
    </article>
  `;
  document.body.insertAdjacentHTML('beforeend', html);
}

function asyncFetch(items, url, cutoff, rex, everything) {
  return fetch(url)
    .then(response => {
      if (response.ok) return response.text();
      else throw new Error("status " + response.status + " fetching: " + url);
    })
    .then(text => {
      var count = 0;
      const xml = new window.DOMParser().parseFromString(text, "text/xml");
      if (xml.querySelector("feed")) xml.querySelectorAll("entry").forEach(e => {
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
          items.push({
            pubDate: pubDate,
            title: title,
            image: image,
            link: link,
          });
        }
      });
      if (xml.querySelector("rss")) xml.querySelectorAll("item").forEach(i => {
        var pubDate = Date.parse(unwrap(i.querySelector("pubDate")?.innerHTML));
        if (!pubDate) pubDate = Date.parse(i.getElementsByTagName("dcterms:modified")[0]?.innerHTML);
        if (isNaN(pubDate)) return; // ignore items with invalid date
        if (!cutoff || pubDate > cutoff) {
          // exclude items matching rex
          var title = decodeEntity(unwrap(i.querySelector("title")?.innerHTML));
          if (rex && title.match(rex)) return;
          var link = unwrap(i.querySelector("link")?.innerHTML);
          if (rex && link.match(rex)) return;
          // look for a picture
          var image = unwrap(i.querySelector("image")?.innerHTML);
          if (!image) {
            image = i.getElementsByTagName("media:thumbnail")[0]?.getAttribute("url");
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
            var desc = unwrap(i.querySelector("description")?.innerHTML);
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
          if (image && image.indexOf('-thumb.') < 0) { // skip if no good picture
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
              link: link,
            });
            count++;
          }
        }
      });
      return count;
    });
}

async function fetchRss(links, hours, local, exclude, everything) {
  const params = new URLSearchParams(window.location.search);
  const expire = params.get("expire");
  if (expire && expire >= 0) hours = expire; // override parameter

  if (hours == null) hours = 7 * 24; // default to one week
  const rex = exclude ? new RegExp(exclude) : null; // pattern to exclude
  const title = document.title; // make a copy

  // load from RSS sources
  var items = [];
  var count = links.length;
  document.title = title + ": " + count--; // show progress in title
  var batch = links.map(async url => {
    var link = local ? url : proxyurl + url;
    var all = params.get("all");
    await asyncFetch(items, link, hours == 0 ? null : offsetDate(-hours), rex, all || everything).then(num => {
      console.log(url + " [" + num + "]");
    }).finally(_ => {
      document.title = title + ": " + count--; // update title
    })
    .catch(err => console.log(err));
  });
  await Promise.allSettled(batch).then(results => {
    // order from newest to oldest and remove duplicates
    items.sort((a, b) => (a.pubDate < b.pubDate) ? 1 : -1);
    items = items.filter((a, i, self) => i === self.findIndex((t) => (t.title === a.title && t.image === a.image)));
  });

  // stop splash and restore title
  var splash = document.getElementById("splash");
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
}
