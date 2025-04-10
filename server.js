const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const authJwtController = require('./auth_jwt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const User = require('./Users');
const Event = require('./Events');
const Todo = require('./Todos');


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
            
        }
    });

