/*global MediumEditor */

const skvto = {
  reader: document.getElementById('reader'),
  url: new URL(document.URL),
  page: 1,
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
    box: /■/,
    break: /\* \* \*/,
    shortBreak: /^\*$/,
    em: /\*([^*]+?)\*/g,
    checkIn: /&gt;/gm,
    checkInAt: /\n/gm,
  },
  isEditing: false,
  currentText: '',
  currentBlocks: [],
  intervalId: 0,
  intervalIdOuter: 0,
  createNewEditor: function (block) {
    let handler;
    if (typeof MediumEditor !== 'undefined' && block.tagName === 'P' && !block.dataset.mediumEditorElement) {
      block.blockEditor = new MediumEditor(block, {
        disableReturn: true,
        disableDoubleReturn: true,
        disableExtraSpaces: true,
      })

      block.editOriginal = block.innerHTML

      block.addEventListener('blur', handler = () => {
        block.blockEditor?.destroy()
        block.removeEventListener('blur', handler)

        if (block.innerHTML !== block.editOriginal) {
          localStorage.setItem(`page-${this.page}-block-${block.dataset.block}`, block.innerHTML)
        }
      })
    }
  },
  pauseOrPlayOrEdit: function (event) {
    const atBlock = event.target

    if (this.isEditing) {
      this.createNewEditor(event.target)
    } else {
      this.audio.audioStop()

      if (!synth.speaking) {
        synth.cancel()
        readText(atBlock)
      } else {
        synth.cancel()
      }
    }
  },
  setBlocks() {
    this.currentBlocks = this.currentText.split(this.markdown.block)
    this.currentBlocks = this.currentBlocks.map((block, i) => {
      const el = document.createElement('p')
      el.setAttribute('data-block', i.toString())
      el.tabIndex = i
      el.innerHTML = block

      if (localStorage.getItem(`page-${skvto.page}-block-${el.dataset.block}`)) {
        el.innerHTML = localStorage.getItem(`page-${skvto.page}-block-${el.dataset.block}`)
      }

      el.addEventListener("click", event => this.pauseOrPlayOrEdit(event, 1))
      return el
    })
  },
  setH1() {
    this.currentBlocks = this.currentBlocks.map((block) => {
      if (this.markdown.h1.test(block.innerHTML)) {
        const newEl = document.createElement('h1')
        newEl.innerHTML = block.innerHTML.replaceAll(this.markdown.h1, '')
        block = newEl
        block.addEventListener("click", event => this.pauseOrPlayOrEdit(event, 1))
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
        const breakAt = (Math.floor(boxLength / 4) * 2) + Math.min(2, boxLength % 4)
        boxes.splice(breakAt, 0, ' ')
        const newEl = document.createElement('h2')
        newEl.innerHTML = boxes.join('')
        block = newEl
        block.addEventListener("click", event => this.pauseOrPlayOrEdit(event, 1))
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
    this.currentBlocks = this.currentBlocks.map((block, i) => {
      if (this.markdown.checkIn.test(block.innerHTML)) {
        const newEl = document.createElement('aside')
        newEl.setAttribute('data-block', i.toString())
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
      block.innerHTML = block.innerHTML.replace(this.markdown.em, "<i>$1</i>")
    })
  },
  audio: {
    audioElement: {},
    audioEnded: false,
    breakAudio: [
      {
        audioTitle: '',
        audioAsset: 'assets/wall-clock-tick.mp3',
        direction: 0,
        panner() {
          return 0
        },
      },
      {
        audioTitle: '* * *',
        audioAsset: 'assets/spooky-dinkus.mp3',
        direction: 1,
        panner(pannerPanValue) {
          return Math.max(-1, pannerPanValue - 0.1)
        },
      },
      {
        audioTitle: '*',
        audioAsset: 'assets/old-radio-static-noise-short.mp4',
        direction: -1,
        panner(pannerPanValue) {
          return Math.min(1, pannerPanValue + 0.1)
        },
      },
    ],
    audioStop() {
      this.audioElement.currentTime = this.audioElement.duration
      this.audioEnded = true
    },
    audioPlay() {
      this.audioElement.play()
    },
    audioSetup(atBlock, audioTitle) {
      const audioContext = new AudioContext();
      const audioLength = 5
      this.audioElement = document.createElement('audio')
      const track = audioContext.createMediaElementSource(this.audioElement);
      const breakAudio = this.breakAudio.find(each => each.audioTitle === audioTitle) || this.breakAudio[0]
      this.audioElement.src = breakAudio.audioAsset
      this.audioElement.volume = 0.2
      let playBackIteration = 1
      let audioIsCut = false
      this.audioEnded = false
      const panner = new StereoPannerNode(audioContext, {pan: breakAudio.direction || 0})
      track.connect(panner).connect(audioContext.destination);

      this.audioElement.addEventListener("timeupdate", () => {
        if (this.audioElement.currentTime > audioLength && !audioIsCut) {
          this.audioElement.currentTime = this.audioElement.duration
          audioIsCut = true
        }

        panner.pan.value = breakAudio.panner(panner.pan.value)
        this.audioElement.volume = (playBackIteration > 0 && playBackIteration <= 1) ?
          Math.min(this.audioElement.volume + 0.1, 1) :
          Math.max(this.audioElement.volume - 0.1, 0)
        playBackIteration = (this.audioElement.volume >= 1) ? 0 : playBackIteration - 0.1
      });

      this.audioElement.addEventListener("ended", () => {
        if (!this.audioEnded) readText(atBlock)
      });
    },
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
      }
    }.bind(this)

    doOuterThing()
  },
  init() {
    this.isEditing = false
    this.page = parseInt(this.url.searchParams.get('page')) || this.page
  },
}

async function getData(newPage) {
  const url = `pages/part-${newPage}.txt`;
  clearInterval(skvto.intervalId);
  clearInterval(skvto.intervalIdOuter);

  const boxes = Array.from('■'.repeat(Math.max(newPage - 1, 1)))
  const boxLengthLoader = boxes.length
  // 4 = block size, 2 = width of block aka sq root of block size
  const breakAt = (Math.floor(boxLengthLoader / 4) * 2) + Math.min(2, boxLengthLoader % 4)
  boxes.splice(breakAt, 0, ' ')
  const newEl = document.createElement('h2')
  newEl.innerHTML = boxes.join('')
  newEl.style.color = '#808080'
  skvto.reader.appendChild(newEl)

  const response = await fetch(url);

  if (!response.ok) throw new Error(`Response status: ${response.status}`)

  skvto.currentText = await response.text()
  skvto.page = newPage
  updateUrl()
  putData()
}

function updateNav() {
  const newPageUrl = new URL(document.URL)
  newPageUrl.searchParams.set('page', (skvto.page + 1).toString())
  pageNavigator.nav.next.href = newPageUrl
  newPageUrl.searchParams.set('page', (skvto.page - 1).toString())
  pageNavigator.nav.previous.href = newPageUrl
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

const pageNavigator = {
  touchstartX: 0,
  touchendX: 0,
  nav: {
    next: document.querySelector("#nav-next"),
    previous: document.querySelector("#nav-back"),
    edit: document.querySelector('#edit-reader')
  },
  goToNavLink: function (direction, event) {
    if (skvto.isEditing) return

    synth.cancel()
    skvto.audio.audioStop()
    window.scrollTo(0, 0)
    skvto.reader.replaceChildren()
    event?.preventDefault() // Cancel the default action to avoid it being handled twice
    getData(skvto.page + direction).catch(() => {
      getData(skvto.page, event).then()
    })
  },
  navClicked: function (event, direction) {
    event.preventDefault()
    this.goToNavLink(direction, event)
  },
  checkDirection: function (event) {
    if (event?.key === 'ArrowRight' || this.touchendX < this.touchstartX && 150 < (this.touchstartX - this.touchendX)) {
      this.goToNavLink(1)
    }

    if (event?.key === 'ArrowLeft' || this.touchendX > this.touchstartX && 150 < (this.touchendX - this.touchstartX)) {
      this.goToNavLink(-1)
    }
  },
  init: function () {
    window.addEventListener('keydown', event => {
      if (event.defaultPrevented) return // Do nothing if the event was already processed
      this.checkDirection(event)
    })

    document.addEventListener('touchstart', event => {
      this.touchstartX = event.changedTouches[0].screenX
    })

    document.addEventListener('touchend', event => {
      this.touchendX = event.changedTouches[0].screenX
      this.checkDirection()
    })

    this.nav.next.addEventListener("click", event => this.navClicked(event, 1))
    this.nav.previous.addEventListener("click", event => this.navClicked(event, -1))
  },
}

const backgroundMotion = {
  lastKnownScrollPosition: 0,
  ticking: false,
  init: function () {
    document.addEventListener("scroll", () => {
      this.lastKnownScrollPosition = window.scrollY;

      if (!this.ticking) {
        window.requestAnimationFrame(() => {
          document.getElementById('all').style.backgroundPositionY = `${this.lastKnownScrollPosition}px`
          this.ticking = false;
        });

        this.ticking = true;
      }
    });
  }
}

function readText(atBlock) {
  const blockValue = atBlock?.dataset.block || 0
  const currentBlocksStartingAt = skvto.currentBlocks.slice(blockValue)

  skvto.currentBlocks.forEach(block => block.classList.remove('marked')) // Remove in case the synth was canceled

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

    utterThis.addEventListener("start", () => {
      block.classList.add('marked')

      if (!isElementInViewport(block)) block.scrollIntoView({behavior: 'smooth'})

      if (block?.dataset?.val) {
        synth.cancel()
        skvto.audio.audioSetup(currentBlocksStartingAt[index + 1], block.dataset.val)
        skvto.audio.audioPlay()
      }
    });

    utterThis.addEventListener("end", () => {
      block.classList.remove('marked')
    });

    synth.speak(utterThis)
  })
}

function isElementInViewport(el) {
  const rect = el.getBoundingClientRect()
  return rect.bottom > 0 && rect.bottom < window.innerHeight
}

skvto.init()
const synth = window.speechSynthesis; // Text to Speech
synth.cancel()
let utterThese = []
getData(skvto.page).then()
pageNavigator.init()
backgroundMotion.init()

document.getElementById('edit-reader').addEventListener("click", event => {
  event.preventDefault()
  skvto.isEditing = !skvto.isEditing

  if (skvto.isEditing) {
    synth.cancel()
    skvto.audio.audioStop()
    skvto.currentBlocks.forEach(block => block.classList.remove('marked'))
    document.getElementById('edit').classList.add('editing')
  } else {
    document.getElementById('edit').classList.remove('editing')
  }
})
