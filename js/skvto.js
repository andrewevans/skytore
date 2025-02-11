/*global MediumEditor */

const skvtoData = {
  page: 1,
  reader: document.getElementById("reader"),
  currentText: "",
  currentBlocks: [],
  properNounMarkdown: new Map([
    [/\$four/gm, "Vour"], // Order matters
    [/\$fourmeme/gm, "Vourmeme"],
    [/\$fourcam/gm, "Vourcam"],
    [/\$capital/gm, "Capital"],
    [/\$AX/gm, "ander"],
    [/\$A/gm, "Ander"],
    [/\$CX/gm, "caressival"],
    [/\$C/gm, "Caresse"],
    [/\$G/gm, "4élix"],
  ]),
  markdown: {
    block: /\n\n/,
    h1: /\n============/gm,
    box: /■/,
    break: /\* \* \*/,
    shortBreak: /^\*$/,
    em: /\*([^*]+?)\*/g,
    checkIn: /&gt;/gm,
    checkInAt: /\n/gm,
    pre: /&lt;/gm,
  },
  breakAudio: [
    {
      audioTitle: "",
      audioAsset: "assets/wall-clock-tick.mp3",
      direction: 0,
      panner() {
        return 0
      },
    },
    {
      audioTitle: "* * *",
      audioAsset: "assets/spooky-dinkus.mp3",
      direction: 1,
      panner(pannerPanValue) {
        return Math.max(-1, pannerPanValue - 0.1)
      },
    },
    {
      audioTitle: "*",
      audioAsset: "assets/old-radio-static-noise-short.mp4",
      direction: -1,
      panner(pannerPanValue) {
        return Math.min(1, pannerPanValue + 0.1)
      },
    },
  ],
  setBlocks() {
    this.currentBlocks = this.currentText.split(this.markdown.block)
    this.currentBlocks = this.currentBlocks.map((block, i) => {
      const el = document.createElement("p")
      el.innerHTML = block
      el.blockId = i

      if (localStorage.getItem(`page-${this.page}-block-${el.blockId}`)) {
        const itemKey = `page-${this.page}-block-${el.blockId}`
        el.innerHTML = localStorage.getItem(itemKey)
        el.classList.add("data-dirty")
      }

      return el
    })
  },
  setEverything() {
    this.currentBlocks = this.currentBlocks.map((block, i) => {
      block = this.setPre(block, i)
      block = this.setVars(block)
      block = this.setH1(block)
      block = this.setBoxes(block)
      block = this.setBreaks(block)
      block = this.setShortBreaks(block)
      block = this.setEm(block)
      block = this.setCheckIns(block, i)

      return block
    })
  },
  setH1(block) {
    if (this.markdown.h1.test(block.innerHTML)) {
      const newEl = document.createElement("h1")
      newEl.innerHTML = block.innerHTML.replaceAll(this.markdown.h1, "")
      block = newEl
    }

    return block
  },
  setBoxes(block) {
    if (this.markdown.box.test(block.innerHTML)) {
      const boxes = Array.from(block.innerHTML)
      const boxLength = boxes.length
      // 4 = block size, 2 = width of block aka sq root of block size
      const breakAt = Math.floor(boxLength / 4) * 2 + Math.min(2, boxLength % 4)
      boxes.splice(breakAt, 0, " ")
      const newEl = document.createElement("h2")
      newEl.innerHTML = boxes.join("")
      block = newEl
    }

    return block
  },
  setBreaks(block) {
    if (this.markdown.break.test(block.innerHTML)) {
      const newEl = document.createElement("hr")
      newEl.dataset.val = block.innerHTML
      block = newEl
    }

    return block
  },
  setShortBreaks(block) {
    if (this.markdown.shortBreak.test(block.innerHTML)) {
      const newEl = document.createElement("hr")
      newEl.dataset.val = block.innerHTML
      block = newEl
    }

    return block
  },
  setCheckIns(block, i) {
    if (this.markdown.checkIn.test(block.innerHTML)) {
      const newEl = document.createElement("aside")
      newEl.blockId = i
      const p = document.createElement("p")
      p.innerHTML = block.innerHTML.replaceAll(this.markdown.checkIn, "")
      p.innerHTML = p.innerHTML.replaceAll(this.markdown.checkInAt, "<br />")
      newEl.innerHTML = p.outerHTML
      block = newEl
    }

    return block
  },
  setPre(block, i) {
    if (this.markdown.pre.test(block.innerHTML)) {
      const newEl = document.createElement("pre")
      newEl.blockId = i
      newEl.innerHTML = block.innerHTML
      block = newEl
    }

    return block
  },
  setVars(block) {
    for (const [key, value] of this.properNounMarkdown) {
      block.innerHTML = block.innerHTML.replaceAll(key, value)
    }

    return block
  },
  setEm(block) {
    if (["ASIDE", "P"].indexOf(block.tagName) !== -1) {
      block.innerHTML = block.innerHTML.replace(this.markdown.em, "<em>$1</em>")
    }

    return block
  },
  getData: async function (newPage) {
    const url = `pages/part-${newPage}.txt`
    clearInterval(skvto.intervalId)
    clearInterval(skvto.intervalIdOuter)

    const boxes = Array.from("■".repeat(Math.max(newPage - 1, 1)))
    const boxLengthLoader = boxes.length
    // 4 = block size, 2 = width of block aka sq root of block size
    const breakAt =
      Math.floor(boxLengthLoader / 4) * 2 + Math.min(2, boxLengthLoader % 4)
    boxes.splice(breakAt, 0, " ")
    const newEl = document.createElement("h2")
    newEl.innerHTML = boxes.join("")
    newEl.classList.add("loading")
    this.reader.appendChild(newEl)

    const response = await fetch(url)

    if (!response.ok) throw new Error(`Response status: ${response.status}`)

    this.currentText = await response.text()
    this.page = newPage
  },
  putData: function () {
    this.setBlocks()
    this.setEverything()
    skvto.setCheckinFades()
    skvto.fillReader() // Part of reader
  },
  setupNewPage: async function (newPage) {
    await this.getData(newPage)
    await this.putData()
  },
}

