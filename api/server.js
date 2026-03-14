require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const User = require("../backend/database");

const app = express();

app.use(cors());
app.use(express.json());

/* =====================
   LOGIN
===================== */

app.post("/login", async (req,res)=>{

try{

const {nrp,password} = req.body;

const user = await User.findOne({nrp:nrp});

if(!user){
return res.status(401).json({message:"NRP tidak ditemukan"});
}

if(password.trim() !== String(user.password).trim()){
return res.status(401).json({message:"Password salah"});
}

const token = jwt.sign(
{nrp:user.nrp,role:user.role},
process.env.JWT_SECRET,
{expiresIn:"2h"}
);

res.json({
token:token,
name:user.name,
role:user.role,
nrp:user.nrp
});

}catch(err){

res.status(500).json({message:"Server error"});

}

});

/* =====================
   VERIFY TOKEN
===================== */

app.get("/verify",(req,res)=>{

const authHeader = req.headers["authorization"];

if(!authHeader){
return res.status(401).json({message:"Token tidak ada"});
}

const token = authHeader.split(" ")[1];

jwt.verify(token,process.env.JWT_SECRET,(err,user)=>{

if(err){
return res.status(403).json({message:"Token tidak valid"});
}

res.json({
message:"Token valid",
user:user
});

});

});

module.exports = app;