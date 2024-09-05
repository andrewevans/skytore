const skvto = {
  reader: document.getElementById('reader'),
  url: new URL(document.URL),
  page: 1,
  h1: document.createElement('h1'),
  nav: {
    next: document.querySelector("#nav-next"),
    previous: document.querySelector("#nav-back"),
  },
  markdown: {
    h1: '\n============\n',
  },
  currentText: '',
  setH1() {
    if (this.page === 1) {
      this.h1.innerHTML = this.currentText.slice(0, this.currentText.indexOf(this.markdown.h1))
      this.reader.prepend(this.h1)
      this.currentText = this.currentText.replace(`${this.h1.innerHTML}${this.markdown.h1}`, '')
    }
  },
  setParagraphs() {
    this.reader.innerHTML = this.reader.innerHTML.replaceAll(/\n(.*)\n/g, '<p>$1</p>')
  },
}

skvto.page = parseInt(skvto.url.searchParams.get('page')) || skvto.page

async function getData(newPage) {
  const url = `pages/part-${newPage}.txt`;
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    skvto.currentText = await response.text()
    skvto.page = newPage
    putData()
  } catch (error) {
    window.console.info(error)
  }
}

function putData() {
  skvto.reader.replaceChildren()
  skvto.setH1()
  skvto.reader.append(skvto.currentText)
  skvto.setParagraphs()
}

getData(skvto.page)

skvto.nav.next.addEventListener("click", event => navClicked(event, 1))
skvto.nav.previous.addEventListener("click", event => navClicked(event, -1))

function navClicked(event, direction) {
  event.preventDefault();
  getData(skvto.page + direction)
}
