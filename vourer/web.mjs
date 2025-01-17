import express from "express"

function web() {
  const app = express()
  const port = 80

  app.use(express.static("../")).listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
}

export default web()
