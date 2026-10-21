import AnimatedEmptyState from '@/components/ui/AnimatedEmptyState';
import { useMemo, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useNavigate } from '@/router';
import { useTranslation } from 'react-i18next';
import { Check, Copy, Share, Users, Link, Gift } from 'lucide-react';
import { GroupedSection, ListRow } from '@/components/ui/Interface';
import { useAuth } from '@/contexts/AuthContext';
import useClipboard from '@/hooks/useClipboard';
import ClipboardFeedback from '@/features/chat/ClipboardFeedback';
import { getSafeImageURLEx } from '@/helpers/helpers';
import { DEFAULT_TOKEN_SYMBOL } from '@/constants/constants';
import './referrals.css';

interface ReferralEngagement {
 id?: string;
 kind?: string;
 created_at?: string;
 details?: { amount?: number };
 engager?: { id?: string; public_id?: number | string; username?: string; avatar?: string | null };
}

export default function ReferralsScreen() {
 const { user } = useAuth();
 const navigate = useNavigate();
 const { t, i18n } = useTranslation('common');
 const clipboard = useClipboard();
 const [scrollParent, setScrollParent] = useState<HTMLDivElement | null>(null);
 const referralCode = user?.public_id?.toString() ?? '';
 const referralLink = `https://coolvibes.lgbt/ref/${referralCode}`;
 const history = useMemo(() => user?.engagements?.engagement_details?.filter((item: ReferralEngagement) => item.kind === 'referral') || [], [user?.engagements?.engagement_details]);
 const number = (value: number) => new Intl.NumberFormat(i18n.language).format(value);
 const copy = () => { if (referralCode) void clipboard.copy(referralLink); };
 const share = async () => {
  if (!referralCode) return;
  if (!navigator.share) { copy(); return; }
  try { await navigator.share({ title: t('referrals.invite_title'), text: t('referrals.invite_subtitle', { token: DEFAULT_TOKEN_SYMBOL }), url: referralLink }); }
  catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) copy(); }
 };
 const steps = [
  { title: t('referrals.step_send'), description: t('referrals.step_send_desc') },
  { title: t('referrals.step_join'), description: t('referrals.step_join_desc') },
  { title: t('referrals.step_reward'), description: t('referrals.step_reward_desc', { token: DEFAULT_TOKEN_SYMBOL }) },
 ];
 return <div ref={setScrollParent} className="skyline-page-scroll cv-referrals">
  <div className="cv-referrals-content">
   <GroupedSection title={t('referrals.invite_title')} footer={t('referrals.invite_subtitle', { token: DEFAULT_TOKEN_SYMBOL })}>
    <ListRow icon={<Link />} title={<bdi className="cv-referrals-link">{referralLink}</bdi>} description={t('chat_actions.copy')} onClick={referralCode ? copy : undefined} accessory={<Copy />} />
    <div className="cv-referrals-actions">
     <button type="button" className="cv-btn cv-btn-secondary" disabled={!referralCode} onClick={copy}>{clipboard.status === 'copied' ? <Check /> : <Copy />}{t(clipboard.status === 'copied' ? 'chat_actions.copied' : 'chat_actions.copy')}</button>
     <button type="button" className="cv-btn cv-btn-branded" disabled={!referralCode} onClick={() => void share()}><Share />{t('referrals.share')}</button>
    </div>
   </GroupedSection>
   <GroupedSection title={t('referrals.reward_status')}>
    <ListRow icon={<Users />} title={t('referrals.invited')} description={t('referrals.successful_registrations')} value={number(user?.engagements?.counts?.referral_count || 0)} />
    <ListRow icon={<Gift />} title={t('referrals.tokens')} description={t('referrals.total_rewards')} value={`${number(user?.engagements?.counts?.referral_amount || 0)} ${DEFAULT_TOKEN_SYMBOL}`} />
   </GroupedSection>
   <GroupedSection title={t('referrals.how_it_works')}>
    {steps.map((step, index) => <ListRow key={index} icon={<span className="cv-referrals-step">{number(index + 1)}</span>} title={step.title} description={step.description} />)}
   </GroupedSection>
   <GroupedSection title={t('referrals.recent_title')}>
    {history.length ? <div className="cv-referrals-history"><Virtuoso defaultItemHeight={64} customScrollParent={scrollParent || undefined} data={history} computeItemKey={(index, item: ReferralEngagement) => item.id || index} itemContent={(_, item: ReferralEngagement) => {
     const username = item.engager?.username;
     const avatar = getSafeImageURLEx(item.engager?.public_id, item.engager?.avatar || undefined, 'thumbnail');
     const date = item.created_at ? new Date(item.created_at) : null;
     return <ListRow icon={<span className="cv-referrals-avatar">{avatar ? <img src={avatar} alt="" /> : (username || '?').charAt(0)}</span>} title={<bdi>{username || t('messages.user')}</bdi>} description={date && Number.isFinite(date.getTime()) ? date.toLocaleDateString(i18n.language) : undefined} value={`${number(item.details?.amount || 0)} ${DEFAULT_TOKEN_SYMBOL}`} onClick={username ? () => navigate(`/${encodeURIComponent(username)}`) : undefined} />;
    }} /></div> : <AnimatedEmptyState title={t('referrals.no_referrals')} description={t('referrals.no_referrals_desc')} />}
   </GroupedSection>
  </div>
  <ClipboardFeedback status={clipboard.status} link />
 </div>;
}
