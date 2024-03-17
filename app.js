`use strict`
const express = require(`express`)
const expressWs = require('express-ws')
const redis = require('redis')
const cluster = require(`node:cluster`)
const totalCPUs = require("os").cpus().length
const port = 8082

if (cluster.isPrimary) {
    //Predatabase operations...
    (async () => {
        console.log(`Nodejs Engine: Ready...`)
        const redisClient = redis.createClient({
            socket: {
                host: "127.0.0.1",
                port: 6379,
                username: "default",
                password: ""
            }
        })
        redisClient.on("error", (error) => console.error(`Error : ${error}`))
        await redisClient.connect()
        console.log(`Redis Database Memory: Ready...`)
    })().catch(err => {
        console.error(err);
    })

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

        ws.on('message', async (message_string) => {
            let obj = await JSON.parse(message_string)
            const redisClient = await redis.createClient({
                socket: {
                    host: "127.0.0.1",
                    port: 6379,
                    username: "default",
                    password: ""
                }
            })
            await redisClient.on("error", (error) => console.error(`Error : ${error}`))
            await redisClient.connect()
            await redisClient.rPush(`${obj.id} ${obj.send_to} ${obj.timestamp}`, [`${obj.display_name}`, `${obj.id}`, `${obj.send_to}`, `${obj.message}`, `${obj.online_status}`, `${obj.avatar_url_path}`, `${obj.avatar_title}`, `${obj.timestamp}`])
            await connections.forEach((conn) => conn.send(message_string))
        })

        ws.on('close', () => {
            connections.delete(ws)
        })
    }
    app.ws('/api/chat_universe', wsHandler)
    app.use(express.static('build'))
    app.listen(port, () => console.log(`WebsSocket Chat Server: a thread is listening on PORT ${port}`))
}