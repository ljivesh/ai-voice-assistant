import { Router } from "express";
import { verifyToken } from "../modules/jwtauth.js";
import axios from "axios";
import OpenAI from "openai";
// import v4 from "uuid";
import speechConfig from "../config/speechConfig.js";
import openaiConfig from "../config/openaiConfig.js";
import ResponseQueue from "../models/ResponseQueue.js";
const { speechKey, speechRegion } = speechConfig;
import { decode } from "jsonwebtoken";
const { apiKey } = openaiConfig;

const openai = new OpenAI({ apiKey: apiKey });


const users = {};

const router = Router();

router.get('/sse', verifyToken, (req, res)=> {

  //get userId from token
  const userId = req.user.userId;

  //set headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  //keep track of the user
  users[userId] = {res, stopCondition: false};
  console.log(users);

  // res.write(`data: ${JSON.stringify({ userId })}\n\n`);




  req.on('close', () => {

    //delete user from users object on connection close
    console.log(`Deleted ${userId} from users)`);
    delete users[userId];
  });
  
});

router.post('/send-through-sse',verifyToken, (req, res)=> {

  const {userId } = req.user;

  const {message} = req.body;

  const {res: userRes} = users[userId];

  if(userRes) {

    userRes.write(`data: ${message}\n\n`);
    res.status(200).json({message: "Message sent"});
  }
  else {
    res.status(400).json({message: "User not found"});
  }



});

router.get("/get-speech-token", verifyToken, async (req, res) => {
  if (
    speechKey === "paste-your-speech-key-here" ||
    speechRegion === "paste-your-speech-region-here"
  ) {
    res
      .status(400)
      .send("You forgot to add your speech key or region to the .env file.");
  } else {
    const headers = {
      headers: {
        "Ocp-Apim-Subscription-Key": speechKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    };

    try {
      const tokenResponse = await axios.post(
        `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
        null,
        headers
      );
      const expirationTime = decode(tokenResponse.data).exp;
      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiration = expirationTime - currentTime;

      console.log(timeUntilExpiration);
      res.send({ token: tokenResponse.data, region: speechRegion });
    } catch (err) {
      res.status(401).send("There was an error authorizing your speech key.");
    }
  }
});


router.post("/post-conversation", verifyToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const conversation = req.body.conversation;

    const user = users[userId];

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // if (user.stopCondition) {
    //   res.json(null);
    //   return;
    // }


    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: conversation,
      stream: true,
    });

    const sendToClient = (string)=> {

      console.log("calling");
      user.res.write(`data: ${string}\n\n`);
    };


    let bufferString = "";

    // for await (const chunk of completion) {
    //   // if (user.stopCondition) {
    //   //   break;
    //   // }

    //   console.log(chunk.choices[0].delta.content);

    //   if (chunk.choices[0].delta.content === null) {
    //     // user.res.write(`data: ${bufferString}\n\n`);
    //      sendToClient(bufferString);
    //     res.json({ message: "Enqueued successfully" });
    //     break;
    //   }

    //   if (
    //     chunk.choices[0].delta.content &&
    //     chunk.choices[0].delta.content.includes(".")
    //   ) {
    //     // user.res.write(`data: ${bufferString}\n\n`);
    //     sendToClient(bufferString);
    //     bufferString = "";
    //     continue;
    //   }
      
    //   bufferString = bufferString.concat(chunk.choices[0].delta.content);
    // }

    for await (const chunk of completion) {
      if (user.stopCondition) {
        break;
      }
    
      try {
        const content = chunk.choices[0].delta.content;
        // console.log(content);
    
        if (content === undefined) {
          user.res.write(`data: ${bufferString}\n\n`);
          // res.json({ message: "Enqueued successfully" });
          break;
        }
    
        if (content && content.includes(".")) {
          user.res.write(`data: ${bufferString}\n\n`);
          bufferString = "";
          continue;
        }
    
        bufferString += content;
      } catch (error) {
        console.error('Error processing SSE chunk:', error);
        break;  // Break the loop on error
      }
    }
    
    
    // user.res.write(`data: Test Test Test\n\n`);
    res.json(null);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});


router.get("/fetch-conversation", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    // const responseQueue = await ResponseQueue.getQueueByUserId(userId);

    const user = conversations.find((user) => user.userId === userId);

    if (!user) {
      // console.log("!user");
      res.json([]);
    } else 
      {
        // console.log("user found"+ user.conversation);
        res.json(user.conversation);
      }
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});

router.post('/disable-model', verifyToken, async (req, res) => { 

  const {userId} = req.user;

  const user = users[userId];

  user.stopCondition = true;

  console.log("from stop route"+user.stopCondition);



  res.json({message: "Conversation stopped"});
});

router.post('/enable-model', verifyToken, async (req, res) => {

  const {userId} = req.user;

  const user = users[userId];

  user.stopCondition = false;
  
  console.log("from enable route"+user.stopCondition);
  res.json({message: "Conversation enabled"});
});

export default router;
