import { User } from "@prisma/client";
import { FullConversationType } from "../types";
import { useSession } from "next-auth/react";
import { useMemo } from "react";


const useOtherUsers = (conversation: FullConversationType | { users: User[] } ) => {

    const session = useSession();

    const otherUser = useMemo(() => {
        const currentUserEmail = session?.data?.user?.email;

        const otherUser = conversation.users.filter((user) => user.email !== currentUserEmail);

        return otherUser[0]; //because this is array and want to get single user
    },[session?.data?.user?.email, conversation.users])


    return otherUser;
}

export default useOtherUsers