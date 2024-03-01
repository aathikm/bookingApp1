const mongoose = require("mongoose")

const {Schema} = mongoose

const placeSchema = new mongoose.Schema({
    owner: {type: mongoose.Schema.ObjectId, ref:'User'},
    title: String,
    address: String,
    photos: [String],
    description: String,
    perks: [String],
    extraInfo: String,
    checkInTime: String,
    checkOutTime: String,
    maxMembers: Number,
    price: Number
})

const placeModel = mongoose.model("place", placeSchema)

module.exports =  placeModel;