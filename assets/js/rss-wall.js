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
  return str.substring(0, str.lastIndexOf('('));
};

function renderArticle(item) {
  //console.log(item);
  if (item.image) {
    var ts = new Date(item.pubDate);
    var html = `
      <article>
        <a href="${item.link}" target="_blank" rel="noopener">
          <img src="${item.image}" alt="">
          <h2>${item.title}</h2>
          <span>${ts.toISOString().split('T')[0]}&nbsp;${ts.toTimeString().split(' ')[0]}</span>
        </a>
      </article>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  }
}

function asyncFetch(items, link) {
  return fetch(proxyurl + link)
    .then(response => response.text())
    .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
    .then(data => {
      var cutoff = new Date().setDate(new Date().getDate() - 7); // 7 days ago
      data.querySelectorAll("item").forEach(i => {
        var image = i.querySelector("image")?.innerHTML;
        var pubDate = Date.parse(i.querySelector("pubDate")?.innerHTML);
        if (image && pubDate > cutoff) {
          items.push({
            pubDate: pubDate,
            title: formatTitle(i.querySelector("title")?.innerHTML),
            image: image,
            link: i.querySelector("link")?.innerHTML,
          });
        }
      });
    });
}

async function fetchRss(links) {
  var items = [];

  // load from sources
  for (var url of links) {
    await asyncFetch(items, url);
  }

  // order from newest to oldest, remove duplicates
  items.sort((a, b) => (a.pubDate < b.pubDate) ? 1 : -1);
  items = items.filter((a, i, self) => i === self.findIndex((t) => (t.title === a.title)));

  // render to body
  for (var i of items) {
    renderArticle(i);
  }
}