const skvto = {
  hostname: (function () {
    const url = new URL(document.URL)

    return `${url.origin}:${url.protocol === "http:" ? 3000 : 3030}`
  })(),
  url: new URL(document.URL),
  isEditing: false,
  intervalId: 0,
  intervalIdOuter: 0,
  bellsAndWhistles: false,
  setBlockEvents: function () {
    skvtoData.currentBlocks.forEach((block) => {
      block.addEventListener("click", (event) =>
        skvto.pauseOrPlayOrEdit(event, 1),
      )
    })
  },
  postEdits: async function () {
    const editsList = []

    Object.keys(window.localStorage).forEach((key) => {
      if (key.indexOf("page-") === 0)
        editsList.push(`${key} :: ${window.localStorage.getItem(key)}`)
    })

    let editsBody = editsList.join("\n")
    const checksum =
      editsBody
        .split("")
        .reduce(
          (accumulator, currentValue) =>
            accumulator + currentValue.charCodeAt(0),
          0,
        ) % 256
    editsBody += `\nchecksum :: ${checksum}`

    await fetch(this.hostname, {
      method: "POST",
      body: editsBody,
    })
  },
  createNewEditor: function (block) {
    let handler
    if (
      typeof MediumEditor !== "undefined" &&
      block.tagName === "P" &&
      !block.dataset.mediumEditorElement
    ) {
      block.blockEditor = new MediumEditor(block, {
        disableReturn: true,
        disableDoubleReturn: true,
        disableExtraSpaces: true,
      })

      block.editOriginal = block.innerHTML

      block.addEventListener(
        "blur",
        (handler = () => {
          // if (event.relatedTarget instanceof HTMLElement) return // TODO: Hack to allow ctrl-v paste

          block.blockEditor?.destroy()
          block.removeEventListener("blur", handler)

          if (block.innerHTML !== block.editOriginal) {
            localStorage.setItem(
              `page-${skvtoData.page}-block-${block.blockId}`,
              block.innerHTML.replace(/[\n\r\t]/gm, ""),
            )
          }
        }),
      )
    }
  },
  pauseOrPlayOrEdit: function (event) {
    if (!this.bellsAndWhistles) return // TODO: Needs to distinguish between features "edit" and "speak"

    const atBlock = event.target

    if (this.isEditing) {
      this.createNewEditor(event.target)
    } else {
      this.audio.audioStop()

      if (!synth.speaking) {
        synth.cancel()
        this.readText(atBlock)
      } else {
        synth.cancel()
      }
    }
  },
  handleIntersection: function (entries, block) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) this.showBlock(block)
    })
  },
  showBlock: function (block) {
    block.observer.disconnect()
    block.classList.remove("hidden-checkin")
    showNotification(block)
  },
  setCheckinFades() {
    if (!skvto.bellsAndWhistles) return // TODO: Needs to distinguish between features "edit" and "speak"

    const options = {
      root: null, // Use the viewport as the root
      rootMargin: "0px 0px -75% 0px", // 75% bottom margin delays observer until block is 75% up the viewport
      threshold: 0, // Trigger when >0% of the element is visible
    }

    skvtoData.currentBlocks.forEach((block) => {
      if (block.tagName === "ASIDE") {
        block.classList.add("hidden-checkin")
        const handleIntersection = (entries) =>
          this.handleIntersection(entries, block)

        block.observer?.disconnect()
        block.observer = new IntersectionObserver(handleIntersection, options)
        block.observer.observe(block)
      }
    })
  },
  audio: {
    audioElement: {},
    audioEnded: false,
    audioStop() {
      this.audioElement.currentTime = this.audioElement.duration
      this.audioEnded = true
    },
    audioPlay() {
      this.audioElement.play()
    },
  },
  audioSetup(atBlock, audioTitle) {
    const audioContext = new AudioContext()
    const audioLength = 5
    this.audio.audioElement = document.createElement("audio")
    const track = audioContext.createMediaElementSource(this.audio.audioElement)
    const breakAudio =
      skvtoData.breakAudio.find((each) => each.audioTitle === audioTitle) ||
      skvtoData.breakAudio[0]
    this.audio.audioElement.src = breakAudio.audioAsset
    this.audio.audioElement.volume = 0.2
    let playBackIteration = 1
    let audioIsCut = false
    this.audio.audioEnded = false
    const panner = new StereoPannerNode(audioContext, {
      pan: breakAudio.direction || 0,
    })
    track.connect(panner).connect(audioContext.destination)

    this.audio.audioElement.addEventListener(
      "timeupdate",
      function () {
        if (this.audio.audioElement.currentTime > audioLength && !audioIsCut) {
          this.audio.audioElement.currentTime = this.audio.audioElement.duration
          audioIsCut = true
        }

        panner.pan.value = breakAudio.panner(panner.pan.value)
        this.audio.audioElement.volume =
          playBackIteration > 0 && playBackIteration <= 1
            ? Math.min(this.audio.audioElement.volume + 0.1, 1)
            : Math.max(this.audio.audioElement.volume - 0.1, 0)
        playBackIteration =
          this.audio.audioElement.volume >= 1 ? 0 : playBackIteration - 0.1
      }.bind(this),
    )

    this.audio.audioElement.addEventListener(
      "ended",
      function () {
        if (!this.audio.audioEnded) this.readText(atBlock)
      }.bind(this),
      false,
    )
  },
  fillReader() {
    skvtoData.reader.replaceChildren()
    let outerCount = 0
    let innerCount = 0

    const doInnerThing = function (newBlock, innerHTML) {
      newBlock.innerHTML = innerHTML.substring(
        0,
        innerCount * 15 + outerCount * 15,
      )
      newBlock.classList.add("webdinged")
      if (innerCount * 15 + outerCount * 15 <= innerHTML.length) {
        innerCount++
        this.intervalId = setTimeout(doInnerThing, 0, newBlock, innerHTML)
      } else {
        newBlock.innerHTML = innerHTML
        newBlock.classList.remove("webdinged")
        innerCount = 0
        doOuterThing()
      }
    }.bind(this)

    const doOuterThing = function () {
      const newBlock = skvtoData.currentBlocks[outerCount]

      if (outerCount < skvtoData.currentBlocks.length) {
        skvtoData.reader.appendChild(newBlock)
        const innerHTML = newBlock.innerHTML
        newBlock.innerHTML = "■"
        this.intervalIdOuter = setTimeout(doInnerThing, 0, newBlock, innerHTML)
        outerCount++
      }
    }.bind(this)

    doOuterThing()
  },
  addBellToggle() {
    document.querySelectorAll(".switch").forEach((theSwitch) => {
      theSwitch.setAttribute("aria-checked", this.bellsAndWhistles.toString())
      theSwitch.addEventListener(
        "click",
        function (evt) {
          const el = evt.currentTarget

          if (el.getAttribute("aria-checked") === "true") {
            el.setAttribute("aria-checked", "false")
            this.bellsAndWhistles = false
            this.isEditing = false
            document.getElementById("edit").dataset.active = this.isEditing

            synth.cancel()
            this.audio.audioStop()
            window.scrollTo(0, 0)

            skvtoData.currentBlocks.forEach((block) => {
              block.classList.remove("marked") // Remove in case the synth was canceled
              block.classList.remove("hidden-checkin")
              block.observer?.disconnect()
            })
          } else {
            el.setAttribute("aria-checked", "true")
            this.bellsAndWhistles = true
            Notification.requestPermission().then() // This must be directly in the "click" event listener for Safari
            this.setCheckinFades()
          }
        }.bind(this),
        false,
      )
    })
  },
  addEditor() {
    document
      .getElementById("edit-reader")
      .addEventListener("click", (event) => {
        if (!this.bellsAndWhistles) return // TODO: Needs to distinguish between features "edit" and "speak"

        event.preventDefault()
        this.isEditing = !this.isEditing
        document.getElementById("edit").dataset.active = this.isEditing
        synth.cancel()
        this.audio.audioStop()
        skvtoData.currentBlocks.forEach((block) =>
          block.classList.remove("marked"),
        )
      })

    document.getElementById("edit-clear").addEventListener("click", (event) => {
      if (!this.bellsAndWhistles) return // TODO: Needs to distinguish between features "edit" and "speak"

      event.preventDefault()

      Object.keys(window.localStorage).forEach((key) => {
        if (key.indexOf("page-") !== -1) window.localStorage.removeItem(key)
      })
    })

    document.getElementById("edit-save").addEventListener("click", (event) => {
      if (!this.bellsAndWhistles) return // TODO: Needs to distinguish between features "edit" and "speak"

      event.preventDefault()

      this.postEdits().then()

      Object.keys(window.localStorage).forEach((key) => {
        if (key.indexOf("page-") === 0) {
          window.console.info(`Saving... ${key}`)
        }
      })
    })
  },
  readText(atBlock) {
    if (!skvto.bellsAndWhistles) return // TODO: Needs to distinguish between features "edit" and "speak"

    const currentBlocksStartingAt = skvtoData.currentBlocks.slice(
      atBlock?.blockId || 0,
    )
    // Remove in case the synth was canceled
    skvtoData.currentBlocks.forEach((block) => block.classList.remove("marked"))

    currentBlocksStartingAt.forEach((block, index) => {
      block.classList.remove("marked") // Remove in case the synth was canceled
      let utterThis = new SpeechSynthesisUtterance()
      utterThis.voice = synth
        .getVoices()
        .find((voice) => voice.name === "Nicky")
      if (utterThis.voice) {
        utterThis.rate = 1.1
        utterThis.pitch = 1.2
      } else {
        utterThis.voice = synth
          .getVoices()
          .find((voice) => voice.name === "Moira")
        utterThis.rate = 0.9
        utterThis.pitch = 1.2
      }

      utterThis.text =
        block.tagName !== "PRE" ? block.innerText : "ASCII art image"
      utterThese.push(utterThis)

      utterThis.addEventListener("start", () => {
        block.removeAttribute("class")
        block.classList.add("marked")

        if (block.tagName === "ASIDE") showNotification(block)

        if (!isElementInViewport(block))
          block.scrollIntoView({ behavior: "smooth" })

        if (block?.dataset?.val) {
          synth.cancel()

          this.audioSetup(currentBlocksStartingAt[index + 1], block.dataset.val)

          this.audio.audioPlay()
        }
      })

      utterThis.addEventListener("end", () => {
        block.classList.remove("marked")
      })

      synth.speak(utterThis)
    })
  },
  init() {
    this.addBellToggle()
    this.addEditor()
    this.isEditing = false
  },
}

