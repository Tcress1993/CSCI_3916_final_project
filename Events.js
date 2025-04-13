var mongoose = require('mongoose');
var Schema = mongoose.Schema;

require('dotenv').config();
//connect to the database
async function connectDB() {
    try{
        await mongoose.connect(process.env.DB, {useNewUrlParser: true, useUnifiedTopology: true});
        console.log("connected to database: event");
    }catch(err){
        console.log("could not connect to database: events");
    }

}

connectDB();


//  Event schema
var EventSchema = new Schema({
    title: {type: String, required: true, index: true},
    date: {type: Date, required: true},
    time: {type: String, required: true},
    repeat: {type: String, enum: ['never', 'daily', 'weekly', 'monthly', 'yearly'], default: 'never'},
    notes: {type: String},
    location: {type: String},

});

// return the model
module.exports = mongoose.model('Event', EventSchema);