

import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import serverConfig from './config/serverConfig.js';
import authRouter from './routes/authRoutes.js';
import speechRouter from './routes/speechRoutes.js';

import { connectToDb } from "./db/db.js";
connectToDb();

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());

app.use('/api/user', authRouter);
app.use('/api/speech', speechRouter);

const {port} = serverConfig;
app.listen(port, ()=>console.log(`Server started at port: ${port}`));