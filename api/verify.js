import jwt from "jsonwebtoken";

export default function handler(req,res){

const authHeader = req.headers.authorization;

if(!authHeader){
return res.status(401).json({message:"Token tidak ada"});
}

const token = authHeader.split(" ")[1];

try{

const decoded = jwt.verify(token,process.env.JWT_SECRET);

res.json({
message:"Token valid",
user:decoded
});

}catch(err){

res.status(403).json({message:"Token tidak valid"});

}

}