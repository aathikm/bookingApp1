const {MongoClient} = require("mongodb")
const dotenv = require("dotenv")
dotenv.config()

let dbconnection

module.exports = {
    connectDb: (cb) => {

        MongoClient.connect(process.env.MONGO_URL)
        .then((client) => {
            dbconnection = client.db

            return cb;
        })
        .catch((e) => {
            console.log(e)

            return cb;
        })
    },

    getDb: () => dbconnection
}