import React from 'react';
import { useSetAtom } from 'jotai';
import { globalState } from '../../../state/nearby';
import { calculateAge } from '../../../helpers/helpers';
import { ActionBar } from './ActionBar';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';

interface ReelItemProps {
    vibe: any;
}

export const VibeItem: React.FC<ReelItemProps> = ({ vibe }) => {
    const setState = useSetAtom(globalState);
  const navigate = useNavigate();

  
      const handleBlockAction = async (_userId: string) => {
            const _action = "block"

      }
    const handleLikeAction = async (postId: string) => {
      const action = "like"
        setState(prevState => ({
            ...prevState,
            nearbyUsers: prevState.nearbyUsers.map(u =>
                u.id === postId ? { ...u, [action + 'd']: !(u as any)[action + 'd'] } : u
            ),
        }));

      try{
           await api.handlePostLike(postId);
        
        
            } catch (error) {
              console.error('Error toggling like:', error);
            }

    };
    const handleOpenProfile = async(user:any) => {
        navigate('/'+user.username)

    }
 
const handleMessage =async (user: any) => {
  if (!user?.id ){
      console.error('User or profile ID is missing');
      return;
    }

    try {
      // Create chat via API
      const chatResponse = await api.createChat([user.id], 'private') as {
        chat: {
          id: string;
          type: string;
          participants?: Array<{
            user_id: string;
            user?: {
              id: string;
              username?: string;
              displayname?: string;
            };
          }>;
        };
        success: boolean;
      };

      const chatId = chatResponse?.chat?.id;

      if (chatId) {
        // Navigate to messages screen with chat ID
        navigate('/messages', {
          state: {
            openChat: chatId,
            userId: user.id,
            publicId: user.public_id,
            username: user.username
          }
        });
      } else {
        console.error('Chat creation failed - no chat ID returned');
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      // Navigate anyway, MessagesScreen will handle creating a temporary chat
      navigate('/messages', {
        state: {
          openChat: user.username || user.id,
          userId: user.id,
          publicId: user.public_id
        }
      });
    }
        

    };

    const handleShare = (userId: string) => {
        console.log(`Sharing user profile: ${userId}`);
    };

    console.log("VIBE",vibe)

    return (
        // This is now an overlay for the WebGL canvas.
        // pointer-events-none on the container lets gestures pass through to the canvas.
        <div className="absolute inset-0 z-20 flex items-end justify-between p-4 sm:p-6 pointer-events-none">
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />

            {/* Left Side: User Info - Re-enable pointer events for interaction */}
            <div className="flex-1 min-w-0 self-end z-10 pointer-events-auto">
                <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                    {vibe.username}
                     <span className="ml-2 font-light text-xl sm:text-2xl">
                        {calculateAge(vibe.date_of_birth)}
                    </span>
                </h2>
                <p className="mt-1 text-sm sm:text-base text-gray-200 drop-shadow-lg max-w-md">
                    {vibe.bio}
                </p>
            </div>
            <div className="flex-shrink-0 z-10 pointer-events-auto">
                <ActionBar
                    avatarUrl={vibe.avatar}
                    onLike={() => handleLikeAction(vibe.id)}
                    onBlock={() => handleBlockAction(vibe.id)}
                    onMessage={() => handleMessage(vibe.author)}
                    openProfile={()=>handleOpenProfile(vibe.author)}
                    onShare={() => handleShare(vibe.author.public_id)}
                />
            </div>
        </div>
    );
};
