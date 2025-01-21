import express from "express"

function web() {
  const app = express()
  const port = 80

  app
    .use(
      express.static("../", {
        setHeaders: function (res, path) {
          if (path.indexOf("sw.js") !== -1) // TODO: Get filename from config
            res.set("Service-Worker-Allowed", "/")
        },
      }),
    )
    .listen(port, () => {
      console.log(`Example app listening on port ${port}`)
    })

  return app
}

export default web()
