const skvto = {
  reader: document.getElementById('reader'),
  url: new URL(document.URL),
  page: 1,
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
  }
}

function putData(text) {
  skvto.reader.innerHTML = text
}

getData(skvto.page)

const navNext = document.querySelector("#nav-next");
navNext.addEventListener("click", navClickNext);

const navPrevious = document.querySelector("#nav-back");
navPrevious.addEventListener("click", navClickPrevious);

function navClickNext(event) {
  event.preventDefault();
  getData(skvto.page + 1)
}

function navClickPrevious(event) {
  event.preventDefault();
  getData(skvto.page - 1)
}
