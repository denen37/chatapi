require('dotenv').config();
const BASE_URL = process.env.BASE_URL;
const { Server } = require('socket.io');
const logger = require('./logger');
const { authenticateParamToken } = require('./middleware/authMiddleware');
const { default: axios } = require('axios');

module.exports = (httpServer, URL) => {
    const io = new Server(httpServer, {
        cors: {
            origin: '*',
            credentials: true,
        },
    });


    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;

        console.log('Session id', socket.handshake.auth.sessionId);

        try {
            const response = await authenticateParamToken(token);

            socket.user = response.payload;
        } catch (error) {
            logger.error(error.message);

            return next(new Error('Authentication error'));
        }

        next();
    });


    // });

    io.on('connection', async (socket) => {
        console.log('a user connected');
        logger.info('a user connected');

        socket.broadcast.emit("user-connected", socket.user);

        let response;
        let previousChats;

        let data = { ...socket.user, online: true };
        try {
            response = await axios.put(`${BASE_URL}/chats/online_status`, data);
            console.log('response', response.data);

            previousChats = await axios.get(`${BASE_URL}/chats/${socket.user.role}/partners/${socket.user.id}`);
            previousChats = previousChats.data;
            logger.info(previousChats);
        } catch (error) {
            console.log('error', error.message);
            logger.error(error.message);
        }

        previousChats.forEach(chat => {
            let chatroom = `${chat.userId}${chat.providerId}-chat_${chat.id}`
            socket.join(chatroom);
        })

        socket.emit("chat-peers", previousChats);

        console.log(socket.rooms);
        for (const room of socket.rooms) {
            if (room !== socket.id) { // Skip the socket's own ID room
                socket.to(room).emit("user-connected", socket.user);
            }
        }

        socket.on("get-contacts", async (data) => {
            allChats = await axios.get(`${BASE_URL}/chats/${socket.user.role}/partners`);
            allChats = allChats.data;
            socket.emit("get-contacts-success", allChats);
        })


        socket.on('send-msg', async (data) => {
            console.log('Message sent');
            const roomKey = `${data.role === 'user' ? data.from : data.to}${data.role === 'user' ? data.to : data.from}`

            const chatrooms = io.of("/").adapter.rooms;
            let keys = [...chatrooms.keys()];
            let room = keys.find(key => key.split("-")[0] === roomKey);

            io.to(room).emit("msg-recieve", data);

            try {
                const response = await axios.post(`${BASE_URL}/chats`, data);

                let status = response.data;

                socket.emit('backup-msg-status', { ...status });
            } catch (error) {

            }
        })

        socket.on('fetch-peers', async (data) => {
            previousChats = await axios.get(`${BASE_URL}/chats/${socket.user.role}/partners/${socket.user.id}`);
            previousChats = previousChats.data;

            socket.emit('chat-peers', previousChats);
        });

        socket.on('private-msg', async (data) => {
            let conversation;

            try {
                conversation = await axios.get(`${BASE_URL}/chats/messages?userId=${data.userId}&providerId=${data.providerId}`)
                conversation = conversation.data;
            } catch (error) {
                console.log('error', error.message);
                logger.error(error.messages);
            }

            if (!conversation) {
                try {
                    //create a conversation
                    let response = await axios.post(`${BASE_URL}/chats/conversations`, {
                        userId: data.userId,
                        providerId: data.providerId
                    })

                    let conversation = response.data;

                    let chatroom = `${conversation.userId}${conversation.providerId}-chat_${conversation.id}`

                    socket.join(chatroom);

                    return;
                } catch (error) {
                    console.log(error);
                }
            }

            socket.emit('msg-loaded', conversation.messages);
        })

        //     socket.on("upload", (file, callback) => {
        //         console.log(file); // <Buffer 25 50 44 ...>

        //         const buffer = new Buffer.from(file);

        //         const blob = new Blob(buffer)

        //         // console.log(blob.type);
        //         // console.log(blob.size);

        //         // save the content to the disk, for example
        //         writeFile("./public/data", file, (err) => {
        //             callback({ message: err ? "failure" : "success" });
        //         });
        //     });

        socket.on('disconnecting', async () => {
            for (const room of socket.rooms) {
                if (room !== socket.id) { // Skip the socket's own ID room
                    socket.to(room).emit("user-disconnected", socket.user);
                }
            }
        })

        socket.on('disconnect', async () => {
            let data = { ...socket.user, online: false };

            const response = await axios.put(`${BASE_URL}/chats/online_status`, data);

            console.log('A user disconnected');
        })
    });

    return io;
};

