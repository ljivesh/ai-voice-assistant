import { useCallback, useMemo, useState, useEffect } from "react";
import axios from "axios";
import { useSpeechConfig } from "../modules/token_util";
import { AudioConfig, SpeechRecognizer } from "microsoft-cognitiveservices-speech-sdk";

export const useRecognizer = (speechConfig) => {
  const [listening, setListening] = useState(false);
  const [speechRecognizer, setSpeechRecognizer] = useState(null);

  const speakHandler = useCallback(() => {
    if (!listening) {
      if (!speechRecognizer) {
        const audioConfig = AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new SpeechRecognizer(speechConfig, audioConfig);
        setSpeechRecognizer(recognizer);
        recognizer.startContinuousRecognitionAsync();
      } else {
        speechRecognizer.startContinuousRecognitionAsync();
      }
      setListening(true);
    } else {
      speechRecognizer.stopContinuousRecognitionAsync();
      setListening(false);
    }
  }, [listening, speechRecognizer, speechConfig]);

  return { listening, speakHandler, speechRecognizer, setListening };
};


export  function useMicrophone() {
    const [audioContext, setAudioContext] = useState(null);
    const [audioLevel, setAudioLevel] = useState(0);
  
    const startAudioContext = () => {
      const context = new AudioContext();
      setAudioContext(context);
    };
  
    useEffect(() => {
      if (!audioContext) return;
  
      let animationFrameId = null;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
  
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);
  
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
  
          const updateAudioLevel = () => {
            analyser.getByteFrequencyData(dataArray);
  
            // Compute the average audio level
            const level = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
            setAudioLevel(level);
  
            animationFrameId = requestAnimationFrame(updateAudioLevel);
          };
  
          updateAudioLevel();
        });
  
      return () => {
        cancelAnimationFrame(animationFrameId);
      };
    }, [audioContext]);
  
    return { audioLevel, startAudioContext };
  }