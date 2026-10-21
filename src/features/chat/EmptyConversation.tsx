import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import LottieAnimation from '@/features/animations/LottieAnimation';
import { nextGreeting } from '@/features/animations/greetings';
import type { ChatEmoticon } from '@/features/emoticons/types';

export default function EmptyConversation({ onGreeting }: { onGreeting: (sticker: ChatEmoticon) => void }) {
  const { t } = useTranslation('common');
  const chosen = useRef<ChatEmoticon | null>(null);
  const [greeting, setGreeting] = useState<ChatEmoticon | null>(null);
  useEffect(() => {
    chosen.current ??= nextGreeting();
    setGreeting(chosen.current);
  }, []);
  return <div className="cv-chat-greeting">
    <strong>{t('messages.no_messages_yet')}</strong>
    <p>{t('messages.greeting_description')}</p>
    {greeting && <button type="button" className="cv-chat-greeting-sticker" data-ripple="off" aria-label={t('messages.send_greeting')} onClick={() => onGreeting(greeting)}>
      <LottieAnimation src={greeting.url} size={160} />
    </button>}
  </div>;
}
