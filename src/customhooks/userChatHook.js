import axios from "axios";
import { useEffect, useState } from "react"



export const useUserChat = () => { 

    const [userChat, setUserChat] = useState([]);


    useEffect(()=> {

        const sendChatTokens = async () => {

            const response = await axios.post('/api/speech/user-content', {content: userChat.slice(-1)[0]});
            console.log(response.data);
        }

        if(userChat.length > 0) {
            sendChatTokens();
        }
    },[userChat]);

    return {userChat, setUserChat};

}