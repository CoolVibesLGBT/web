import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Check, CheckCircle2, HandCoins, Loader2, Plus, Wallet } from 'lucide-react';
import { useNavigate } from '@/router';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { FormField, Sheet } from '@/components/ui/Interface';
import './tip-dialog.css';
import LottieAnimation from '@/features/animations/LottieAnimation';

interface TipButtonProps {
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  recipientUsername?: string;
  onTipSuccess?: (amount: number) => void;
  trigger?: React.ReactNode;
  className?: string;
}

// Original Telegram gift artwork, grouped by tip amount (not subscription duration).
const giftAsset = (amount: number) => `/animations/telegram/assets/Gift${amount >= 10 ? 12 : amount >= 2 ? 6 : 3}.json`;

const tipAmounts = [.1, .25, .5, .75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.5, 4, 4.5, 5, 10, 20, 30, 40, 50, 75, 100];

export default function TipButton({ recipientId, recipientName, recipientAvatar, recipientUsername, onTipSuccess, trigger, className = '' }: TipButtonProps) {
  const { t, i18n } = useTranslation('common');
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [successAmount, setSuccessAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [hoveredAmount, setHoveredAmount] = useState<number | null>(null);
  const money = useMemo(() => new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'USD' }), [i18n.language]);
  const balanceValue = Number(user?.balance ?? 0);
  const balance = Number.isFinite(balanceValue) ? Math.max(0, balanceValue) : 0;
  const amount = customMode ? Number(customAmount) : selectedAmount ?? 0;
  const validAmount = Number.isFinite(amount) && amount > 0;
  const insufficient = validAmount && amount > balance;
  const canSubmit = validAmount && !insufficient && !processing && successAmount === null;

  const show = () => {
    if (processing) return;
    setSelectedAmount(null);
    setCustomAmount('');
    setCustomMode(false);
    setSuccessAmount(null);
    setError(null);
    setAvatarFailed(false);
    setOpen(true);
  };
  const submit = async () => {
    if (!canSubmit) return;
    setProcessing(true);
    setError(null);
    try {
      const response = await api.handleSendTip(recipientId, amount);
      if (response?.success === false) throw new Error(t('tips.failed'));
      if (response?.balance !== undefined && response.balance !== null) {
        const nextBalance = Number(response.balance);
        if (Number.isFinite(nextBalance)) updateUser({ balance: nextBalance });
      }
      setSuccessAmount(amount);
      onTipSuccess?.(amount);
    } catch (failure) {
      const response = (failure as { response?: { data?: { message?: string } } })?.response?.data;
      setError(response?.message || t('tips.failed'));
    } finally {
      setProcessing(false);
    }
  };
  const onTrigger = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    show();
  };

  return <>
    {trigger ? <div className={className} onClick={onTrigger}>
      {React.isValidElement(trigger) ? React.cloneElement(trigger as React.ReactElement<{ onClick?: React.MouseEventHandler }>, { onClick: onTrigger }) : trigger}
    </div> : <button type="button" className={`cv-tip-trigger cv-list-hover ${className}`} onClick={onTrigger} aria-label={t('tips.title')}><HandCoins aria-hidden="true" /><span>{t('tips.title')}</span></button>}
    {typeof document !== 'undefined' && createPortal(
      <div onClick={event => event.stopPropagation()} onPointerDown={event => event.stopPropagation()}>
        <Sheet isOpen={open} onClose={() => setOpen(false)} title={t(successAmount === null ? 'tips.title' : 'tips.sent')} className="cv-panel-sheet cv-tip-dialog" actions={
          successAmount !== null
            ? <button type="button" className="cv-btn cv-btn-branded" onClick={() => setOpen(false)}>{t('app.close')}</button>
            : insufficient ? <div className="cv-tip-funding">
                <p role="status">{t('tips.insufficient')}</p>
                <button type="button" className="cv-btn cv-btn-branded" onClick={() => { setOpen(false); navigate('/wallet'); }}><Wallet aria-hidden="true" />{t('wallet.deposit')}</button>
              </div>
            : <button type="button" className="cv-btn cv-btn-branded" disabled={!canSubmit} aria-busy={processing} onClick={() => void submit()}>{processing ? <><Loader2 className="cv-tip-spinner" aria-hidden="true" />{t('wallet.processing')}</> : <>{t('tips.title')} · <bdi>{money.format(validAmount ? amount : 0)}</bdi></>}</button>
        }>
          {successAmount !== null ? <div className="cv-tip-success" role="status"><LottieAnimation src={giftAsset(successAmount)} size={120} /><CheckCircle2 aria-hidden="true" /><strong><bdi>{money.format(successAmount)}</bdi></strong><span>{recipientName}</span></div> : <>
            <div className="cv-tip-recipient">
              {recipientAvatar && !avatarFailed ? <img src={recipientAvatar} alt="" onError={() => setAvatarFailed(true)} /> : <span className="cv-tip-avatar" aria-hidden="true">{recipientName.slice(0, 1).toUpperCase()}</span>}
              <div><strong>{recipientName}</strong>{recipientUsername && <span dir="auto">@{recipientUsername}</span>}</div>
            </div>
            <div className="cv-tip-balance"><span>{t('wallet.available_balance')}</span><bdi>{money.format(balance)}</bdi></div>
            <fieldset className="cv-tip-amounts" disabled={processing}>
              <legend>{t('wallet.select_amount')}</legend>
              <div className="cv-tip-amount-grid">
                {tipAmounts.map(value => {
                  const selected = !customMode && selectedAmount === value;
                  return <button type="button" key={value} aria-pressed={selected} onMouseEnter={() => setHoveredAmount(value)} onMouseLeave={() => setHoveredAmount(null)} onFocus={() => setHoveredAmount(value)} onBlur={() => setHoveredAmount(null)} onClick={() => { setSelectedAmount(selected ? null : value); setCustomMode(false); setError(null); }}>
                    <span className="cv-tip-gift-art"><LottieAnimation src={giftAsset(value)} size={84} autoplay={selected || hoveredAmount === value} /></span>
                    <span className="cv-tip-gift-price"><bdi>{money.format(value)}</bdi></span>
                    {selected && <span className="cv-tip-gift-check" aria-hidden="true"><Check /></span>}
                  </button>;
                })}
              </div>
              <button type="button" className="cv-tip-custom-choice cv-list-hover" aria-pressed={customMode} onClick={() => { setCustomMode(true); setError(null); }}><Plus aria-hidden="true" /><span>{t('wallet.custom_amount')}</span>{customMode && <Check aria-hidden="true" />}</button>
              {customMode && <div className="cv-tip-custom">
                <FormField label={`${t('wallet.custom_amount')} (USD)`}>
                  <input type="text" inputMode="decimal" autoComplete="off" value={customAmount} onChange={event => {
                    const value = event.target.value.replace(',', '.');
                    if (/^\d*(\.\d{0,2})?$/.test(value)) { setCustomAmount(value); setError(null); }
                  }} />
                </FormField>
                <div className="cv-tip-ratios">{[.25, .5, .75, 1].map(ratio => <button type="button" key={ratio} disabled={balance <= 0} onClick={() => { setCustomAmount((balance * ratio).toFixed(2)); setError(null); }}>{ratio * 100}%</button>)}</div>
              </div>}
            </fieldset>
            {error && <p className="cv-tip-error" role="alert">{error}</p>}
          </>}
        </Sheet>
      </div>, document.body
    )}
  </>;
}
