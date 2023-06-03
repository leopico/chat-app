import getCurrentUser from "@/app/actions/getCurrentUser";
import db from "@/app/libs/prismadb";
import { NextResponse } from "next/server";
import { pusherSever } from "@/app/libs/pusher";


export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUser();

        const body = await request.json();
        const { message, image, conversationId } = body;

        if (!currentUser?.id || !currentUser?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const newMessage = await db.message.create({
            data: {
                body: message,
                image: image,
                conversation: {
                    connect: {id: conversationId}
                },
                sender: {
                    connect: {id: currentUser.id}
                },
                seen: {
                    connect: {id: currentUser.id}
                }
            },
            include: {
                seen: true,
                sender: true
            }
        });

        //this logic is for real time 
        const updatedConversation = await db.conversation.update({
            where: {
                id: conversationId
            },
            data: {
                lastMessageAt: new Date(),
                messages: {
                    connect: { id: newMessage.id } //for adding messagesIds
                }
            },
            include: {
                users: true,
                messages: {
                    include: {
                        seen: true
                    }
                }
            }
        }); 

        //messages:new is a key for this channel
        await pusherSever.trigger(conversationId, 'messages:new', newMessage);

        const lastMessage = updatedConversation.messages[updatedConversation.messages.length - 1];

        //this is checking for side bar update
        updatedConversation.users.map((user) => {
            pusherSever.trigger(user.email!, 'conversation:update', {
                id: conversationId,
                messgaes: [lastMessage]
            })
        });

        return NextResponse.json(newMessage);

    } catch (error: any) {
        console.log(error, 'Error_Messages');
        return new NextResponse('InternalError', { status: 500 });
    }
}