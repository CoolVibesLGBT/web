import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal } from 'lucide-react';
import { Heart, HeartOff, MapPin, MessageCircleHeart, ShieldBan } from '@/components/ui/illustratedIcons';
import { Sheet } from '@/components/ui/Interface';
import './user-card.css';

export interface User {
  id: string;
  public_id: string | number;
  username: string;
  displayname?: string;
  name?: string;
  avatar?: string | { file?: { url?: string } } | null;
  date_of_birth?: string;
  location?: string | { display?: string };
  isOnline?: boolean;
}

export interface UserCardViewProps {
  user: User;
  viewMode: 'compact' | 'list' | 'card';
  liked: boolean;
  disliked: boolean;
  blocked: boolean;
  handleSendMessage: (user: User) => void;
  handleSendLike: (user: User) => void;
  handleSendDislike: (user: User) => void;
  handleBlock: (user: User) => void;
  handleProfileClick: () => void;
  avatarURL: string;
  userAge: string;
  location: string;
}

export default function UserCardView({ user, viewMode, liked, disliked, blocked, handleSendMessage, handleSendLike, handleSendDislike, handleBlock, handleProfileClick, avatarURL, userAge, location }: UserCardViewProps) {
  const { t } = useTranslation('common');
  const [menuOpen, setMenuOpen] = useState(false);
  const [failedAvatar, setFailedAvatar] = useState('');
  const name = user.displayname || user.name || user.username || t('app.someone');
  const username = user.username || user.name?.toLowerCase().replace(/\s+/g, '') || 'profile';

  return <article className="cv-person-card" data-view={viewMode}>
    <div className="cv-person-layout">
    <a className="cv-person-profile" href={`/${username}`} aria-label={`${t('app.view_profile')}: ${name}`} onClick={event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      handleProfileClick();
    }}>
      <span className="cv-person-avatar">
        <span className="cv-person-initial" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
        {avatarURL && avatarURL !== failedAvatar && <img src={avatarURL} alt="" loading="lazy" decoding="async" onError={() => setFailedAvatar(avatarURL)} />}
        {user.isOnline && <span className="cv-person-online"><span />{t('discovery.online')}</span>}
      </span>
      <span className="cv-person-info">
        <span className="cv-person-name">{name}{userAge && <span className="cv-person-age">{userAge}</span>}</span>
        {location && <span className="cv-person-location"><MapPin /><span>{location}</span></span>}
      </span>
    </a>
    <div className="cv-person-actions">
      <button type="button" onClick={() => handleSendMessage(user)} aria-label={t('profile.send_message')} title={t('profile.send_message')}><MessageCircleHeart /></button>
      <button type="button" onClick={() => handleSendLike(user)} aria-label={t('discovery.like')} title={t('discovery.like')} aria-pressed={liked}><Heart /></button>
      {viewMode === 'list' ? <>
        <button type="button" onClick={() => handleSendDislike(user)} aria-label={t('discovery.dislike')} title={t('discovery.dislike')} aria-pressed={disliked}><HeartOff /></button>
        <button type="button" onClick={() => handleBlock(user)} aria-label={t('discovery.block')} title={t('discovery.block')} aria-pressed={blocked}><ShieldBan /></button>
      </> : <button type="button" onClick={() => setMenuOpen(true)} aria-label={t('app.nav.more')} title={t('app.nav.more')} aria-haspopup="dialog" aria-expanded={menuOpen}><MoreHorizontal /></button>}
    </div>
    </div>
    {menuOpen && <Sheet isOpen onClose={() => setMenuOpen(false)} title={name} className="cv-panel-sheet">
      <div className="cv-person-menu">
        <button type="button" aria-pressed={disliked} onClick={() => { setMenuOpen(false); handleSendDislike(user); }}><HeartOff /><span>{t('discovery.dislike')}</span></button>
        <button type="button" aria-pressed={blocked} onClick={() => { setMenuOpen(false); handleBlock(user); }}><ShieldBan /><span>{t('discovery.block')}</span></button>
      </div>
    </Sheet>}
  </article>;
}
