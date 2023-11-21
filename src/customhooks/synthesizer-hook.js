
import { useCallback, useMemo, useState } from "react";
import { useSpeechConfig } from "../modules/token_util";
import { AudioConfig, SpeechSynthesizer, SpeakerAudioDestination, PullAudioOutputStream } from "microsoft-cognitiveservices-speech-sdk";

export const useSynthesize = () => {
    
    const { speechConfig } = useSpeechConfig();
  

    const player = useMemo(()=> new SpeakerAudioDestination(),[]);
  


    const audioConfig = useMemo(() => AudioConfig.fromSpeakerOutput(player), [player]);

    const speechSynthesizer = useMemo(() => {
      if (speechConfig && audioConfig)
        return new SpeechSynthesizer(speechConfig, audioConfig);
    }, [speechConfig, audioConfig]);
  

  
    return { speechSynthesizer, player };
  };