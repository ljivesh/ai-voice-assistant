import { Router } from "express";
import { verifyToken } from "../modules/jwtauth.js";
import axios from "axios";
import OpenAI from "openai";
import speechConfig from "../config/speechConfig.js";
import openaiConfig from "../config/openaiConfig.js";
import ResponseQueue from "../models/ResponseQueue.js";
const { speechKey, speechRegion } = speechConfig;
const {apiKey} = openaiConfig;


const openai = new OpenAI({apiKey: apiKey});

const conversations = [];

const router = Router();

router.get('/get-speech-token',verifyToken, async (req, res)=> {
    if (speechKey === 'paste-your-speech-key-here' || speechRegion === 'paste-your-speech-region-here') {
        res.status(400).send('You forgot to add your speech key or region to the .env file.');
    } else {
        const headers = { 
            headers: {
                'Ocp-Apim-Subscription-Key': speechKey,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        try {
            const tokenResponse = await axios.post(`https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, null, headers);
            res.send({ token: tokenResponse.data, region: speechRegion });
        } catch (err) {
            res.status(401).send('There was an error authorizing your speech key.');
        }
    }
});


router.post('/user-content',verifyToken, async (req, res)=> {
    try {

        const {userId} = req.user;
    
        const content = req.body.content;
        console.log(content);  
    
        const userConverastion = conversations.find(user=>user.userId === userId);
        if(userConverastion) {
            userConverastion.conversation.push({role: 'user', content: content});
    
        } else {
            conversations.push({userId: userId, conversation: [{role: 'user', content: content}]});
        }
        

        const user = conversations.find(user=>user.userId === userId);
        console.log(user.conversation);
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: user.conversation,
            stream: true,
          });
        


          let bufferString = ""; //buffer to hold the chunks of data from openai
        const responseQueue = await ResponseQueue.getQueueByUserId(userId);

        for await (const chunk of completion) {
            console.log(chunk.choices[0].delta.content);
            if(chunk.choices[0].delta.content === null) {
                await responseQueue.pushToConversationQueue(bufferString);
                res.json(responseQueue.conversation);
                break;
            }
            
            if(chunk.choices[0].delta.content && chunk.choices[0].delta.content.includes('.')) {
                await responseQueue.pushToConversationQueue(bufferString+'.');
                bufferString = "";
                continue;
            }
            // console.log(chunk.choices[0].delta.content);
            bufferString = bufferString.concat(chunk.choices[0].delta.content);
            // console.log(bufferString);
        }

        res.json(responseQueue.conversation);

        // responseArray.push(bufferString);
        // console.log(responseArray);

        // res.json(responseArray);
        


        // res.json(conversations);
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }

});


router.get('/fetch-queue', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId; 
        const responseQueue = await ResponseQueue.getQueueByUserId(userId);
        res.json(responseQueue.conversation);
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
});

export default router;