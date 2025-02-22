`use strict`
require('dotenv').config()
const os = require("os")
const total_cpus = os.cpus().length
const express = require(`express`)
const express_ws = require('express-ws')
const cors = require('cors')
const redis = require('redis')
const cluster = require(`node:cluster`)

let server_network_ip_address = `auto`
//let server_network_ip_address = `127.0.0.1`
//let server_network_ip_address = `mpc_node_websocket_chat_database`
const server_network_socket_port = process.env.SERVER_NETWORK_SOCKET_PORT

const local_ip_address = () => {
    const networkInterfaces = os.networkInterfaces()
    for (const interfaceName in networkInterfaces) {
        if (interfaceName.toLowerCase().includes('eth') || interfaceName.toLowerCase() === 'ethernet') {
            for (const networkInterface of networkInterfaces[interfaceName]) {
                if (networkInterface.family === 'IPv4' && !networkInterface.internal) {
                    return networkInterface.address
                }
            }
        }
    }
    return null
}

try {
    if (server_network_ip_address === `auto`)
        server_network_ip_address = `${local_ip_address()}`

    if (cluster.isPrimary) {
        (async () => {
            console.log(`Nodejs Primary Cluster: Connecting to Redis Database Container by Docker...`)

            const redisClient = redis.createClient({
                socket: {
                    host: server_network_ip_address,
                    //host: process.env.DOCKER_CONTAINER_NAME,
                    port: process.env.DOCKER_CONTAINER_PORT,
                    username: process.env.REDIS_USER_NAME,
                    password: process.env.REDIS_USER_PASSWORD
                }
            })

            redisClient.on("error", (error) => {
                console.error(`Redis: ${error}`)
            })

            await redisClient.connect()
            console.log(`Redis: Database Memory Ready...`)

        })().catch(err => {
            console.error(err)
        })

        for (let i = 0; i < total_cpus; i++) {
            cluster.fork()
        }

        cluster.on('exit', (worker, code, signal) => {
            cluster.fork()
        })
    } else {

        const app = express()
        express_ws(app)

        const connections = new Set()
        const wsHandler = (ws) => {

            connections.add(ws)

            ws.on('message', async (message_string) => {

                let obj = await JSON.parse(message_string)
                const redisClient = await redis.createClient({
                    socket: {
                        host: server_network_ip_address,
                        //host: process.env.DOCKER_CONTAINER_NAME,
                        port: process.env.DOCKER_CONTAINER_PORT,
                        username: process.env.REDIS_USER_NAME,
                        password: process.env.REDIS_USER_PASSWORD
                    }
                })
                await redisClient.on("error", (error) => console.error(`${error}`))

                await redisClient.connect()

                await redisClient.rPush(`${obj.id}|${obj.send_to}|${obj.timestamp}`, [`${obj.id}`, `${obj.send_to}`, `${obj.message}`, `${obj.timestamp}`, `${obj.display_name}`, `${obj.online_status}`, `${obj.avatar_title}`, `${obj.avatar_url_path}`])
                //console.log([`${obj.id}`, `${obj.send_to}`, `${obj.message}`, `${obj.timestamp}`, `${obj.display_name}`, `${obj.online_status}`, `${obj.avatar_title}`, `${obj.avatar_url_path}`])
                await connections.forEach((conn) => conn.send(message_string))
            })

            ws.on('close', () => {
                connections.delete(ws)
            })
        }

        app.ws('/api/chat_universe', wsHandler)

        app.use(express.static('build'))

        app.listen(server_network_socket_port, server_network_ip_address, () => console.log(`Node Websocket Chat Server:\na CPU Core is listening on \nNetwork IP Address ${server_network_ip_address}`))

        app.use(express.json())
        app.use((req, res, next) => {
            res.header("Access-Control-Allow-Origin", "*")
            res.header("Access-Control-Allow-Methods", "GET")
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
            next()
        })

        app.get('/api/:from/:sent_to', async (req, res) => {
            const redisClients = redis.createClient({
                socket: {
                    host: server_network_ip_address,
                    //host: process.env.DOCKER_CONTAINER_NAME,
                    port: process.env.DOCKER_CONTAINER_PORT,
                    username: process.env.REDIS_USER_NAME,
                    password: process.env.REDIS_USER_PASSWORD
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
} catch (err) {
    console.error('Error:', err)
}