import db from "../libs/prismadb";
import getCurrentUser from "./getCurrentUser"



const getConversation = async () => {
    const currentUser = await getCurrentUser();

    if (!currentUser?.id) {
        return []
    }

    try {
        const conversations = await db.conversation.findMany({
            orderBy: {
                lastMessageAt: "desc"
            },
            where: {
                userIds: {
                    has: currentUser.id //that included one to one conversations and group chat conversations
                }
            },
            include: {
                users: true,
                messages: {
                    include: {
                        sender: true,
                        seen: true
                    }
                }
            }
        })

        return conversations
        
    } catch (error: any) {
        return []
    }
}

export default getConversation