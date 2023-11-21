import { useCallback, useMemo, useState } from "react";
import axios from "axios";
import { useSpeechConfig } from "../modules/token_util";
import { AudioConfig, SpeechRecognizer } from "microsoft-cognitiveservices-speech-sdk";



export const useRecognizer = () => {
  
    //using latest speechConfig (token and region)
    const { speechConfig } = useSpeechConfig();
  
  
  
    //indicator for whether speech recognition is listening
    const [listening, setListening] = useState(false);
  
    //reference to speech recognizer
    const audioConfig = useMemo(() => AudioConfig.fromDefaultMicrophoneInput(), []);

    const speechRecognizer = useMemo(() => {
      if (speechConfig && audioConfig)
        return new SpeechRecognizer(speechConfig, audioConfig);
    }, [speechConfig, audioConfig]);
  
    const speakHandler = useCallback(() => {
      //toggle b/w start and stop speech recognition
  
      if (!listening) {
        speechRecognizer.startContinuousRecognitionAsync();
        setListening(true);
      } else {
        speechRecognizer.stopContinuousRecognitionAsync();
        setListening(false);
      }
    }, [listening, speechRecognizer]);
  
    return { listening, speakHandler, speechRecognizer, setListening };
  };
  