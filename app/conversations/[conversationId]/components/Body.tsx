'use client'

import { FullMessageType } from "@/app/types"
import { useEffect, useRef, useState } from "react"
import useConversation from "@/app/hooks/useConversation";
import MessageBox from "./MessageBox";
import axios from "axios";
import { pusherClient } from "@/app/libs/pusher";
import { find } from "lodash";

interface BodyProps {
    initialMessages: FullMessageType[]
}

const Body: React.FC<BodyProps> = ({ initialMessages }) => {
    const [messages, setMessages] = useState(initialMessages);
    const bottomRef = useRef<HTMLDivElement>(null); // for scroll down the body for getting last messages

    const { conversationId } = useConversation();


    //this useEffect is doing that already send messages is already seen or not
    useEffect(() => {
        axios.post(`/api/conversations/${conversationId}/seen`)
    }, [conversationId]);

    //this is for pusher for real time
    useEffect(() => {
        axios.post(`/api/conversations/${conversationId}/seen`);

        pusherClient.subscribe(conversationId);
        bottomRef?.current?.scrollIntoView();

        const messageHandler = (message: FullMessageType) => {
            setMessages((current) => {
                if (find(current, { id: message.id })) { //id is in current and message.id is in newMessage
                    return current
                }

                return [...current, message]
            })

            bottomRef?.current?.scrollIntoView();
        };

        //for seen messages in body
        const updateMessageHandler = (newMessage: FullMessageType) => {
            setMessages((current) => current.map((currentMessage) => {
                if (currentMessage.id === newMessage.id) {
                    return newMessage;
                }

                return currentMessage;
            }))
        };

        pusherClient.bind('messages:new', messageHandler);
        pusherClient.bind('message:update', updateMessageHandler);

        //this is for unmounted
        return () => {
            pusherClient.unsubscribe(conversationId);
            pusherClient.unbind('messages:new', messageHandler);
            pusherClient.unbind('message:update', updateMessageHandler)
        }
    }, [conversationId]);

    return (
        <div className="flex-1 overflow-y-auto">
            {
                messages.map((message, i) => (
                    <MessageBox
                        isLast={i === messages.length - 1}
                        key={message.id}
                        data={message}
                    />
                ))
            }
            <div ref={bottomRef} className="pt-24" />
        </div>
    )
}

export default Body