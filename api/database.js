import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {

if (isConnected) return;

await mongoose.connect(process.env.MONGO_URI);

isConnected = true;

}

const userSchema = new mongoose.Schema({
nrp:String,
name:String,
password:String,
role:String
});

export const User = mongoose.models.User || mongoose.model("User", userSchema);