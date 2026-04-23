import { useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import { useNavigate } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const FriendsPage = () => {
  const { authUser } = useAuthUser();
  const navigate = useNavigate();

  const [channels, setChannels] = useState([]);

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  useEffect(() => {
    const init = async () => {
      if (!tokenData?.token || !authUser) return;

      const client = StreamChat.getInstance(STREAM_API_KEY);

      try {
        // 🔥 ADD THIS CHECK
        if (!client.userID) {
          await client.connectUser(
            {
              id: authUser._id,
              name: authUser.fullName,
              image: authUser.profilePic,
            },
            tokenData.token
          );
        }

        const filters = {
          type: "messaging",
          members: { $in: [authUser._id] },
        };

        const channels = await client.queryChannels(
          filters,
          { last_message_at: -1 },
          {
            watch: true,
            state: true,
            presence: true,
          }
        );

        setChannels(channels);
      } catch (error) {
        console.error("Error in friends init:", error);
      }
    };

    init();
  }, [tokenData, authUser]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Chats</h2>

      {channels.length === 0 && (
        <p className="text-gray-500">No chats yet</p>
      )}

      {channels.map((channel) => {
        const members = Object.values(channel.state.members);
        const otherUser = members.find(
          (m) => m.user.id !== authUser._id
        )?.user;

        const lastMessage = channel.state.messages.at(-1);

        return (
          <div
            key={channel.id}
            onClick={() => navigate(`/chat/${otherUser.id}`)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-200 cursor-pointer"
          >
            {/* Avatar */}
            <div className="relative">
              <img
                src={otherUser?.image || "/default-avatar.png"}
                className="w-12 h-12 rounded-full object-cover"
              />

              {/* Online dot (temporary fake) */}
              {otherUser && otherUser.online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-base-100"></span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <p className="font-semibold">{otherUser?.name}</p>
              <p className="text-sm text-gray-500 truncate">
                {lastMessage?.text || "No messages yet"}
              </p>
            </div>

            {/* Time */}
            <div className="text-xs text-gray-400">
              {lastMessage?.created_at
                ? new Date(lastMessage.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FriendsPage;