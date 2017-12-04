var express = require('express'),
    socket = require('socket.io'),
    ejs = require('ejs'),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    LocalStrategy = require('passport-local'),
    User = require('./models/user'),
    Chat = require('./models/chat'),
    Comment = require('./models/comment'),
    app = express(),
    port = process.env.PORT || 3500;

mongoose.connect('mongodb://192.168.1.100/chat', { useMongoClient: true });
mongoose.Promise = global.Promise;
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

//PASSPORT CONFIG 
app.use(require('express-session')({
    secret: 'hare krishna hare rama',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req, res, next) => {
    res.locals.currentUser = req.user;

    next();
});



//root route
app.get('/', (req, res) => {
    res.render('landing');
});
//sign in routes
app.get('/signin', (req, res) => {
    res.render('signin');
});

app.post('/signin', (req, res) => {
    var newUser = new User({ username: req.body.username });
    // console.log('new user: ' + newUser);
    User.register(newUser, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            return res.render('signin');
        } else {
            passport.authenticate('local')(req, res, () => {
                res.redirect('/chatrooms');
            });
        };
    });
});

//login routes
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/chatrooms',
    failureRedirect: '/login'
}), (req, res) => {})

//chatrooom - show all cahatrooms
app.get('/chatrooms', isLoggedIn, (req, res) => {
    //find all chatrooms
    Chat.find({}, (err, allChatrooms) => {
        if (err) {
            console.log(err)
        } else {
            // console.log("***" + allChatrooms);
            res.render('chatrooms', { chats: allChatrooms });
        };
    });
});

app.post('/chatrooms', isLoggedIn, (req, res) => {
    //get data from form and add to chat db
    var name = req.body.name;
    var author = {
        id: req.user._id,
        user: req.user.username
    };
    Chat.create({ name: name, author: author }, (err, newChatroom) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/chatrooms/' + newChatroom._id);
        };
    });
});
//create new chatroom
app.get('/chatrooms/newChatroom', isLoggedIn, (req, res) => {
    res.render('newChatroom');
});

//show choosed chatroom
app.get('/chatrooms/:id', isLoggedIn, (req, res) => {
    //find chatroom by provided id
    Chat.findById(req.params.id).populate('comments').exec((err, chatroom) => {
        if (err) {
            console.log('request params id: ' + req.params.id);
            console.log(`chatroom show err: ${err}`);
        } else {
            // console.log('chatroom: ', chatroom);
            res.render('show', { chatroom: chatroom });
        };
    });
});

//create comment
app.post('/chatrooms/:id/comments', isLoggedIn, (req, res) => {
    Chat.findById(req.params.id, (err, chatForComm) => {
        if (err) {
            console.log(err);
            console.log(`chatForComm: ${chatForComm}`);
            res.redirect('/chatrooms/:id');
        } else {
            Comment.create(req.body.comment, (err, commForChat) => {
                if (err) {
                    console.log(`creating comment section: ${err}`);
                } else {

                    //add username and id to comment
                    // console.log('req.user ---- ' + req.user);
                    commForChat.author.id = req.user._id;
                    commForChat.author.username = req.user.username;
                    // console.log('username and id:' + req.user._id + req.user.username);
                    //save comment
                    commForChat.save();
                    chatForComm.comments.push(commForChat);
                    chatForComm.save();
                    // console.log('commForChat after adding username' + commForChat)
                    res.redirect('/chatrooms/' + req.params.id);
                };
            });
        };
    });
});




//logout
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/')
})

//midleware
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
};

var server = app.listen(port, (err, log) => {
    if (err) {
        console.log(err);
    } else {
        console.log(`server on port: ${port}`);
    }
});

//socket setup
var io = socket(server);
io.on('connection', (socket) => {
    console.log('made connection' + new Date().toUTCString());

    //hande chat event
    socket.on('chat', (data) => {
        console.log('data.message: ' + data.message + ', ' + new Date().toUTCString());
        console.log('data from user: ' + data.userko);
        io.sockets.emit('chat', data);
    });
    //handle typing event
    socket.on('typing', (data) => {
        console.log('broadcast typing:' + data);
        socket.broadcast.emit('typing', data);

    });
});