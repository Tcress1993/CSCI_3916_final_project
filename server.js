const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const authJwtController = require('./auth_jwt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const User = require('./User');
const Event = require('./Events');
const Todo = require('./Todos');
const mongoose = require('mongoose');
const connectDB = require('./connectDB');
require('dotenv').config();

connectDB();
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

const router = express.Router();

//signup for the calander app
router.post('/signup', async(req, res) => {
    //makes sure that the user put both username and password
    if (!req.body.username || !req.body.password){
        return res.status(400).json({success: false, msg: 'Please include username and password.'});
    }

    //creates a new user
    try{
        const user = new User({
            name: req.body.name,
            username: req.body.username,
            password: req.body.password
        });
        await user.save();
        res.status(201).json({success: true, msg: 'Successful created new user.'});
    }catch(error){
        if (error.code === 11000){
            return res.status(400).json({success: false, msg: 'Username already exists.'});
        }else{
            return res.status(500).json({success: false, msg: 'Server error.'});
        }
    }
});

//login for the calander app
router.post('/signin', async(req, res) => {
    console.log("signin called");
    try{
        const user = await User.findOne({username: req.body.username}).select('name username password');
        if (!user){
            return res.status(401).send({success: false, msg: 'Authentication failed. User not found.'});
        }
        const isMatch = await user.comparePassword(req.body.password);

        if (isMatch){
            const userToken = {id:user._id, username: user.username};
            const token = jwt.sign(userToken, process.env.SECRET_KEY, {expiresIn: '1h'});
            res.json({success: true, token: 'JWT ' + token});
        }
        else{
            res.status(401).send({success: false, msg: 'Authentication failed. Wrong password.'});
        }

    }catch(error){
        console.error(error);
        res.status(500).json({success: false, msg: 'Server error.'});
    }
});

router.route('/events')
    .post(authJwtController.isAuthenticated, async(req, res) => {
        try{
           const {title, date, time, repeat, notes, location} = req.body;
           if (!title || !date || !time){
               return res.status(400).json({success: false, msg: 'Please include title, date and time.'});
           }
            const event = new Event({title, date, time, repeat, notes, location});
            await event.save();
            res.status(201).json({success: true, msg: 'Event created successfully.'});

        }catch(error){
            console.error(error);
            res.status(500).json({success: false, msg: 'Server error.'});
        }
    })
    .get(authJwtController.isAuthenticated, async(req, res) => {
        try{
            const {date} = req.query;
            if (!date){
                return res.status(400).json({success: false, msg: 'Please include date.'});
            } 
            const events = await Event.find({date}); // get every event for the given date
            res.status(200).json({success: true, events});
        }catch(error){
            res.status(500).json({success: false, msg: 'Server error.'});
        }
    })
    .put(authJwtController.isAuthenticated, async(req, res) => {
        try{
            const {_id,...update} = req.body;
            if (!_id){
                res.status(400).json({success: false, msg: 'Please include id.'});
            }
            const updateEvent = await Event.findByIdAndUpdate(_id, update);
            res.status(200).json({success: true, msg: "Event updated"})
            
        }catch(err){
            res.status(500).json({success: false, msg: "Put not supported"})
        }
    })
    .delete(authJwtController.isAuthenticated, async(req, res) => {
        try{
            const {_id} = req.body;
            if (!_id){
                res.status(400).json({success: false, msg: 'Please include id.'});
            }
            const deleteEvent = await Event.findByIdAndDelete(_id);
            res.status(200).json({success: true, msg: "Event deleted"})
        }catch(err){
            res.status(500).json({success: false, msg: "Delete not supported"})
        }
    });

router.route('/todos')
    .post(authJwtController.isAuthenticated, async(req, res) => {
        try{
            const {title} = req.body;
            if (!title){
                return res.status(400).json({success: false, msg: 'Please include title.'});
            }
            const todo = new Todo({title});
            await todo.save();
        }catch(err){
            res.status(500).json({success: false, msg: "Post not supported"})
        }
    })
    .get(authJwtController.isAuthenticated, async(req, res) => {
        try{
            const todos = await Todo.find({complete: false});
            res.status(200).json({success: true, todos});
        }catch(err){
            res.status(500).json({success: false, msg: "Get not supported"})
        }
    })
    .delete(authJwtController.isAuthenticated, async(req, res) => {
        try{
            const {_id} = req.body;
            if (_id){
                res.status(400).json({success: false, msg: 'Please include id.'});
            }
            const deleteTodo = await Todo.findByIdAndDelete(_id);
            res.status(200).json({success: true, msg: "Todo deleted"})
        }catch(err){
            res.status(500).json({success: false, msg: "Delete not supported"}) 
        }
    });

router.route('/todos/:id')
    .put(authJwtController.isAuthenticated, async(req, res) => {
        try{
            const id = req.params.id;
            if (_id){
                res.status(400).json({success: false, msg: 'Please include id.'});
            }
            const updateTodo = await Todo.findByIdAndUpdate(_id, {complete: true, completedAt: Date.now()});
            res.status(200).json({success: true, msg: "Todo completed"})
        }catch(err){
            res.status(500).json({success: false, msg: "Put not supported"})
        }
    });

app.use('/', router);
app.listen(process.env.PORT || 8080, () => {
    console.log('Server is running on port 8080');
});
module.exports = router;
