import connectDB from "./db/index.js";
import dotenv from "dotenv"
import express from "express"
import { error } from "node:console";
import app from "./app.js"




dotenv.config({
    path:'./env'
}
)


connectDB().then(() => {

    app.listen(process.env.PORT || 3000 , () => {
        console.log(`app listening on port ${process.env.PORT} and http://localhost:${process.env.PORT}`)
    })


})
.catch((error) => {
    console.log("MONGO db connection failed !!! ", error);

})









