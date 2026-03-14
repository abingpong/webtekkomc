import jwt from "jsonwebtoken";
import {connectDB,User} from "./database";

export default async function handler(req,res){

if(req.method !== "POST"){
return res.status(405).json({message:"Method not allowed"});
}

await connectDB();

const {nrp,password} = req.body;

const user = await User.findOne({nrp:nrp});

if(!user){
return res.status(401).json({message:"NRP tidak ditemukan"});
}

if(password !== user.password){
return res.status(401).json({message:"Password salah"});
}

const token = jwt.sign(
{nrp:user.nrp,role:user.role},
process.env.JWT_SECRET,
{expiresIn:"2h"}
);

res.json({
token,
name:user.name,
role:user.role,
nrp:user.nrp
});

}