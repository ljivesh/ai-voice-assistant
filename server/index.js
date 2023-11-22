

import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";

import {fileURLToPath} from 'url';
import { dirname, resolve } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


import serverConfig from './config/serverConfig.js';
import authRouter from './routes/authRoutes.js';
import speechRouter from './routes/speechRoutes.js';

import { connectToDb } from "./db/db.js";
connectToDb();

const app = express();


// let whitelist = ['http://localhost:5173', 'http://localhost:5500'];


app.use(cors({
    origin: true,
    credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(resolve(__dirname, '../dist')));

app.use('/user', authRouter);
app.use('/speech', speechRouter);

app.get('/', (req, res)=> {
    res.sendFile(resolve(__dirname, '../dist/index.html'));
    // res.send('Hello World');
});

app.get('/test', (req, res)=> {
    res.json({message: 'Hello World'});
});

const {port} = serverConfig;
app.listen(port, ()=>console.log(`Server started at port: ${port}`));