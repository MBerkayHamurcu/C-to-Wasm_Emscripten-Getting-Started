# Setup

**This document links to the instructions on installing the emscripten compiler and contains the instructions for setting up a web server for development or using the docker containers**

------

Before installing anything, clone this repository on your local machine. This is necessary in order to be able to experiment with the Emscripten compiler (emcc) and to use the demonstration web pages of the following two directories.

## Installation on the host machine

### Installing the emscripten compiler

Following the instructions and platform-specific notes, you will be able to run the emscripten compiler on your host machine: [Download and install — Emscripten documentation](https://emscripten.org/docs/getting_started/downloads.html#).



### Setting up a web server for development

In order to view and test the website that interacts with the Wasm modules you have to access it via a web server. Opening the *index.html* in a browser will lead to CORS errors when trying to import file types other than *.css* or *.html*. This guide walks you through installing and using a node.js web server.

First you have to install the node.js runtime: [Download Node.js (nodejs.dev)](https://nodejs.dev/en/download/)

After that there is only left to install the *http-server* package via the node package manager *npm*. I recommend installing the *http-server* globally (-g) because it will likely be used in many different projects:

```bash
npm install -g http-server
```

In order to start serving files you can start the server from the directory that contains the *index.html* to be served:

```bash
http-server <optional:relative or absolute directory path> --port 8070 --cors -c-1 -d false
```

Details on using this web server can be found on its npm page: [http-server - npm (npmjs.com)](https://www.npmjs.com/package/http-server)



## Using the docker containers

According to your operating system the installation of docker will vary so this guide assumes that you have the docker runtime installed [Get Docker | Docker Docs](https://docs.docker.com/get-docker/). Within the directory where the *compose.yaml* file is located, the following commands will get you started on using the containers.

```bash
# Starting the containers in the composition
docker compose up -d

# Listing all container IDs
docker ps -a

# Accessing a containers terminal
docker attach <container ID>

# Starting only one container
docker compose up -d <container_name like emscripten or node-webServer>

# Stopping the container instances
docker compose stop

# Starting the container instances
docker compose start

# Deleting the container instances
docker compose down
```

To start the two containers of this project, you have to execute the command `docker compose up -d` in the path where this repository is stored on your local machine, i.e. where the `compose.yaml` file is located. This will download and setup the containers, if not already done, and run them afterwards. The two localhost ports `7071` and `7072` of the Node.js web servers in the container are forwarded to the same localhost ports on your host machine. 

If you only want to use the emscripten compiler without having to install it on the host machine, you can copy the compose.yaml file into any directory and run the `docker compose up -d emscripten` command in it.  After running `docker attach <containerID>` you will be accessing the Alpine linux terminal and will be able to work within that directory almost like the emscripten toolchain was installed on the host machine.