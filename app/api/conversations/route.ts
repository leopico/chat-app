import getCurrentUser from "@/app/actions/getCurrentUser";
import db from "@/app/libs/prismadb";
import { pusherSever } from "@/app/libs/pusher";
import { NextResponse } from "next/server";


export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUser();
        const body = await request.json();
        const { userId, isGroup, members, name } = body;

        if (!currentUser?.id || !currentUser?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        //for create group chat validation
        if (isGroup && (!members || members.length < 2 || !name)) {
            return new NextResponse('Invalid data', { status: 400 });
        }

        //for creatre group chat
        if (isGroup) {
            const newConversation = await db.conversation.create({
                data: {
                    name,
                    isGroup,
                    users: {
                        connect: [
                            ...members.map((member: { value: string }) => ({
                                id: member.value
                            })),
                            {
                                id: currentUser.id //sepreatly add current user to the group of member
                            }
                        ]
                    }
                },
                include: {
                    users: true //populate (popolate is mean {pipelien (from ... to ...)}) all data of users with those have in group chat that for using our ui
                }
            })


            //this is for group chat 
            newConversation.users.forEach((user) => {
                if (user.email) {
                    pusherSever.trigger(user.email, 'conversation:new', newConversation)
                }
            });

            return NextResponse.json(newConversation)
        }
        //end creatre group chat


        //for one to one chat
        const existingConversation = await db.conversation.findMany({
            //OR is covering if already have conversation with one to one chat that prevent for new creating
            where: {
                OR: [
                    {
                        userIds: {
                            equals: [currentUser.id, userId]
                        }
                    },
                    {
                        userIds: {
                            equals: [userId, currentUser.id]
                        }
                    }
                ]
            }
        })

        const singleConversation = existingConversation[0]

        if (singleConversation) {
            return NextResponse.json(singleConversation);
        }

        const newConversation = await db.conversation.create({
            data: {
                users: {
                    connect: [
                        {
                            id: currentUser.id //this is current user that myself
                        },
                        {
                            id: userId //this is I clicked those user for conversation
                        }
                    ]
                }
            },
            include: {
                users: true //use for ui
            }
        })

        //this is for individual chat
        newConversation.users.map((user) => {
            if (user.email) {
                pusherSever.trigger(user.email, 'conversation:new', newConversation)
            }
        });

        return NextResponse.json(newConversation);

        //end one to one chat


    } catch (error: any) {
        return new NextResponse('Internal Error', { status: 500 })
    }
}