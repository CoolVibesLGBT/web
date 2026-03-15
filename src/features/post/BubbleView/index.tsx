import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './style.css';
import { useAtom } from 'jotai';
import { globalState } from '../../../state/nearby'; // atomun tanımlı olduğu dosya
import { calculateAge } from '../../../helpers/helpers';
import { ActionBar } from '../../profile/UserCard/ActionBar';
import { api } from '../../../services/api';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { AnimatePresence, motion } from 'framer-motion';
import { useWebGLSphere } from '../../../hooks/useWebGLSphere';


const defaultItems = [
    {
        image: 'https://picsum.photos/900/900?grayscale',
        link: 'https://google.com/',
        title: '',
        description: ''
    }
];

export default function BubbleView() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [state, setState] = useAtom(globalState);

    const [activeItem, setActiveItem] = useState(null);
    const [isMoving, setIsMoving] = useState(false);

    const [isGiftSelectorOpen, setIsGiftSelectorOpen] = useState(false);
    const [isQuickMessageSelectorOpen, setIsQuickMessageSelectorOpen] = useState(false);
    const [liked, setLiked] = useState(false);
    const [disliked, setDisliked] = useState(false)
    const [blocked, setIsBlocked] = useState(false)
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [activeUser, setActiveUser] = useState<any | null>(null);

    const baseCardStyle =
        theme === 'dark'
            ? 'bg-gray-950 border border-gray-900 text-white'
            : 'bg-white border border-gray-100 text-black';

    const baseButtonStyle =
        theme === 'dark'
            ? 'border border-gray-700 text-gray-400 hover:bg-gray-950 hover:text-white'
            : 'border border-gray-300 text-gray-700 hover:bg-gray-400 hover:text-gray-900';

    useEffect(() => {
        console.log(state.nearbyUsers)
    }, []);

    useEffect(() => {
        const handleUserBlocked = (e: unknown) => {
            const blockedId = e.detail?.userId;
            if (activeUser && (activeUser.public_id === blockedId || activeUser.id === blockedId)) {
                setActiveUser(null);
            }
        };
        window.addEventListener('userBlocked', handleUserBlocked);
        return () => window.removeEventListener('userBlocked', handleUserBlocked);
    }, [activeUser]);



    const users = useMemo(() => state.nearbyUsers.length ? state.nearbyUsers : defaultItems, [state.nearbyUsers]);

    const handleActiveItemChange = useCallback((index: number) => {
        const itemIndex = index % users.length;
        setActiveUser(users[itemIndex]);
    }, [users]);

    const webglController = useWebGLSphere(canvasRef, users, handleActiveItemChange, setIsMoving);






    const handleSendMessage = async (profile: unknown) => {
        if (!profile?.id) {
            console.error('User or profile ID is missing');
            return;
        }

        try {
            // Create chat via API
            const chatResponse = await api.createChat([profile.id], 'private') as {
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
                        userId: profile.id,
                        publicId: profile.public_id,
                        username: profile.username
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
                    openChat: profile.username || profile.id,
                    userId: profile.id,
                    publicId: profile.public_id
                }
            });
        }
    };

    const handleSendLike = async (user: unknown) => {
        //


        if (!user?.public_id) return;

        try {
            await api.toggleUserLike({
                likee_id: user.public_id,
            });


        } catch (error) {
            console.error('Error toggling like:', error);
            // Optionally show error message to user
        }
    }

    const handleSendDislike = async (user: unknown) => {
        //


        if (!user?.public_id) return;

        try {
            await api.toggleUserDislike({
                likee_id: user.public_id,
            });


        } catch (error) {
            console.error('Error toggling like:', error);
            // Optionally show error message to user
        }
    }

    const handleBlock = async (user: unknown) => {
        //


        if (!user?.public_id) return;

        try {
            await api.toggleBlockUser(user.public_id);
        } catch (error) {
            console.error('Error toggling like:', error);
            // Optionally show error message to user
        }
    }



    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <canvas id="infinite-grid-menu-canvas" ref={canvasRef} />
            <AnimatePresence>
                {activeUser && !isMoving && (
                    <motion.div
                        className="absolute bottom-0 left-0 right-0 h-1/4 md:h-1/5 flex flex-col items-center justify-center"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className={` w-full max-w-sm flex flex-col gap-2 items-center justify-center text-center`}>
                            <h2 className="text-md font-bold">{activeUser?.username} <span className="font-light">{calculateAge(activeUser.date_of_birth)}</span></h2>
                            <ActionBar
                                viewMode='bubble'
                                liked={liked}
                                disliked={disliked}
                                blocked={blocked}
                                onBlockToggle={() => {
                                    setIsBlocked((prev) => !prev)
                                    handleBlock(activeUser)
                                }}
                                onLikeToggle={() => {
                                    setLiked((prev) => !prev)
                                    handleSendLike(activeUser)
                                }}
                                onDislikeToggle={() => {
                                    setDisliked((prev) => !prev)
                                    handleSendDislike(activeUser)
                                }}
                                onOpenGiftSelector={() => setIsGiftSelectorOpen(true)}
                                onOpenQuickMessageSelector={() => {
                                    handleSendMessage(activeUser)
                                }}
                                baseButtonStyle={baseButtonStyle}
                                onTriggerOverlay={() => { }}
                            />
                        </div>




                    </motion.div>)}
            </AnimatePresence>


        </div>
    );
}
