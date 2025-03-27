# mpc_nodejs_websocket_chat_server
- A server for a redis that is containered into docker.
- Requires prior knowledge with environment variables aka .env files.

# constants for your .env file
SERVER_NETWORK_SOCKET_PORT=
CHAT_UNIVERSE_NAME=
DOCKER_CONTAINER_NAME=
DOCKER_CONTAINER_PORT=
DOCKER_CONTAINER_IMAGE_NAME=
REDIS_USER_NAME=
REDIS_USER_PASSWORD=
REDIS_HOST_NAME=

# if you decide to use docker, then you can easily load it with this command in the root directory.
docker compose -f mpc_node_websocket_chat_server.yaml up -d

