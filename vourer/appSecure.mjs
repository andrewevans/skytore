import express from "express"
import fs from "fs"
import readline from "readline"
import https from "https"

function app() {
  const app = express()
  const port = 3030

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  app.get("/", (req, res) => {
    res.setHeader("Content-Type", "text/plain")
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")
    console.log()
    res.send("GET: Hello World!")
  })

  app.post("/", (req, res) => {
    let newData = []

    res.setHeader("Content-Type", "text/plain")
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")

    req
      .on("data", (d) => {
        // console.log('data', d)
        newData.push(d)
      })
      .on("end", () => {
        newData = Buffer.concat(newData).toString()
        res.statusCode = 201
        let previousChecksum
        let newChecksum
        const date = new Date().toLocaleDateString()
        const entry = `\n${date}:\n${newData}`
        const previousData = fs.readFileSync("diary.txt", { encoding: "utf8" })

        newChecksum = getChecksum(newData)
        previousChecksum = getChecksum(previousData)

        if (previousChecksum !== newChecksum) {
          fs.appendFile("diary.txt", entry, (err) => {
            if (err) throw err
            console.log("Diary entry saved successfully!")
            rl.close()
          })
        }

        res.end()
      })

    res.send("Diary entry saved successfully!")
  })

  const options = {
    key: fs.readFileSync("../key.pem"),
    cert: fs.readFileSync("../cert.pem"),
  }

  const server = https.createServer(options, app)

  server.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })

  function getChecksum(data) {
    let diaryArray = data.split("\n")

    return diaryArray[diaryArray.length - 1].split(" :: ")[1]
  }
}

export default app()
