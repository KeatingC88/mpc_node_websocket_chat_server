# Start without Yaml cmd
docker run -it fa6d13cc6367d1215857587e970ce13743aa76b2bfd3e751bc343369ed8d487b bash

# Start redisdb docker for nodejs wschat to use as it's database container. Assuming the Cmd prompt is in the correct folder.
docker compose -f mpc_redis_websocket_chat_db.yaml up -d

# After loading docker container and navigating to the folder in cmd prompt. To List Containers Cmd:
docker ps

#Connect to Docker Image Cmd:
docker exec -it fa6d13cc6367d1215857587e970ce13743aa76b2bfd3e751bc343369ed8d487b bash

How to launch redis-cli 
redis-cli

Ping Redis
ping

How Data is Stored in this instance...
rpush "{userA} {userB}" "{TS}" "..."

How Data is Called by redis... like a range to extract from the key's stored data
lrange {key} {start-get-value} {end-get-value}

lrange {key} 0 -1

How this server's data is structured from key = values
1) from
2) to
3) end users' message
4) time stamp
5) display name
6) display status
7) avatar image url path
8) avatar title
x) group number?
x) admin/mod?

i.e. a string key is like this: 1|2|3|4|5|6|7|8
or a.k.a. like this : {from}|{to}|{message}|{time stamp}|...

