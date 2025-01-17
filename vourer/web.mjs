import express from "express"

const app = express()
const port = 80

app.use(express.static('../')).listen(80)
