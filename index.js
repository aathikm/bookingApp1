var express = require("express")
const cors = require("cors")
const { default: mongoose } = require("mongoose")
const bcryptjs = require("bcryptjs")
const jwt = require("jsonwebtoken")
const dotenv = require("dotenv")
const morgan = require("morgan")
const multer = require("multer")
const fs = require("fs")
const imageDownloader = require("image-downloader")
// const { connectDb, getDb } = require("./db/mongo_db.js")

dotenv.config()

const userModel = require("./models/userModel.js")
const placeModel = require("./models/placeModel.js")
const bookingModel = require("./models/BookingModel.js")
var cookieParser = require("cookie-parser")
var bodyParser = require("body-parser")
// const { default: BookingModel } = require("./models/BookingModel.js")
// require("body-parser")

const app = express()

// hashing the password
// genSalt as a string, genSaltSync as object, for hashing we want object so use genSaltSync
const secret = bcryptjs.genSaltSync(10);
// console.log(secret)

// WebToekn initialize for the entire application
jwt_secret = "fbcf2uiy4547epfb29834r9723r4b24"

// app.use(json()) this function is used for pass the value as json

app.use(cookieParser());
app.use(morgan('dev'));
// app.use(bodyParser);
app.use(express.json());
app.use('/uploads/', express.static(__dirname+"/uploads/"))
// app.use(cookieParser())

app.use(cors({
    credentials: true,
    origin: "http://localhost:3000",
    optionSuccessStatus:200
}))

const port = 4000;

mongoose.connect(process.env.MONGO_URL);
// COnnect db

app.get("/test", (req, res) => {
    res.status(200).send("ok")
})

//Avoid other routes
app.all("/not-found", (req, res) => {
    res.status(403).send("The pages is not found")
})

app.post('/register', async (req, res) => {
    const {name, email, password} = req.body;

    try{
        const userRegDoc = await userModel.create({
            name,
            email,
            password: bcryptjs.hashSync(password, secret)
        })
        res.status(200).json({"Registration sucessful":userRegDoc})
    }
    catch(e){
        res.status(404).json({"Fail": "Registration Failed"})
    }
})

app.post("/login", async(req, res) => {
    const {email, password} = req.body;

    try{
        // When ever you pass the argument in mongoDB put the curly brackets, then only it identifies thats is the object 
        const userDoc = await userModel.findOne({email})
        // console.log(userDoc)
        if(userDoc){
            const passCom = bcryptjs.compareSync(password, userDoc.password)
            if(passCom){
                jwt.sign({email:userDoc.email, id:userDoc._id, name:userDoc.name}, jwt_secret, {}, (err, result) => {
                    if(err) throw err;
                    res.cookie("token", result).json(userDoc)
                })
                
            }
            else{
                res.status(422).json("Password wrong check your password again")
            }
        }else{
            res.status(404).send("Check your credentials")
        }
    }
    catch(e) {
        res.status(404).json({"error": e})
    }
})

// get the user info and user name
app.get("/profile", (req, res) => {
    mongoose.connect(process.env.MONGO_URL)
    const {token} = req.cookies;

    // res.setHeader('Content-Type', 'text/plain')
    if(token){
        jwt.verify(token, jwt_secret, {}, async (err, userData) => {
            if (userData){
                const {name, email, _id} = await userModel.findById(userData.id)
                return res.status(200).json({name, email, _id})
            }                 
        })
    }
    else{
        res.json(null)
    }
})

// logout block
app.post("/logout", (req, res) => {
    res.cookie("token", "").json(true);
})

// photo-upload by link
app.post("/uploadByLink", async (req, res) => {
    const {link} = req.body;

    const newName = "photo" + Date.now() + ".jpg"
    const destination = __dirname + "/uploads/" + newName

    await imageDownloader.image({
        url: link,
        dest: destination
    })

    res.json(newName)
})

const photoMiddleWare = multer({dest:__dirname+"/uploads"})
app.post("/uploadBySys", photoMiddleWare.array("photos", 100) ,(req, res) => {
    const files = req.files;
    const uploadedFiles = []
    for (let i=0; i < files.length; i++){
        const {path, originalname} = files[i]
        const parts = originalname.split('.');
        const ext = parts[parts.length-1]
        const RawFileName = path.split("\\")
        const NewFileName = RawFileName[RawFileName.length - 1] +"." +ext
        const newFilePath = path+"."+ext
        fs.renameSync(path, newFilePath)
        uploadedFiles.push(NewFileName)
    }
    console.log(uploadedFiles)
    res.json(uploadedFiles)
});

