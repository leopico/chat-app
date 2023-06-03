import getCurrentUser from "@/app/actions/getCurrentUser";
import db from "@/app/libs/prismadb";
import { pusherSever } from "@/app/libs/pusher";
import { NextResponse } from "next/server";

interface IParams {
    conversationId: string
}

export async function DELETE(request: Request, { params }: { params: IParams }) {
    try {

        const { conversationId } = params;
        const currentUser = await getCurrentUser();

        if (!currentUser?.id) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const existingConversation = await db.conversation.findUnique({
            where: {
                id: conversationId
            },
            include: {
                users: true
            }
        });

        if (!existingConversation) {
            return new NextResponse('Invalid ID', { status: 400 });
        }

        const deletedConversation = await db.conversation.deleteMany({
            where: {
                id: conversationId,
                userIds: {
                    hasSome: [currentUser.id]
                }
            },
        })

        existingConversation.users.forEach((user) => {
            if (user.email) {
                pusherSever.trigger(user.email, 'conversation:remove', existingConversation)
            }
        })

        return NextResponse.json(deletedConversation);
        
    } catch (error: any) {
        console.log(error, 'Error_Conversation_Delete');
        return new NextResponse('Internal Error', { status: 500 });   
    }
}