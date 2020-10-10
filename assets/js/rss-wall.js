const proxyurl = "https://cors-anywhere.herokuapp.com/";
const RSS_URL = "https://news.yahoo.co.jp/rss/media/shokuhin/all.xml";

fetch(proxyurl + RSS_URL)
  .then(response => response.text())
  .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
  .then(data => {
    const items = data.querySelectorAll("item");
    let html = ``;
    items.forEach(el => {
      html += `
        <article>
          <a href="${el.querySelector("link").innerHTML}" target="_blank" rel="noopener">
            <img src="${el.querySelector("image").innerHTML}" alt="">
            <h2>
${el.querySelector("title").innerHTML}
            </h2>
          </a>
        </article>
      `;
    });
    //document.body.insertAdjacentHTML("beforeend", html);
    //document.getElementById("main").innerHTML = html;
    document.body.innerHTML = html;
  });

