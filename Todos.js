var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// ToDo schema
var ToDoSchema = new Schema({
    title: {type: String, required: true, index: true},
    complete: {type: Boolean, default: false},
    createdAt: {type: Date, default: Date.now},
    completedAt: {type: Date, default: null}
});

// return the model
module.exports = mongoose.model('ToDo', ToDoSchema);