require("dotenv").config();

const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB connected"))
.catch(err=>console.log(err));

const userSchema = new mongoose.Schema({
nrp:String,
name:String,
password:String,
role:String
});

module.exports = mongoose.model("User",userSchema);