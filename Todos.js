var mongoose = require('mongoose');
var Schema = mongoose.Schema;
require('dotenv').config();
//connect to the database
async function connectDB() {
    try{
        await mongoose.connect(process.env.DB, {useNewUrlParser: true, useUnifiedTopology: true});
        console.log("connected to database: todo");
    }catch(err){
        console.log("could not connect to database: todo");
    }

}

connectDB();

// ToDo schema
var ToDoSchema = new Schema({
    title: {type: String, required: true, index: true},
    complete: {type: Boolean, default: false},
    createdAt: {type: Date, default: Date.now},
    completedAt: {type: Date, default: null}
});

// return the model
module.exports = mongoose.model('ToDo', ToDoSchema);