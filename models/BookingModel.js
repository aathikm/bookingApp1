const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
    placeId: {type: mongoose.Schema.ObjectId, required: true, ref:"place"},
    user: {type: mongoose.Schema.ObjectId, required: true},
    name: {type:String, required: true},
    phoneNumber: {type: Number, required: true},
    checkInTime: {type:Date, required: true},
    checkOutTime: {type:Date, required: true},
    memberCount: {type: Number, required: true},
    price: {type: Number, required: true}
})

const BookingModel = mongoose.model("booking", BookingSchema)

module.exports = BookingModel;