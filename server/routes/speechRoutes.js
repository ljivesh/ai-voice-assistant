import { Router } from "express";
import { verifyToken } from "../modules/jwtauth.js";
import axios from "axios";
import OpenAI from "openai";
import speechConfig from "../config/speechConfig.js";
import openaiConfig from "../config/openaiConfig.js";
import ResponseQueue from "../models/ResponseQueue.js";
const { speechKey, speechRegion } = speechConfig;
import { decode } from "jsonwebtoken";
const { apiKey } = openaiConfig;

const openai = new OpenAI({ apiKey: apiKey });

const conversations = [];
let stopCondition = false;

const router = Router();

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
  

    const temp = conversations.find((user) => user.userId === userId);
    if(!temp) {
      conversations.push({ userId: userId, conversation: conversation });
    } else {
      temp.conversation = conversation;
    }


    const user = conversations.find((user) => user.userId === userId); 

    if(stopCondition) {
      res.json(user.conversation);
      return;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: conversation,
      stream: true,
    });

    let bufferString = ""; //buffer to hold the chunks of data from openai
    // const responseQueue = await ResponseQueue.getQueueByUserId(userId);

    for await (const chunk of completion) {

      if(stopCondition) {
        
        break;
      }

      console.log(chunk.choices[0].delta.content);
      if (chunk.choices[0].delta.content === null) {
        user.conversation.push({ role: "assistant", content: bufferString });
        res.json(user.conversation);
        break;
      }

      if (
        chunk.choices[0].delta.content &&
        chunk.choices[0].delta.content.includes(".")
      ) {
        await user.conversation.push({
          role: "assistant",
          content: bufferString + ".",
        });
        bufferString = "";
        continue;
      }
      // console.log(chunk.choices[0].delta.content);
      bufferString = bufferString.concat(chunk.choices[0].delta.content);
      // console.log(bufferString);
    }

    res.json(user.conversation);

    // responseArray.push(bufferString);
    // console.log(responseArray);

    // res.json(responseArray);

    // res.json(conversations);
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
  stopCondition = true;
  console.log("from stop route"+stopCondition);



  res.json({message: "Conversation stopped"});
});

router.post('/enable-model', verifyToken, async (req, res) => {
  stopCondition = false;
  console.log("from enable route"+stopCondition);
  res.json({message: "Conversation enabled"});
});

export default router;
