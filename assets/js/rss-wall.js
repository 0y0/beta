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

function unescapeHTML(str) {
  return str.replace(/\&([^;]+);/g, function (entity, entityCode) {
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
};

function async_fetch(link) {
  fetch(proxyurl + url)
    .then(response => response.text())
    .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
    .then(data => {
      const items = data.querySelectorAll("item");
      let html = ``;
      items.forEach(el => {
        html += `
          <article>
            <a href="${el.querySelector("link").innerHTML}" target="_blank" rel="noopener">
        `;
        var image = el.querySelector("image");
        var title = el.querySelector("title");
        if (image) html += `<img src="${image.innerHTML}" alt="">`;
        html += `<h2>${unescapeHTML(title.innerHTML)}</h2>
            </a>
          </article>
        `;
      });
      document.body.insertAdjacentHTML('beforeend', html);
    });
}

async function fetch_rss(links) {
  for (url of links) {
    await async_fetch(url);
  }
}
