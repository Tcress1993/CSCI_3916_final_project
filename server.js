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
    .get(authJwtController.isAuthenticated, async(req, res) => {
        //get all the events for a given day
        try{
            //get the event by date(single event)
            const {date, month, year} = req.query;
            
            if (date){
                //all the events for a given date
                const events = await Event.find({date: new Date(date)});
                if (!events){
                    return res.status(404).json({success: false, msg: 'No events found for this date.'});
                }
                res.status(200).json({success: true, events});
            }
            else if(month && year){
                //all the events for a given month and year
                const events = await Event.find({month: parseInt(month), year: parseInt(year)});
                if (!events){
                    return res.status(404).json({success: false, msg: 'No events found for this month and year.'});
                }
                res.status(200).json({success: true, events});
            }else{
                //catch if the date or the month and year is not included
                res.status(400).json({success: false, msg: 'Please include date or month and year.'});
            }
        }catch(error){
            res.status(500).json({success: false, msg: 'Server error.'});
        }
    })
    .post(authJwtController.isAuthenticated, async(req, res) => {
        //add a new event to the calander(title, date, time are required others are optional)
        try{
           const {title, date, time, repeat, notes, location} = req.body;
           if (!title || !date || !time){
               return res.status(400).json({success: false, msg: 'Please include title, date, and time.'});
           }
            const eventDate = new Date(date);
            const month = eventDate.getMonth() + 1; // Months are zero-based in JavaScript
            const year = eventDate.getFullYear();

            const event = new Event({title, date, time, month, year, repeat, notes, location});
            await event.save();
            res.status(201).json({success: true, msg: 'Event created successfully.'});

        }catch(error){
            console.error(error);
            res.status(500).json({success: false, msg: 'Server error.'});
        }
    })
    
    .put(authJwtController.isAuthenticated, async(req, res) => {
        //update multiple fields of an event
        //update the event with the given id and update it with the new values
        try{
            const {_id,title,date, time, repeat, notes, location } = req.body;
            if (!_id|| !title || !date || !time){
                res.status(400).json({success: false, msg: 'Please include id, title, date, and time.'});
            }
            const update = {title, date, time, repeat, notes, location};
            const updateEvent = await Event.findByIdAndUpdate(_id, update, {new: true});
            if (!updateEvent){
                return res.status(404).json({success: false, msg: 'Event not found.'});
            }
            res.status(200).json({success: true, msg: "Event updated"})
            
        }catch(err){
            res.status(500).json({success: false, msg: "Put not supported"})
        }
    })
    
    .patch(authJwtController.isAuthenticated, async(req, res) => {
        //partially update an event with the given id and the new values
        try{
            const {_id, ...update} = req.body;
            if (!_id){
                res.status(400).json({success: false, msg: 'Please include id.'});
            }
            const updateEvent = await Event.findByIdAndUpdate(_id, update);
            if (!updateEvent){
                return res.status(404).json({success: false, msg: 'Event not found.'});
            }
            res.status(200).json({success: true, msg: "Event updated"})
        }catch(err){
            res.status(500).json({success: false, msg: "Patch not supported"});
        }
    })

router.route('/events/:id')
    .get(authJwtController.isAuthenticated, async(req, res) => {
        try{
            const id = req.params.id;
            if(!id){
                res.status(400).json({success: false, msg: 'Please include id.'});
            }
            const event = await Event.findById(id);
            if(!event){
                return res.status(404).json({success: false, msg: 'Event not found.'});
            }
            res.status(200).json({success: true, event});
        }catch(err){
            res.status(500).json({success: false, msg: "Get not supported"});
            console.error(err); // log the error to the console
        }
    })
    .delete(authJwtController.isAuthenticated, async(req, res) => {
        //delete an event with the given id
        try{
            const id = req.params.id;
            if (id){
                res.status(400).json({success: false, msg: 'Please include id.'});
            }
            const deleteEvent = await Event.findByIdAndDelete(id);
            res.status(200).json({success: true, msg: "Event deleted"})
        }catch(err){
            res.status(500).json({success: false, msg: "Delete not supported"})
        }
    })
    .patch(authJwtController.isAuthenticated, async(req, res) => {
        try{
        const {_id} = req.params.id;
        const {...update}= req.body;
        if (!_id){
            res.status(400).json({success: false, msg: 'Please include id.'})
        }
        const updatedEvent = await Event.findByIdAndUpdate(_id, update);
        res.status(200).json({sucess: true, msg: 'Event Updated'})
        }catch(err){
            res.status(500).json({sucess: false, msg: 'Patch not supported'});
        } 
    })
    .put(authJwtController.isAuthenticated, async(req, res) => {
        //update the event with the given id and update it with the new values
        try{
            const {_id,title,date, time, repeat, notes, location } = req.body;
            if (!_id|| !title || !date || !time){
                res.status(400).json({success: false, msg: 'Please include id, title, date, and time.'});
            }
            const update = {title, date, time, repeat, notes, location};
            const updateEvent = await Event.findByIdAndUpdate(_id, update, {new: true});
            if (!updateEvent){
                return res.status(404).json({success: false, msg: 'Event not found.'});
            }
            res.status(200).json({success: true, msg: "Event updated"})
            
        }catch(err){
            res.status(500).json({success: false, msg: "Put not supported"})
        }
    });

router.route('/todos')
    .get(authJwtController.isAuthenticated, async(req, res) => {
        //get all the uncompleted todos
        try{
            const todos = await Todo.find({complete: false});
            res.status(200).json({success: true, todos});
        }catch(err){
            res.status(500).json({success: false, msg: "Get not supported"});
            console.error(err);
        }
    })
    .post(authJwtController.isAuthenticated, async(req, res) => {
        //add a new todo to the list(title is required)
        //all other fields are for report perposes only
        try{
            const {title} = req.body;
            if (!title){
                return res.status(400).json({success: false, msg: 'Please include title.'});
            }
            const todo = new Todo({title, createdat: Date.now()});
            await todo.save();
        }catch(err){
            res.status(500).json({success: false, msg: "Post not supported"});
            console.error(err);
        }
    })
    .put(authJwtController.isAuthenticated, async(req, res) => {
        //update 
        try{
            const{_id,title, complete, createdAt, completeAt} = req.body;
            if(!_id|| !title){
                res.status(400).json({success: false, msg: 'Please include id and title.'});
            }
            const update = {title, complete, createdAt, completeAt};
            const updateTodo = await Todo.findByIdAndUpdate(_id, update,{new: true});
            res.status(200).json({success: true, msg: "Todo updated"})
        }catch(err){
            res.status(500).json({success: false, msg: "Put not supported"});
            console.error(err);
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
            res.status(500).json({success: false, msg: "Delete not supported"});
            console.error(err); 
        }
    })
    .patch(authJwtController.isAuthenticated, async(req, res) => {
        try{
            const{_id, ...update} = req.body;
            if(!_id){
                res.status(400).json({success: false, msg: 'Please include id.'});
            }
            const updateTodo = await Todo.findByIdAndUpdate(_id, update);
            if (!updateTodo){
                return res.status(404).json({success: false, msg: 'Todo not found.'});
            }
            res.status(200).json({success: true, msg: "Todo updated"})
        }catch(err){
            res.status(500).json({success: false, msg: "Patch not supported"});
            console.error(err);
        }
    })

router.route('/todos/:id')
    .put(authJwtController.isAuthenticated, async(req, res) => {
        //complete a todo item with the given id
        //The completed date is set to the current date and time
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
