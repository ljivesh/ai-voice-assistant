import { useState, useRef, useEffect, useMemo } from "react";
import axios from "axios";

import { getTokenOrRefresh } from "../modules/token_util";
import {
  AudioConfig,
  SpeechConfig,
  SpeechRecognizer,
  ResultReason,
  SpeechSynthesizer,
  PushAudioOutputStream,
  AudioOutputStream,
} from "microsoft-cognitiveservices-speech-sdk";
import { useAuth } from "../providers/Auth";
import { useUserChat } from "../customhooks/userChatHook";
import { set } from "mongoose";

function SpeechToText() {
  const [listening, setListening] = useState(false);

  const { userChat, setUserChat } = useUserChat();


  const [renderedChat, setRenderedChat] = useState([]);

  const audioStreamRef = useRef(null);

  useEffect(() => {
    if (!audioStreamRef.current) {
      audioStreamRef.current = AudioOutputStream.createPullStream();
    }
    console.log(audioStreamRef.current);
  }, [audioStreamRef.current]);

  const { user, logout } = useAuth();

  const recognizerRef = useRef(null);

  // const speakHandler = async () => {

  //   const tokenObj = await getTokenOrRefresh();
  //   const speechConfig = SpeechConfig.fromAuthorizationToken(
  //     tokenObj.authToken,
  //     tokenObj.region
  //   );
  //   speechConfig.speechRecognitionLanguage = "en-US";

  //   const audioConfig = AudioConfig.fromDefaultMicrophoneInput();
  //   const recognizer = new SpeechRecognizer(speechConfig, audioConfig);

  //   // setDisplayText('speak into your microphone...');
  //   setListening(true);

  //   recognizer.recognizeOnceAsync((result) => {
  //     if (result.reason === ResultReason.RecognizedSpeech) {
  //       console.log(result.text);
  //       setText((prev)=> prev.concat(" ",result.text));
  //       setListening(false);
  //     } else {
  //       console.log("error");
  //       setText("Error");
  //       setListening(false);
  //     }
  //     console.log("Here");

  //   });
  // };

  const startSpeechRecognition = async () => {
    const speechToken = await getTokenOrRefresh();
    const speechConfig = SpeechConfig.fromAuthorizationToken(
      speechToken.authToken,
      speechToken.region
    );
    speechConfig.speechRecognitionLanguage = "en-US";

    const audioConfig = AudioConfig.fromDefaultMicrophoneInput();
    recognizerRef.current = new SpeechRecognizer(speechConfig, audioConfig);

    recognizerRef.current.recognized = (s, e) => {
      if (e.result.reason === ResultReason.RecognizedSpeech) {
        console.log(e.result.text);
        setUserChat((prev) => [...prev, e.result.text]);
        setRenderedChat((prev) => [...prev, {role: 'user', content: e.result.text}]);
      } else if (e.result.reason === ResultReason.NoMatch) {
        console.log("NOMATCH: Speech could not be recognized.");
      }
    };

    recognizerRef.current.canceled = (s, e) => {
      console.log(`CANCELED: Reason=${e.reason}`);
      if (e.reason === CancellationReason.Error) {
        console.log(`CANCELED: ErrorCode=${e.errorCode}`);
        console.log(`CANCELED: ErrorDetails=${e.errorDetails}`);
        console.log("CANCELED: Did you update the subscription info?");
      }
      setListening(false);
      recognizerRef.current.stopContinuousRecognitionAsync();
    };

    recognizerRef.current.sessionStopped = (s, e) => {
      console.log("\n    Session stopped event.");
      setListening(false);
      recognizerRef.current.stopContinuousRecognitionAsync();
    };

    recognizerRef.current.startContinuousRecognitionAsync();
  };

  const textToSpeechDefault = async (text) => {
    const speechToken = await getTokenOrRefresh();

    const speechConfig = SpeechConfig.fromAuthorizationToken(
      speechToken.authToken,
      speechToken.region
    );

    const synthesizer = new SpeechSynthesizer(
      speechConfig,
      AudioConfig.fromDefaultSpeakerOutput()
    );

    synthesizer.speakTextAsync(
      text,
      (result) => {
        if (result.reason === ResultReason.SynthesizingAudioCompleted) {
          console.log(`\nSpeaking: ${text}`);
          // console.log(result.audioData);
          console.log(result.audioDuration / 10000);
          setTimeout(() => {
            setBusy(false);
            setCount(count+1);
            setRenderedChat((prev) => [...prev, {role: 'bot', content: text}]);
          }, result.audioDuration / 10000);
        } else {
          console.error(
            "ERROR: Speech Synthesis canceled, " +
              result.errorDetails +
              "\nDid you update the subscription info?"
          );
        }
      },
      (err) => {
        console.trace("err - " + err);
      }
    );
    console.log("Complete");
  };

  const textToSpeechStream = async (text) => {
    const speechToken = await getTokenOrRefresh();
    const speechConfig = SpeechConfig.fromAuthorizationToken(
      speechToken.authToken,
      speechToken.region
    );

    const synthesizer = new SpeechSynthesizer(
      speechConfig,
      AudioConfig.fromStreamOutput(audioStreamRef.current)
    );

    synthesizer.speakTextAsync(
      text,
      (result) => {
        if (result.reason === ResultReason.SynthesizingAudioCompleted) {
          console.log(`\nSpeaking: ${text}`);

          // synthesizer.close();
        } else {
          console.error(
            "ERROR: Speech Synthesis canceled, " +
              result.errorDetails +
              "\nDid you update the subscription info?"
          );
          // synthesizer.close();
        }
      },
      (err) => {
        console.trace("err - " + err);
        // synthesizer.close();
      },
      audioStreamRef.current
    );
  };

  const [busy, setBusy] = useState(false);

  const [responseQueue, setResponseQueue] = useState([]);

  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!busy && responseQueue.length > 0 && count < responseQueue.length) {
      textToSpeechDefault(responseQueue[count]);
      setBusy(true);
    }
  }, [busy, responseQueue]);

  const speakHandler = () => {
    if (!listening) {
      startSpeechRecognition();
      setListening(true);
    } else {
      recognizerRef.current.stopContinuousRecognitionAsync();
      console.log(recognizerRef);
      setListening(false);
    }
  };

  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const res = await axios.get("/api/speech/fetch-queue");
        console.log("running");
        if (JSON.stringify(res.data) !== JSON.stringify(responseQueue)) {
          console.log(res.data[res.data.length - 1]);
          // textToSpeech(res.data[res.data.length - 1]);
          setResponseQueue(res.data);
        }
      } catch (error) {
        console.log(error);
      }
    }, 1000);

    return () => clearInterval(intervalId); // This represents the unmount function, in which you need to clear your interval to prevent memory leaks.
  }, [responseQueue]);

  // // ...

  // const clearResult = ()=> setUserChat([]);

  return (
    <>
      <h1>{!listening ? "Quite..." : "Listening..."}</h1>
      <h2>Logged in as: {user.email}</h2>
      <div>
        <button onClick={speakHandler}>
          {!listening ? "Start Speaking" : "Stop Speaking"}
        </button>
        {/* <button onClick={clearResult} >Clear</button> */}
      </div>
      {renderedChat.map((chat, idx) => (
        <div key={idx} style={{display: 'flex', alignItems: "center", gap: 10, border: '1px solid gray', padding: 10, margin: 10, borderRadius: 10}}>
          <h3>{chat.role}</h3>
          <p style={{textAlign: 'left'}}>{chat.content}</p>
        </div>
      ))}
      <button onClick={logout}>Logout</button>
      <audio src={audioStreamRef.current} autoPlay></audio>
    </>
  );
}

export default SpeechToText;