//Places update
app.post("/uploadPlacesData", (req, res) => {

    const {token} = req.cookies;

    const {title, address, photos, 
        description, perks, extraInfo, 
        CheckInTime, checkOutTime, maxMembers, price} = req.body;
   
    // res.setHeader('Content-Type', 'text/plain')
    if(token){
        jwt.verify(token, jwt_secret, {}, async (err, userData) => {
            if (err) throw err;
            console.log("in post block",userData.id)
            if (userData){
                const placeDoc = await placeModel.create({
                    owner: userData.id,
                    title, address, photos, 
                    description, perks, extraInfo, 
                    CheckInTime, checkOutTime, maxMembers,
                    price
                })
                console.log(placeDoc)
                res.status(200).json(placeDoc) 
            }                           
        }) 
    }
    else res.status(404).send("The places is stored in db")
   // console.log(title, address)
})

// places
app.get("/places", (req, res) => {
    const {token} = req.cookies;

    if(token){
        jwt.verify(token, jwt_secret, {}, async (err, userData) => {
            if (err) throw err;
            console.log(userData)
            const {id} = userData;
            console.log(id)

            const data = await placeModel.find({owner:new mongoose.Types.ObjectId(id)})
            console.log(data)
            return res.status(200).json(data)                
        })
    }
})

// places findby id
app.get("/places/:id", async (req, res) => {
    const {id} = req.params;
    // console.log(id)

    const placeDataById = await placeModel.findById({_id: new mongoose.Types.ObjectId(id)})
    res.status(200).json(placeDataById)
})

// places update
app.put("/updatePlaceData", (req, res)=>{
    const {token} = req.cookies;

    const {id, title, address, addedPhotos, 
        description, perks, extraInfo, 
        checkInTime, checkOutTime, maxMembers, price} = req.body;
    
    if(token){
        jwt.verify(token, jwt_secret, {}, async (err, userData) => {
            const placeDoc = await placeModel.findById({_id: new mongoose.Types.ObjectId(id)})
            // console.log(Object.keys(placeDoc))            
            if (err) throw err;
            // console.log("user id++++++++", userData.id)
            // console.log(placeDoc._doc?.owner?.toString())
            if(userData.id === placeDoc._doc?.owner?.toString()){
                console.log("status####### passed" )
                placeDoc.set({
                    title, address, photos:addedPhotos, 
                    description, perks, extraInfo, 
                    checkInTime, checkOutTime, maxMembers, price
                })

                await placeDoc.save();
                res.status(200).json("ok")
            }
        })
    }
})

// Home page places
app.get("/allPlaces", async (req, res) => {
    const data = await placeModel.find()

    if(data){
        res.status(200).json(data)
    }
    else{
        res.status(404).json("The data is not found")
    }
})

//function to getting the user info
function getUserDataFromReq(req){

    return new Promise((resolve, reject) => {
        jwt.verify(req.cookies.token, jwt_secret, {}, async(err, userData) => {
            if (err) throw err;
            resolve(userData)
        })
    })
}

// Booking by the user
app.post("/bookingDetails", async (req, res) => {
    const {placeId, name, phoneNumber, checkInTime, 
    checkOutTime, memberCount, price} = req.body;
    
    const bookingData = {placeId, name, phoneNumber, checkInTime, 
        checkOutTime, memberCount, price}

    const userData = await getUserDataFromReq(req)
    const userId = userData.id
    // console.log("userData", userData)
    // console.log("user data id ", userData.id)
    
    if(bookingData)    {
        // console.log("Inside if condition", bookingData)
        const bookingDoc = await bookingModel.create({
            placeId:placeId, name, phoneNumber, checkInTime, 
            checkOutTime, memberCount, price, user:userId
        })

        res.send(bookingDoc)
    }
})

// get booking details
app.get("/bookings", async (req,res) =>{
    const userData = await getUserDataFromReq(req)
    console.log(userData)
    // console.log(userData)
    const bookingDetails = await bookingModel.find({user: userData.id}).populate('placeId')
    // console.log(bookingDetails)
    res.status(200).send(bookingDetails)
})

app.listen(port, () => {
    console.log(`Application runs at http://localhost:${port} `)
})