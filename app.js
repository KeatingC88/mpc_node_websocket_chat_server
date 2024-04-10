`use strict`
const express = require(`express`)
const expressWs = require('express-ws')
const redis = require('redis')
const cluster = require(`node:cluster`)
const totalCPUs = require("os").cpus().length
const port = 8082

if (cluster.isPrimary) {
    (async () => {
        console.log(`Nodejs Engine: Connecting to Redis Database Container by Docker...`)
        const redisClient = redis.createClient({
            socket: {
                host: "127.0.0.1",
                port: 6379,
                username: "default",
                password: ""
            }
        })

        redisClient.on("error", (error) => {
            console.error(`Redis:\n${error}\nCheck Redis database hostname in this script or docker container with the database address.`)
        })

        await redisClient.connect()
        console.log(`Redis Database Memory: Ready...`)
    })().catch(err => {
        console.error(`How does this Trigger? In Here -- Check Script.`)
        console.error(err)
    })

    for (let i = 0; i < totalCPUs; i++) {
        cluster.fork()
    }

    cluster.on('exit', (worker, code, signal) => {
        cluster.fork()
    })
} else {
    //Start The Chat Universe with Redis Database.
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
            })//Credentials for the Database...
            await redisClient.on("error", (error) => console.error(`Error : ${error}`))//If there is a problem w/ the database connection...
            await redisClient.connect()//Establish Connection to the Database...
            await redisClient.rPush(`${obj.id}|${obj.send_to}|${obj.timestamp}`, [`${obj.id}`, `${obj.send_to}`, `${obj.message}`, `${obj.timestamp}`, `${obj.display_name}`,`${obj.online_status}`,`${obj.avatar_title}`,`${obj.avatar_url_path}`])//Save a record to Redis Database.
            await connections.forEach((conn) => conn.send(message_string))//Broadcast Message to Listeners...
        })

        ws.on('close', () => {
            connections.delete(ws)
        })
    }
    app.ws('/api/chat_universe', wsHandler)//Make the Connection with the credential properties and methods.
    app.use(express.static('build'))
    app.listen(port, () => console.log(`WebsSocket Chat Server: a thread is listening on PORT ${port}`))//Enable NodeJS to start listening like a server would do per thread.
    app.use(express.json())
    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*")
        res.header("Access-Control-Allow-Methods", "GET")
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
        next()
    })
    //Get Conversation Data between From and Sent_to
    app.get('/api/:from/:sent_to', async (req, res) => {
        const redisClients = redis.createClient({
            socket: {
                host: "127.0.0.1",
                port: 6379,
                username: "default",
                password: ""
            }
        })
        await redisClients.on("error", (error) => console.error(`Error : ${error}`))
        await redisClients.connect()
        //Query Redis for User A and User B converation.
        let from = await redisClients.keys(`${req.params.from}|${req.params.sent_to}|*`, null)
        let sent_to = await redisClients.keys(`${req.params.sent_to}|${req.params.from}|*`, null)    
        let from_data = {}
        let sent_to_data = {}
        //Query Redis for Message Data from User A.
        for (let index in from.sort()) {
            from_data[`${from[index]}`] = await redisClients.lRange(`${from[index]}`, 0, -1, null)
        }
        //Query Redis for Message Data from User B.
        for (let index in sent_to.sort()) {
            sent_to_data[`${sent_to[index]}`] = await redisClients.lRange(`${sent_to[index]}`, 0, -1, null)
        }
        //Send Redis Data from User A and User B to the Client that is requesting the conversation.
        res.send(JSON.stringify({
            from: from_data,
            sent_to: sent_to_data
        }))
    })
}