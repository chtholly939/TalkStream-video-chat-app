import { useEffect, useState } from "react";
import { useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";

import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";

import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const ChatPage = () => {
  const { id: targetUserId } = useParams();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  const { authUser } = useAuthUser();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser, // this will run only when authUser is available
  });

  useEffect(() => {
    const initChat = async () => {
      if (!tokenData?.token || !authUser) return;

      const client = StreamChat.getInstance(STREAM_API_KEY);

      try {
        if (!client.userID) {
          await client.connectUser(
            {
              id: authUser._id,
              name: authUser.fullName,
              image: authUser.profilePic,
              location: authUser.location, 
              status: authUser.status,
            },
            tokenData.token
          );
        }

        const channelId = [authUser._id, targetUserId].sort().join("-");

        const currChannel = client.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });

        await currChannel.watch();

        setChatClient(client);
        setChannel(currChannel);
      } catch (error) {
        console.error("Error initializing chat:", error);
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [tokenData, authUser, targetUserId]);

  const handleVideoCall = () => {
    if (channel) {
      const callUrl = `${window.location.origin}/call/${channel.id}`;

      channel.sendMessage({
        text: `I've started a video call. Join me here: ${callUrl}`,
      });

      toast.success("Video call link sent successfully!");
    }
  };

  if (loading || !chatClient || !channel) return <ChatLoader />;

  return (
    <div className="h-[93vh]">
      <Chat client={chatClient}>
        <Channel channel={channel} typingEvents={true}>
          <div className="w-full relative">
            <CallButton handleVideoCall={handleVideoCall} />
            <Window>
              {(() => {
                const otherUser = Object.values(channel.state.members).find(
                  (m) => m.user.id !== authUser._id
                )?.user;

                return (
                  <div className="flex items-center gap-3 p-3 border-b border-base-300 bg-base-100">
                    
                    {/* Avatar */}
                    <img
                      src={
                        otherUser?.image ||
                        otherUser?.profilePic ||
                        "/default-avatar.png"
                      }
                      className="w-10 h-10 rounded-full object-cover"
                    />

                    {/* Name + Location */}
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {otherUser?.name || "User"}
                      </span>

                      <span className="text-xs opacity-70 flex items-center gap-1">
                        📍 {otherUser?.location || "Unknown location"}
                      </span>
                    </div>
                  </div>
                );
              })()}
              <MessageList />
              {channel.state.typing && Object.values(channel.state.typing).length > 0 && (
                <div className="px-4 py-2 text-sm text-gray-500">
                  {Object.values(channel.state.typing)
                    .filter((t) => t.user.id !== authUser._id)
                    .map((t) => `${t.user.name} is typing...`)}
                </div>
              )}
              <MessageInput focus />
            </Window>
          </div>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};
export default ChatPage;
