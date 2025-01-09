const skvto = {
  reader: document.getElementById('reader'),
  url: new URL(document.URL),
  page: 1,
  nav: {
    next: document.querySelector("#nav-next"),
    previous: document.querySelector("#nav-back"),
  },
  propers: {
    four: 'Vour',
    fourmeme: 'Vourmeme',
    fourcam: 'Vourcam',
    capital: 'Capital',
    ax: 'ander',
    a: 'Ander',
    cx: 'caressival',
    c: 'Caresse',
    g: '4élix',
  },
  markdown: {
    block: /\n\n/,
    h1: /\n============/gm,
    four: /\$four/gm,
    fourmeme: /\$fourmeme/gm,
    fourcam: /\$fourcam/gm,
    capital: /\$capital/gm,
    ax: /\$AX/gm,
    a: /\$A/gm,
    cx: /\$CX/gm,
    c: /\$C/gm,
    g: /\$G/gm,
    box: /\■/,
    break: /\* \* \*/,
    shortBreak: /^\*$/,
    em: /\*([^*]+?)\*/g,
    checkIn: /\&gt\;/gm,
    checkInAt: /\n/gm,
  },
  currentText: '',
  currentBlocks: [],
  intervalId: 0,
  intervalIdOuter: 0,
  setBlocks() {
    this.currentBlocks = this.currentText.split(this.markdown.block)
    this.currentBlocks = this.currentBlocks.map((block, i) => {
      const el = document.createElement('p')
      el.setAttribute('block', i.toString())
      el.innerHTML = block
      el.addEventListener("click", event => pauseOrPlay(event, 1))
      return el
    })
  },
  setH1() {
    this.currentBlocks = this.currentBlocks.map((block) => {
      if (this.markdown.h1.test(block.innerHTML)) {
        const newEl = document.createElement('h1')
        newEl.innerHTML = block.innerHTML.replaceAll(this.markdown.h1, '')
        block = newEl
        block.addEventListener("click", event => pauseOrPlay(event, 1))
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
        const newEl = document.createElement('h2')
        newEl.innerHTML = boxes.join('')
        block = newEl
        block.addEventListener("click", event => pauseOrPlay(event, 1))
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
  setVars() {
    this.currentBlocks.forEach((block) => {
      block.innerHTML = block.innerHTML.replaceAll(this.markdown.four, this.propers.four)
      block.innerHTML = block.innerHTML.replaceAll(this.markdown.fourmeme, this.propers.fourmeme)
      block.innerHTML = block.innerHTML.replaceAll(this.markdown.g, this.propers.g)
      block.innerHTML = block.innerHTML.replaceAll(this.markdown.ax, this.propers.ax)
      block.innerHTML = block.innerHTML.replaceAll(this.markdown.a, this.propers.a)
      block.innerHTML = block.innerHTML.replaceAll(this.markdown.cx, this.propers.cx) // Order matters
      block.innerHTML = block.innerHTML.replaceAll(this.markdown.c, this.propers.c)
      block.innerHTML = block.innerHTML.replaceAll(this.markdown.capital, this.propers.capital)
    })
  },
  setEm() {
    this.currentBlocks.forEach((block) => {
        block.innerHTML = block.innerHTML.replace(this.markdown.em, "<i>$1<\/i>")
    })
  },
  fillReader() {
    this.reader.replaceChildren()

    let outerCount = 0
    let innerCount = 0

    const doInnerThing = function (newBlock, innerHTML) {
      newBlock.innerHTML = innerHTML.substring(0, innerCount * 15 + (outerCount) * 15)
      // newBlock.innerHTML = '■ '.repeat(innerCount * 15 + (outerCount) * 15)
      // newBlock.style.transform = "scale(-1, -1)"
      // newBlock.style.textAlign = "right"
      // newBlock.style.fontSize = '0.75rem'
      // newBlock.style.letterSpacing = '-3px'
      newBlock.style.fontFamily = '"Webdings-Regular"'
      newBlock.style.color = '#808080'
      if ((innerCount * 15 + (outerCount) * 15) <= innerHTML.length) {

        innerCount++
        this.intervalId = setTimeout(doInnerThing, 5, newBlock, innerHTML)
      } else {
        newBlock.innerHTML = innerHTML
        newBlock.removeAttribute('style') // This removes the attribute regardless of what's in it

        innerCount = 0
        doOuterThing()
      }
    }.bind(this)

    const doOuterThing = function () {
      const newBlock = this.currentBlocks[outerCount]

      if (outerCount < this.currentBlocks.length) {
        this.reader.appendChild(newBlock)
        const innerHTML = newBlock.innerHTML
        newBlock.innerHTML = '■'
        this.intervalIdOuter = setTimeout(doInnerThing, 5, newBlock, innerHTML)
        outerCount++
      } else {
      }
    }.bind(this)

    doOuterThing()
  },
  init() {
    this.page = parseInt(this.url.searchParams.get('page')) || this.page
  },
}

skvto.init()

async function getData(newPage) {
  const url = `pages/part-${newPage}.txt`;
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    clearInterval(skvto.intervalId);
    clearInterval(skvto.intervalIdOuter);
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
  skvto.setVars()
  skvto.setH1()
  skvto.setBoxes()
  skvto.setBreaks()
  skvto.setShortBreaks()
  skvto.setEm()
  skvto.setCheckIns()
  skvto.fillReader()
}

getData(skvto.page)

skvto.nav.next.addEventListener("click", event => navClicked(event, 1))
skvto.nav.previous.addEventListener("click", event => navClicked(event, -1))

function goToNavLink(direction) {
  synth.cancel()
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
  if (touchendX < touchstartX && 150 < (touchstartX - touchendX)) {
    goToNavLink(1)
  }

  if (touchendX > touchstartX && 150 < (touchendX - touchstartX)) {
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

// Text to Speech
const synth = window.speechSynthesis;

let utterThese = []

window.track = {};
window.audioContext = {}
window.track = {}

function audioSetup(atBlock)
{
  if (true) {
    // get the audio element
    window.audioElement = document.createElement('audio')
    window.audioElement.src = 'assets/spooky-dinkus.mp3'
    window.audioContext = new AudioContext();
    window.track = window.audioContext.createMediaElementSource(window.audioElement);

    window.panner = new StereoPannerNode(window.audioContext)

    window.track.connect(window.panner).connect(window.audioContext.destination);

    window.audioElement.addEventListener("timeupdate", (event) => {
      if (window.audioElement.currentTime > 5) {
        window.audioElement.ended = true
      }

      window.panner.pan.value = Math.max(-1, window.panner.pan.value - 0.1)

      if (window.panner.pan.value > -1 && window.panner.pan.value < 0) {
        window.audioElement.volume = Math.max(window.audioElement.volume - 0.1, 0)
      } else if (window.panner.pan.value >= 0 && window.panner.pan.value < 1) {
        window.audioElement.volume = Math.min(window.audioElement.volume + 0.1, 1)
      }
    });

    window.audioElement.addEventListener(
      "ended",
      () => {
        pauseForAudio(atBlock)
      },
      false,
    );
  }

  window.panner.pan.value = 1
  window.audioElement.volume = 0.2
}

function readText(atBlock)
{
  const blockValue = atBlock?.block?.value || atBlock?.attributes?.block?.value || 0
  const currentBlocksStartingAt = skvto.currentBlocks.slice(blockValue)

  skvto.currentBlocks.forEach((block, index) => {
    block.classList.remove('marked') // Remove in case the synth was canceled
  })

  currentBlocksStartingAt.forEach((block, index) => {
    block.classList.remove('marked') // Remove in case the synth was canceled

    let utterThis = new SpeechSynthesisUtterance();
    utterThis.voice = synth.getVoices().find(voice => voice.name === 'Nicky')
    if (utterThis.voice) {
      utterThis.rate = 1.1;
      utterThis.pitch = 1.2;
    } else {
      utterThis.voice = synth.getVoices().find(voice => voice.name === 'Moira')
      utterThis.rate = 0.9;
      utterThis.pitch = 1.2;
    }

    utterThis.text = block.innerText
    utterThese.push(utterThis)

    utterThis.addEventListener("start", (event) => {
      block.classList.add('marked')

      if (!isElementInViewport(block)) {
        block.scrollIntoView({ behavior: 'smooth' })
      }

      if (utterThis.text === '') {
        audioSetup(currentBlocksStartingAt[index + 1])
        synth.cancel()
        window.audioElement.play()
      }
    });

    utterThis.addEventListener("end", (event) => {
      block.classList.remove('marked')
    });

    synth.speak(utterThis)
  })
}

function pauseForAudio(atBlock)
{
  synth.cancel()

  if (!synth.speaking) {
    readText(atBlock)
  }
}

function pauseOrPlay(event)
{
  const atBlock = event.srcElement.attributes

  if (!synth.speaking) {
    synth.cancel()
    readText(atBlock)
  } else if (synth.paused && navigator.userAgent.indexOf('Android') === -1) {
    synth.cancel()
    readText(atBlock)
//    synth.resume()
  } else if (navigator.userAgent.indexOf('Android') === -1) {
    synth.pause()
  } else {
    synth.cancel()
  }
}

function isElementInViewport(el) {
  const rect = el.getBoundingClientRect()

  return rect.bottom > 0 && rect.bottom < window.innerHeight
}
