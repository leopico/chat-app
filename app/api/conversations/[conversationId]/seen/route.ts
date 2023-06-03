import getCurrentUser from "@/app/actions/getCurrentUser";
import db from "@/app/libs/prismadb";
import { pusherSever } from "@/app/libs/pusher";
import { NextResponse } from "next/server";

interface IParams {
    conversationId: string
}

export async function POST(request: Request, { params }: { params: IParams }) {
    try {
        const currentUser = await getCurrentUser();

        const { conversationId } = params;

        if (!currentUser?.id || !currentUser?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const conversation = await db.conversation.findUnique({
            where: {
                id: conversationId
            },
            include: {
                messages: {
                    include: {
                        seen: true
                    }
                },
                users: true
            }
        });

        if (!conversation) {
            return new NextResponse('Invalid Id', { status: 400 });
        }

        //find the last message
        const lastMessage = conversation.messages[conversation.messages.length - 1];

        if (!lastMessage) {
            return  NextResponse.json(conversation);
        }

        //update seen of last message
        const updatedMessage = await db.message.update({
            where: {
                id: lastMessage.id //this is coming from conversation's id
            },
            include: {
                sender: true,
                seen: true
            },
            data: {
                seen: {
                    connect: {id: currentUser.id} //update seenIds from message model
                }
            }
        });

        await pusherSever.trigger(currentUser.email, 'conversation:update', {
            id: conversationId,
            messages: [updatedMessage]
        });

        //if have currentUser.id in seenIds
        if (lastMessage.seenIds.indexOf(currentUser.id) !== -1) {
            return NextResponse.json(conversation)
        };

        await pusherSever.trigger(conversationId!, 'message:update', updatedMessage);

        return NextResponse.json(updatedMessage);

    } catch (error: any) {
        console.log(error, 'Error_Messages_Seen');
        return new NextResponse('Internal Error', { status: 500})
    }
}