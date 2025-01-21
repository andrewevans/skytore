import express from "express"
import fs from "fs"
import https from "https"

const app = express()

app
  .use(
    express.static("../", {
      setHeaders: function (res, path) {
        if (path.indexOf("sw.js") !== -1) // TODO: Get filename from config
          res.set("Service-Worker-Allowed", "/")
      },
    }),
  )

app.get("/", function (req, res) {
  return res.end("<p>This server serves up static files.</p>")
})

const options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem"),
}

const server = https.createServer(options, app)

server.listen(443, () => {
  console.log(`Example app listening on port 443`)
})
