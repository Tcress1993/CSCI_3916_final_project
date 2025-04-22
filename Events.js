var mongoose = require('mongoose');
var Schema = mongoose.Schema;





//  Event schema
var EventSchema = new Schema({
    title: {type: String, required: true, index: true},
    date: {type: Date, required: true},
    time: {type: String, required: true},
    month: {type: Number, required: true},
    year: {type: Number, required: true},
    repeat: {type: String, enum: ['never', 'daily', 'weekly', 'monthly', 'yearly'], default: 'never'},
    notes: {type: String},
    location: {type: String},

});


// return the model
module.exports = mongoose.model('Event', EventSchema);