const pageNavigator = {
  touchstartX: 0,
  touchendX: 0,
  nav: {
    next: document.querySelector("#nav-next"),
    previous: document.querySelector("#nav-back"),
    edit: document.querySelector("#edit-reader"),
  },
  updateNav: function () {
    const newPageUrl = new URL(document.URL)
    newPageUrl.searchParams.set("page", (skvtoData.page + 1).toString())
    pageNavigator.nav.next.href = newPageUrl
    newPageUrl.searchParams.set("page", (skvtoData.page - 1).toString())
    pageNavigator.nav.previous.href = newPageUrl
  },
  updateUrl: function () {
    if (skvto.url.searchParams.has("page")) {
      skvto.url.searchParams.set("page", skvtoData.page)
      history.pushState({}, "", skvto.url)
    } else {
      skvto.url.searchParams.set("page", skvtoData.page)
    }
  },
  goToNavLink: function (direction, event) {
    if (skvto.isEditing) return

    synth.cancel()
    skvto.audio.audioStop()
    window.scrollTo(0, 0)
    skvtoData.currentBlocks.forEach((block) => block.observer?.disconnect())

    event?.preventDefault() // Cancel the default action to avoid it being handled twice
    skvtoReader.setupNewPage(direction)
  },
  navClicked: function (event, direction) {
    event.preventDefault()
    this.goToNavLink(direction, event)
  },
  checkDirection: function (event) {
    if (
      event?.key === "ArrowRight" ||
      (this.touchendX < this.touchstartX &&
        150 < this.touchstartX - this.touchendX)
    ) {
      this.goToNavLink(1)
    }

    if (
      event?.key === "ArrowLeft" ||
      (this.touchendX > this.touchstartX &&
        150 < this.touchendX - this.touchstartX)
    ) {
      this.goToNavLink(-1)
    }
  },
  init: function () {
    window.addEventListener("keydown", (event) => {
      if (event.defaultPrevented) return // Do nothing if the event was already processed
      this.checkDirection(event)
    })

    document.addEventListener("touchstart", (event) => {
      this.touchstartX = event.changedTouches[0].screenX
    })

    document.addEventListener("touchend", (event) => {
      this.touchendX = event.changedTouches[0].screenX
      this.checkDirection()
    })

    this.nav.next.addEventListener("click", (event) =>
      this.navClicked(event, 1),
    )
    this.nav.previous.addEventListener("click", (event) =>
      this.navClicked(event, -1),
    )
  },
}

