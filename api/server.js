require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./database");

const db = require("./database");

const app = express();

app.use(cors());
app.use(express.json());

const SECRET = process.env.JWT_SECRET;

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

app.post("/login", async (req,res)=>{

const {nrp,password} = req.body;

try{

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

app.post("/verify-access",(req,res)=>{

const {kode} = req.body;

/* kode rahasia hanya di backend */
const kodeBendahara = "BENDAHARA2025";
const kodePJ = [
"PJ_ALPRO",
"PJ_PEMROGRAMAN",
"PJ_ELEKTRONIKA"
];

if(kode === kodeBendahara){
return res.json({role:"bendahara"});
}

if(kodePJ.includes(kode)){
return res.json({role:"pj"});
}

res.status(401).json({message:"Kode tidak valid"});

});