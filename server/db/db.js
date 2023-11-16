import mongoose from "mongoose";
import dbConfig from '../config/dbConfig.js';

const {mongoURI} = dbConfig;

export const connectToDb = async ()=> {
    try {
        
        await mongoose.connect(mongoURI, {
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        });
        console.log("Connected to mongodb");

    } catch(error) {
        console.error(error);
    }
};