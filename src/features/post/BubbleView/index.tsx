import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { globalState } from '../../../state/nearby'; // atomun tanımlı olduğu dosya
import { calculateAge } from '../../../helpers/helpers';
import { ActionBar } from '../../profile/UserCard/ActionBar';
import { api } from '../../../services/api';
import { useLocation, useNavigate } from '@/router';
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

interface BubbleUser {
    id: string;
    public_id: string;
    username: string;
    date_of_birth: string;
    [key: string]: unknown;
}

type BubbleViewProps = {
    users?: any[];
};

export default function BubbleView({ users: externalUsers }: BubbleViewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [state] = useAtom(globalState);

    const [isMoving, setIsMoving] = useState(false);

    const [, setIsGiftSelectorOpen] = useState(false);
    const [liked, setLiked] = useState(false);
    const [disliked, setDisliked] = useState(false)
    const [blocked, setIsBlocked] = useState(false)
    const navigate = useNavigate();
    const location = useLocation();
    const { theme } = useTheme();
    const [activeUser, setActiveUser] = useState<BubbleUser | null>(null);

    const baseButtonStyle =
        theme === 'dark'
            ? 'border border-white/10 text-gray-400 hover:bg-white/[0.06] hover:text-white'
            : 'border border-gray-300 text-gray-700 hover:bg-gray-400 hover:text-gray-900';

    useEffect(() => {
        const handleUserBlocked = (e: Event) => {
            const customEvent = e as CustomEvent<{ userId: string }>;
            const blockedId = customEvent.detail?.userId;
            if (activeUser && (activeUser.public_id === blockedId || activeUser.id === blockedId)) {
                setActiveUser(null);
            }
        };
        window.addEventListener('userBlocked', handleUserBlocked);
        return () => window.removeEventListener('userBlocked', handleUserBlocked);
    }, [activeUser]);



    const users = useMemo(() => {
        if (Array.isArray(externalUsers)) {
            return externalUsers.length ? externalUsers : defaultItems;
        }
        return state.nearbyUsers.length ? state.nearbyUsers : defaultItems;
    }, [externalUsers, state.nearbyUsers]);

    const handleActiveItemChange = useCallback((index: number) => {
        const itemIndex = index % users.length;
        setActiveUser(users[itemIndex] as BubbleUser);
    }, [users]);

    const openProfile = useCallback((profile: BubbleUser | null | undefined) => {
        if (!profile?.username) return;
        const returnTo = `${location.pathname}${location.search || ''}`;
        navigate(`/${profile.username}`, { state: { returnTo } });
    }, [location.pathname, location.search, navigate]);

    const handleOpenProfile = useCallback(() => {
        openProfile(activeUser);
    }, [activeUser, openProfile]);

    const handleItemSelect = useCallback((index: number) => {
        const selectedUser = users[index % users.length] as BubbleUser | undefined;
        setActiveUser(selectedUser ?? null);
        openProfile(selectedUser);
    }, [openProfile, users]);

    useWebGLSphere(canvasRef as React.RefObject<HTMLCanvasElement>, users, handleActiveItemChange, setIsMoving, handleItemSelect);






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
                            <button
                                type="button"
                                onClick={handleOpenProfile}
                                className="text-md cursor-pointer rounded-full px-3 py-1 font-bold transition-colors hover:text-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                                aria-label={`Open ${activeUser.username}'s profile`}
                            >
                                {activeUser.username}
                                {activeUser.date_of_birth && (
                                    <span className="font-light"> {calculateAge(activeUser.date_of_birth)}</span>
                                )}
                            </button>
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
