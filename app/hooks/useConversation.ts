import { useParams } from "next/navigation"
import { useMemo } from "react";

//This hook is taking conversationId from param those selected dynamic route

const useConversation = () => { 
    const params = useParams();
    
    //search for conversationIs in params
    const conversationId = useMemo(() => {
        if (!params?.conversationId) {
            return ""
        }
        return params.conversationId as string
    },[params?.conversationId]);

    //<--!!--> is change from string to boolean
    const isOpen = useMemo(() => !!conversationId, [conversationId]);

    return useMemo(() => ({
        isOpen,
        conversationId
    }), [isOpen, conversationId]);

}

export default useConversation