var mongoose = require('mongoose');
require('dotenv').config();

async function connectDB() {
    try{
        await mongoose.connect(process.env.DB, {useNewUrlParser: true, useUnifiedTopology: true});
        console.log("connected to database");
    }catch(err){
        console.log("could not connect to database");
        console.log(err);
    }
}
module.exports = connectDB;