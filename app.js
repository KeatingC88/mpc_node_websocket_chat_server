`use strict`
const express = require(`express`)
const expressWs = require('express-ws')
const cluster = require(`node:cluster`)
const totalCPUs = require("os").cpus().length
const port = 8082
const serverLog = {}
const axios = require("axios")

if (cluster.isPrimary) {
    for (let i = 0; i < totalCPUs; i++) {
        cluster.fork()
    }
    cluster.on('exit', (worker, code, signal) => {
        cluster.fork()
    })
} else {
    const app = express()
    expressWs(app)

    const connections = new Set()
    const wsHandler = (ws) => {
        connections.add(ws)

        ws.on('message', (message) => {
            console.log(message)//Save per message?
            serverLog[Object.keys(serverLog).length] = message
            console.log(serverLog)//Save per X amount messages?
            connections.forEach((conn) => conn.send(message))
        })

        ws.on('close', () => {
            connections.delete(ws)
        })
    }
    app.ws('/api/chat', wsHandler)
    app.use(express.static('build'))
    app.listen(port, () => console.log(`WSChat Server: a thread is listening on PORT ${port}`))
}