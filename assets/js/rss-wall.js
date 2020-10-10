const proxyurl = "https://cors-anywhere.herokuapp.com/";

function fetch_rss(links) {
  for (var url of links) {
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
          if (image) html += `<img src="${image.innerHTML}" alt="">`;
          html += `<h2>${el.querySelector("title").innerHTML}</h2>
              </a>
            </article>
          `;
        });
        document.body.insertAdjacentHTML('beforeend', html);
      });
  }
}
