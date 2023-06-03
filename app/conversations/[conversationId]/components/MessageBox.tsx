'use client'

import Avatar from "@/app/components/Avatar"
import { FullMessageType } from "@/app/types"
import clsx from "clsx"
import { format } from "date-fns"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { useState } from "react"
import ImageModal from "./ImageModal"

interface MessageBoxProps {
    isLast?: boolean
    data: FullMessageType
}

const MessageBox: React.FC<MessageBoxProps> = ({ isLast, data }) => {

    const session = useSession(); //this is compare for own messages and other user messages to show seperatly

    const [imageModalOpen, setImageModalOpen] = useState(false);

    //taking only the sender's data
    const isOwn = session?.data?.user?.email === data?.sender?.email;

    //for protected error by js that putting empty array and filter is removed for sender email for showing the lists
    const seenList = (data.seen || [])
        .filter((user) => user.email !== data?.sender?.email)
        .map((user) => user.image)
        .join(' '); //joined all of that

    //for classNames
    const container = clsx(
        'flex gap-2 p-4',
        isOwn && 'justify-end'
    );

    const avatar = clsx(isOwn && 'order-2');

    const body = clsx(
        'flex flex-col gap-2',
        isOwn && 'items-end'
    );

    const message = clsx(
        'text-sm w-fit overflow-hidden',
        isOwn ? 'bg-sky-500 text-white' : 'bg-gray-100',
        data.image ? 'rounded-md p-0' : 'rounded-full py-2 px-3'
    );

    return (
        <div className={container} >
            <div className={avatar}>
                <Avatar user={data.sender} />
            </div>
            <div className={body}>
                <div className="flex items-center gap-1">
                    <div className="text-sm text-gray-500">
                        {data.sender.name}
                    </div>
                    <div className="text-xs text-gray-400">
                        {format(new Date(data.createdAt), 'p')}
                    </div>
                </div>
                <div className={message}>
                    <ImageModal
                        src={data.image}
                        isOpen={imageModalOpen}
                        onClose={() => setImageModalOpen(false)}
                    />
                    {
                        data.image ? (
                            <Image
                                onClick={() => setImageModalOpen(true)}
                                alt="image"
                                height="200"
                                width="200"
                                src={data.image}
                                className="object-cover cursor-pointer hover:scall-110 transition translate"
                            />
                        ) : (
                            <div>{data.body}</div>
                        )
                    }
                </div>
                {
                    isLast && isOwn && seenList.length > 0 && (
                        <div className="flex gap-2 shrink-0">
                            <div className="text-xs text-gray-400">seen by</div>
                            <Image
                                alt="seen_image"
                                height="15"
                                width="15"
                                src={seenList}
                                className="object-cover hover:scall-110 transition translate rounded-full"
                            />
                        </div>

                    )
                }
            </div>
        </div>
    )
}

export default MessageBox