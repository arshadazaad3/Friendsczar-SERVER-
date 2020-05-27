//necessary dependancies 

/*Express is used to build web applications and API's, it Will listen for any input/connection from client */
const express = require('express');

//Socket IO is used for data Transfer
const socketio = require('socket.io');

const http = require('http');

const app = express();

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');

//for deployment we need process.env.port
const PORT = process.env.PORT || 5000

//instance of Router 
const router = require('./router')

const cors = require('cors');


//Using Router in App
app.use(router)
//cors is a package connect/express middleware  (Cross Origin Resource Sharing)
app.use(cors());

const server = http.createServer(app);

//instance of Socket IO to make SOCKET IO SERVER Running
const io = socketio(server);

io.on('connect', (socket) => {
    // console.log('We have a New Connection!');
    socket.on('join', ({ name, room }, callback) => {
        //calling the addUser method and passing parameter values                                                                                                                                                                                                               
        const { error, user } = addUser({ id: socket.id, name, room });
        //if there are errors while adding user this statement will automatically execute
        if (error) return callback(error);
        socket.join(user.room);

        socket.emit('message', { user: 'admin', text: user.name + " Welcome to The Chat " + user.room })
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: user.name + " has joined" })

        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) })
        callback();
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);

        io.to(user.room).emit('message', { user: user.name, text: message })
        io.to(user.room).emit('roomData', { room: user.room, text: message })

        callback();

    });



    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', { user: 'admin', text: user.name + " Has Left" });
            io.to(user.room).emit('roomData', {room:user.room, users:getUsersInRoom(user.room)});
        }
        // console.log('User' + u + 'Left!')
    })
})



//Start Server
server.listen(PORT, () => console.log('Server is Running on port: ' + PORT));


