const skvto = {
  reader: document.getElementById('reader'),
  url: new URL(document.URL),
  page: 1,
  nav: {
    next: document.querySelector("#nav-next"),
    previous: document.querySelector("#nav-back"),
  },
  markdown: {
    h1: /\n============/gm,
    break: /\* \* \*/,
  },
  currentText: '',
  currentBlocks: [],
  setBlocks() {
    this.currentBlocks = this.currentText.split(/\n\n/)
    this.currentBlocks = this.currentBlocks.map((block) => {
      const el = document.createElement('p')
      el.innerHTML = block
      return el
    })
  },
  setH1() {
    this.currentBlocks = this.currentBlocks.map((block) => {
      if (this.markdown.h1.test(block.innerHTML)) {
        const newEl = document.createElement('h1')
        newEl.innerHTML = block.innerHTML.replaceAll(this.markdown.h1, '')
        block = newEl
      }

      return block
    })
  },
  setBreaks() {
    this.currentBlocks = this.currentBlocks.map((block) => {
      if (this.markdown.break.test(block.innerHTML)) {
        const newEl = document.createElement('hr')
        newEl.dataset.val = block.innerHTML
        block = newEl
      }

      return block
    })
  },
  fillReader() {
    this.reader.innerHTML = this.currentBlocks.map((block) => {
      return block.outerHTML
    }).join('')
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

    updateUrl()
    putData()
  } catch (error) {
    window.console.info(error)
  }
}

function updateUrl() {
  if (skvto.url.searchParams.has('page')) {
    skvto.url.searchParams.set('page', skvto.page)
    history.pushState({}, "", skvto.url);
  } else {
    skvto.url.searchParams.set('page', skvto.page)
  }
}

function putData() {
  skvto.reader.replaceChildren()
  skvto.setBlocks()
  skvto.setH1()
  skvto.setBreaks()
  skvto.fillReader()
}

getData(skvto.page)

skvto.nav.next.addEventListener("click", event => navClicked(event, 1))
skvto.nav.previous.addEventListener("click", event => navClicked(event, -1))

function navClicked(event, direction) {
  event.preventDefault();
  getData(skvto.page + direction)
}
