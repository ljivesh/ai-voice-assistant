import { useState, useRef, useEffect, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../providers/Auth";
import { useConversation, usePlayer, useSynthesize, useTranscribe, useUserChat } from "../customhooks/userChatHook";


function SpeechToText() {

  const { user, logout } = useAuth();
  
  // const {player, resetPlayer} = usePlayer();
  const {listening, speakHandler, player} = useTranscribe();
  const {conversation} = useConversation();
  const { stopSpeech} = useSynthesize({conversation, player});





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
      {conversation.map((chat, idx) => (
        <div key={idx} style={{display: 'flex', alignItems: "center", gap: 10, border: '1px solid gray', padding: 10, margin: 10, borderRadius: 10}}>
          <h3>{chat.role}</h3>
          <p style={{textAlign: 'left'}}>{chat.content}</p>
        </div>
      ))}
      <button onClick={logout}>Logout</button>
      <button onClick={stopSpeech}>Stop</button>
        {/* <button onClick={stopConversation}>Stop Conversation</button> */}
      {/* <audio src={audioStreamRef.current} autoPlay></audio> */}
    </>
  );
}

export default SpeechToText;
