const skvto = {
  reader: document.getElementById('reader'),
  url: new URL(document.URL),
  page: 1,
  nav: {
    next: document.querySelector("#nav-next"),
    previous: document.querySelector("#nav-back"),
  },
  markdown: {
    block: /\n\n/,
    h1: /\n============/gm,
    box: /\■/,
    break: /\* \* \*/,
    shortBreak: /^\*$/,
    checkIn: /\&gt\;/gm,
    checkInAt: /\n/gm,
  },
  currentText: '',
  currentBlocks: [],
  setBlocks() {
    this.currentBlocks = this.currentText.split(this.markdown.block)
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
  setBoxes() {
    this.currentBlocks = this.currentBlocks.map((block) => {
      if (this.markdown.box.test(block.innerHTML)) {
        const boxes = Array.from(block.innerHTML)
        const boxLength = boxes.length
        // 4 = block size, 2 = width of block aka sq root of block size
        const breakAt = (Math.floor(boxLength/4) * 2) + Math.min(2, boxLength % 4)
        boxes.splice(breakAt, 0, ' ')
        const newEl = document.createElement('pre')
        newEl.innerHTML = boxes.join('')
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
  setShortBreaks() {
    this.currentBlocks = this.currentBlocks.map((block) => {
      if (this.markdown.shortBreak.test(block.innerHTML)) {
        const newEl = document.createElement('hr')
        newEl.dataset.val = block.innerHTML
        block = newEl
      }

      return block
    })
  },
  setCheckIns() {
    this.currentBlocks = this.currentBlocks.map((block) => {
      if (this.markdown.checkIn.test(block.innerHTML)) {
        const newEl = document.createElement('aside')
        const p = document.createElement('p')
        p.innerHTML = block.innerHTML.replaceAll(this.markdown.checkIn, '')
        p.innerHTML = p.innerHTML.replaceAll(this.markdown.checkInAt, '<br />')
        newEl.innerHTML = p.outerHTML

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

function updateNav() {
  const newPageUrl = new URL(document.URL)

  newPageUrl.searchParams.set('page', skvto.page + 1)
  skvto.nav.next.href = newPageUrl
  newPageUrl.searchParams.set('page', skvto.page - 1)
  skvto.nav.previous.href = newPageUrl
}

function updateUrl() {
  if (skvto.url.searchParams.has('page')) {
    skvto.url.searchParams.set('page', skvto.page)
    history.pushState({}, "", skvto.url);
  } else {
    skvto.url.searchParams.set('page', skvto.page)
  }

  updateNav()
}

function putData() {
  skvto.reader.replaceChildren()
  skvto.setBlocks()
  skvto.setH1()
  skvto.setBoxes()
  skvto.setBreaks()
  skvto.setShortBreaks()
  skvto.setCheckIns()
  skvto.fillReader()
}

getData(skvto.page)

skvto.nav.next.addEventListener("click", event => navClicked(event, 1))
skvto.nav.previous.addEventListener("click", event => navClicked(event, -1))

function goToNavLink(direction) {
  window.scrollTo(0,0)
  getData(skvto.page + direction)
}

function navClicked(event, direction) {
  event.preventDefault()
  skvto.reader.replaceChildren()
  goToNavLink(direction)
}

window.addEventListener(
  "keydown",
  (event) => {
    if (event.defaultPrevented) {
      return; // Do nothing if the event was already processed
    }

    switch (event.key) {
      case "ArrowLeft":
        goToNavLink(-1)
        break;
      case "ArrowRight":
        goToNavLink(1)
        break;
      default:
        return; // Quit when this doesn't handle the key event.
    }

    // Cancel the default action to avoid it being handled twice
    event.preventDefault();
  },
  true,
)

let touchstartX = 0
let touchendX = 0

function checkDirection() {
  if (touchendX < touchstartX && 200 < (touchstartX - touchendX)) {
    goToNavLink(1)
  }

  if (touchendX > touchstartX && 200 < (touchendX - touchstartX)) {
    goToNavLink(-1)
  }
}

document.addEventListener('touchstart', e => {
  touchstartX = e.changedTouches[0].screenX
})

document.addEventListener('touchend', e => {
  touchendX = e.changedTouches[0].screenX
  checkDirection()
})

let lastKnownScrollPosition = 0;
let ticking = false;

function doSomething(scrollPos) {
  document.getElementById('all').style.backgroundPositionY = `${scrollPos}px`
}

document.addEventListener("scroll", (event) => {
  lastKnownScrollPosition = window.scrollY;

  if (!ticking) {
    window.requestAnimationFrame(() => {
      doSomething(lastKnownScrollPosition);
      ticking = false;
    });

    ticking = true;
  }
});
