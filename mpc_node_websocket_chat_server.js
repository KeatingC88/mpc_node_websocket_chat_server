`use strict`
require('dotenv').config()
const os = require("os")
const total_cpus = os.cpus().length
const express = require(`express`)
const express_ws = require('express-ws')
const redis = require('redis')
const cluster = require(`node:cluster`)

let server_network_ip_address = `auto`
//let server_network_ip_address = `127.0.0.1`
const server_network_socket_port = process.env.SERVER_NETWORK_SOCKET_PORT

const get_hardware_ethernet_local_ip_address = () => {
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
        server_network_ip_address = `${get_hardware_ethernet_local_ip_address()}`

    if (cluster.isPrimary) {

        (async () => {

            console.log(`NodeJS Primary Cluster: Connecting to Redis Database Docker Container...`)

            const redis_connection_test = redis.createClient({
                socket: {
                    host: server_network_ip_address,
                    port: process.env.REDIS_PORT,
                    username: process.env.REDIS_USER_NAME,
                    password: process.env.REDIS_USER_PASSWORD
                }
            })

            redis_connection_test.on("error", (error) => {
                console.error(`Redis Error: ${error}`)
            })

            await redis_connection_test.connect()
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

                const saving_message_to_redis = await redis.createClient({
                    socket: {
                        host: server_network_ip_address,
                        port: process.env.REDIS_PORT,
                        username: process.env.REDIS_USER_NAME,
                        password: process.env.REDIS_USER_PASSWORD
                    }
                })
                await saving_message_to_redis.on("error", (error) => console.error(`${error}`))

                await saving_message_to_redis.connect()

                await saving_message_to_redis.rPush(`${obj.id}|${obj.send_to}|${obj.timestamp}`, [`${obj.id}`, `${obj.send_to}`, `${obj.message}`, `${obj.timestamp}`, `${obj.name}`, `${obj.online_status}`, `${obj.avatar_title}`, `${obj.avatar_url_path}`, `${obj.language}`, `${obj.region}`])

                await connections.forEach((conn) => conn.send(message_string))
            })

            ws.on('close', () => {
                connections.delete(ws)
            })
        }

        //Set a common chat name for all end users to send and receive messages when using this server's TCP connection
        app.ws(`/api/${process.env.CHAT_UNIVERSE_NAME}`, wsHandler)

        app.use(express.static('build'))

        //Server is listening on this HTTP/s Address.
        app.listen(server_network_socket_port, server_network_ip_address, () => console.log(`Chat Server:\na CPU Core is listening on \nNetwork IP Address ${server_network_ip_address}:${server_network_socket_port}`))

        app.use(express.json())

        app.use((req, res, next) => {
            res.header("Access-Control-Allow-Origin", "*")
            res.header("Access-Control-Allow-Methods", "GET")
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
            next()
        })

        //Request Direct Message Conversation End User and Participant
        app.get('/api/:from/:sent_to', async (req, res) => {

            //Configure Redis Client
            const redis_client = redis.createClient({
                socket: {
                    host: server_network_ip_address,
                    port: process.env.REDIS_PORT,
                    username: process.env.REDIS_USER_NAME,
                    password: process.env.REDIS_USER_PASSWORD
                }
            })

            //Catch any errors
            await redis_client.on("error", (error) => console.error(`Error : ${error}`))

            //Connect to Redis
            await redis_client.connect()

            //Query Redis for the End User Conversation with a Participant
            let from = await redis_client.keys(`${req.params.from}|${req.params.sent_to}|*`, null)
            let sent_to = await redis_client.keys(`${req.params.sent_to}|${req.params.from}|*`, null)

            //Storage for the messages in the database
            let from_data = {}
            let sent_to_data = {}

            //Query Redis Database for Messages from End User
            for (let index in from.sort()) {
                from_data[`${from[index]}`] = await redis_client.lRange(`${from[index]}`, 0, -1, null)
            }

            //Query Redis Database for Messages from Participant
            for (let index in sent_to.sort()) {
                sent_to_data[`${sent_to[index]}`] = await redis_client.lRange(`${sent_to[index]}`, 0, -1, null)
            }

            //Respond by Sending The Requested Information back to the client in JSON
            res.send(JSON.stringify({
                from: from_data,
                sent_to: sent_to_data
            }))

            //Disconnect from Redis gracefully
            await redis_client.quit()

        })

    }

} catch (err) {
    console.error('Server Error:', err)
}