import express from "express";
import bodyParser from "body-parser";
import viewEngine from "./config/viewEngine"
import initWebRouters from './route/web'
require('dotenv').config();

let app = express();
let port = process.env.PORT || 6996;
let hostname = process.env.HOSTNAME

//config app
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))

viewEngine(app);
initWebRouters(app);


app.listen(port, () => {
    console.log("Backend NodeJs is running on the port: " + port)
})