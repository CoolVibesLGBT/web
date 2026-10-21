import type { ReactNode } from 'react';
import { UserRound } from 'lucide-react';
import './profile.css';

interface ProfileHeaderProps {
  displayName: string;
  username: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  blurMedia?: boolean;
  actions: ReactNode;
  children: ReactNode;
}

export default function ProfileHeader({ displayName, username, avatarUrl, coverUrl, blurMedia, actions, children }: ProfileHeaderProps) {
  return (
    <header className="cv-profile-header">
      {coverUrl && (
        <div className="cv-profile-cover">
          <img src={coverUrl} alt="" className={blurMedia ? 'blur-xl' : undefined} />
        </div>
      )}
      <div className="cv-profile-summary">
        <div className="cv-profile-identity">
          <div className="cv-profile-avatar">
            {avatarUrl
              ? <img src={avatarUrl} alt="" width={96} height={96} className={blurMedia ? 'blur-xl' : undefined} />
              : <UserRound aria-hidden="true" />}
          </div>
          <div className="cv-profile-name">
            <h1><bdi>{displayName || username}</bdi></h1>
            <p><bdi>@{username}</bdi></p>
          </div>
        </div>
        <div className="cv-profile-actions">{actions}</div>
        {children}
      </div>
    </header>
  );
}
