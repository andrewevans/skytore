const skvto = {
  reader: document.getElementById('reader'),
  url: new URL(document.URL),
  page: 1,
  h1: document.getElementsByTagName('h1')[0],
  nav: {
    next: document.querySelector("#nav-next"),
    previous: document.querySelector("#nav-back"),
  }
}

skvto.page = parseInt(skvto.url.searchParams.get('page')) || skvto.page

async function getData(newPage) {
  const url = `../pages/part-${newPage}.txt`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const text = await response.text();
    skvto.page = newPage
    putData(text)
  } catch (error) {
    window.console.info(error)
  }
}

function putData(text) {
  if (skvto.page !== 1) skvto.h1.innerHTML = '&#9632;'
  skvto.reader.innerHTML = text
}

getData(skvto.page)

skvto.nav.next.addEventListener("click", event => navClicked(event, 1))
skvto.nav.previous.addEventListener("click", event => navClicked(event, -1))

function navClicked(event, direction) {
  event.preventDefault();
  getData(skvto.page + direction)
}
