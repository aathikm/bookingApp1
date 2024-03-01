const mongoose = require("mongoose")

const {Schema} = mongoose
// Schema created by mongoose library alone, not mongoose.schma

const userSchema = new Schema({
    name: String,
    email: {type: String, 
            unique: true},
    password: String

});

const userModel = mongoose.model('User', userSchema);

module.exports = userModel