const skvtoReader = {
  init: function () {
    skvto.init()
    this.setupNewPage()
    pageNavigator.init()
    backgroundMotion.init()
  },
  setupNewPage: function (direction = 0) {
    skvtoData.page =
      parseInt(skvto.url.searchParams.get("page")) || skvtoData.page

    skvtoData
      .setupNewPage(skvtoData.page + direction)
      .then(() => {
        skvto.setBlockEvents()
        pageNavigator.updateUrl()
        pageNavigator.updateNav()
      })
      .catch(() => {
        this.setupNewPage()
      })
  },
}

const backgroundMotion = {
  lastKnownScrollPosition: 0,
  ticking: false,
  init: function () {
    document.addEventListener("scroll", () => {
      this.lastKnownScrollPosition = window.scrollY

      if (!this.ticking) {
        window.requestAnimationFrame(() => {
          document.getElementById("all").style.backgroundPositionY =
            `${this.lastKnownScrollPosition}px`
          this.ticking = false
        })

        this.ticking = true
      }
    })
  },
}

function isElementInViewport(el) {
  const rect = el.getBoundingClientRect()
  return rect.bottom > 0 && rect.bottom < window.innerHeight && rect.top > 0
}

const setThemeColor = function () {
  const meta = document.createElement("meta")
  meta.name = "theme-color"
  meta.content = "#121212"
  const head = document.getElementsByTagName("head")[0]
  head.appendChild(meta)
}

setThemeColor()

const showNotification = (block) => {
  if (!skvto.bellsAndWhistles) return // TODO: Needs to distinguish between features "edit" and "speak"

  const blockText = block.innerText.split("\n")

  if (blockText.length < 2 || block.notificationShown) return

  block.notificationShown = true // Mark as shown so this function will short-circuit after the first pass

  if (Notification.permission !== "granted") return

  navigator.serviceWorker.ready.then((registration) => {
    setTimeout(() => {
      if (isElementInViewport(block)) {
        registration
          .showNotification(blockText[0], {
            body: blockText[1],
            icon: "vourer/favicon_io/android-chrome-192x192.png",
          })
          .then()
      }
    }, 1000)
  })
}

const synth = window.speechSynthesis // Text to Speech
synth.cancel()
let utterThese = []

skvtoReader.init()
