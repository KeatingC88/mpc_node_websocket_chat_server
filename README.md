Node.js WebSocket Chat Server

Environment Variables (.env)
Create a .env file in the root directory and define the following variables:

# === [Server Configuration] ===
SERVER_NETWORK_SOCKET_PORT=

# Chat Universe Settings
CHAT_UNIVERSE_NAME=

# === [Docker Configuration] ===
# Docker's Container Name Display
DOCKER_CONTAINER_NAME=
# Docker's Container Port
DOCKER_CONTAINER_PORT=
# Docker's Container Image Name Display
DOCKER_CONTAINER_IMAGE_NAME=

# === [Redis Credentials] ===
# Username for Redis Database
REDIS_USER_NAME=
# Password for Redis Database
REDIS_USER_PASSWORD=
# Hostname for Redis Database
REDIS_HOST_NAME=

# Running with Docker

To start the server inside a Docker container, use:

docker compose -f mpc_node_websocket_chat_server.yaml up -d

This will automatically set up the WebSocket chat server with some Redis Database of your choosing.

# Running Without Docker
If you prefer to run the server manually, navigate to the project root directory and execute:
node mpc_node_websocket_chat_server.js

# Features
WebSocket-powered real-time chat communication

Secure Redis authentication using .env secrets

Docker container support for easy deployment

Auto-detects the first available Ethernet protocol

Happy Coding!
Feel free to contribute, report issues, or suggest improvements.