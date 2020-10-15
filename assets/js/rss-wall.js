const proxyurl = "https://cors-anywhere.herokuapp.com/";

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

function formatTitle(str) {
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

function renderArticle(item, recent) {
  var ts = new Date(item.pubDate);
  var cl = (recent && ts > recent) ? ' class="recent"' : '';
  var html = `
    <article${cl}>
      <a href="${item.link}" target="_blank" rel="noopener">
        <img src="${item.image}" alt="">
        <h2>${item.title}</h2>
        <span>${ts.toISOString().split('T')[0]}&nbsp;${ts.toTimeString().split(' ')[0]}</span>
      </a>
    </article>
  `;
  document.body.insertAdjacentHTML('beforeend', html);
}

function asyncFetch(items, link, cutoff) {
  return fetch(proxyurl + link)
    .then(response => response.text())
    .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
    .then(data => {
      data.querySelectorAll("item").forEach(i => {
        var pubDate = Date.parse(i.querySelector("pubDate")?.innerHTML);
        if (!cutoff || pubDate > cutoff) {
          // look for a picture
          var image = i.querySelector("image")?.innerHTML;
          if (!image) {
            image = i.getElementsByTagName("media:thumbnail")[0]?.getAttribute("url");
          }
          if (!image) {
            var desc = i.querySelector("description")?.innerHTML;
            var html = new DOMParser().parseFromString(desc, "text/html");
            image = html.querySelector("img")?.getAttribute("src");
          }
          if (!image) {
            var enc = i.getElementsByTagName("content:encoded")[0]?.innerHTML;
            var html = new DOMParser().parseFromString(enc, "text/html");
            image = html.querySelector("img")?.getAttribute("src");
          }
          if (image && image.indexOf('-thumb.') < 0) { // skip if no good picture
            items.push({
              pubDate: pubDate,
              title: formatTitle(i.querySelector("title")?.innerHTML),
              image: image + '?w=400', // try to limit size if supported by source
              link: i.querySelector("link")?.innerHTML,
            });
          }
        }
      });
    });
}

async function fetchRss(links, hours) {
  if (hours == null) hours = 7 * 24; // default to one week

  // load from RSS sources
  var items = [];
  for (var url of links) {
    await asyncFetch(items, url, hours == 0 ? null : offsetDate(-hours)); // no limit if hours is zero
  }

  // order from newest to oldest and remove duplicates
  items.sort((a, b) => (a.pubDate < b.pubDate) ? 1 : -1);
  items = items.filter((a, i, self) => i === self.findIndex((t) => (t.title === a.title)));

  // stop splash
  var splash = document.getElementById("splash");
  splash.parentNode.removeChild(splash);

  // render to body
  for (var i of items) {
    renderArticle(i, offsetDate(-24)); // highlight recent articles
  }
}
