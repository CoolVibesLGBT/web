import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  Heart,
  MapPin,
  MessageCircle,
  Send,
  SlidersHorizontal,
  Users,
} from 'lucide-react'
import CharacterPortrait from './CharacterPortrait'

const portraits = Array.from({ length: 6 }, (_, index) => index)

export default function ProductPreview({ onJoin }: { onJoin: () => void }) {
  const { t } = useTranslation('landing')
  const demoPeople = [
    {
      name: 'Ren',
      age: 27,
      photo: portraits[0],
      interests: t('person_1_bio'),
      tag: t('person_1_tag'),
    },
    {
      name: 'Alex',
      age: 26,
      photo: portraits[2],
      interests: t('person_2_bio'),
      tag: t('person_2_tag'),
    },
    {
      name: 'Luca',
      age: 29,
      photo: portraits[5],
      interests: t('person_3_bio'),
      tag: t('person_3_tag'),
    },
  ]

  const [tab, setTab] = useState('discover')
  const [personIndex, setPersonIndex] = useState(0)
  const [liked, setLiked] = useState(false)
  const person = demoPeople[personIndex]

  return (
    <div className="cv-landing-preview">
      <div
        className="cv-landing-preview-tabs"
        role="tablist"
        aria-label={t('preview_label')}
      >
        {[
          { id: 'discover', label: t('tab_discover'), icon: Users },
          { id: 'match', label: t('tab_match'), icon: Heart },
          { id: 'chat', label: t('tab_chat'), icon: MessageCircle },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            id={`preview-tab-${id}`}
            aria-selected={tab === id}
            tabIndex={tab === id ? 0 : -1}
            aria-controls="preview-panel"
            onKeyDown={(event) => {
              const tabs = ['discover', 'match', 'chat']
              const direction =
                event.key === 'ArrowRight'
                  ? 1
                  : event.key === 'ArrowLeft'
                    ? -1
                    : 0
              if (!direction && event.key !== 'Home' && event.key !== 'End')
                return
              event.preventDefault()
              const next =
                event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? 2
                    : (tabs.indexOf(tab) + direction + tabs.length) %
                      tabs.length
              setTab(tabs[next])
              document.getElementById(`preview-tab-${tabs[next]}`)?.focus()
            }}
            onClick={() => setTab(id)}
            className={tab === id ? 'is-active' : ''}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
      <div
        id="preview-panel"
        role="tabpanel"
        aria-labelledby={`preview-tab-${tab}`}
        className="cv-landing-preview-body"
      >
        {tab === 'discover' && (
          <>
            <div className="cv-landing-preview-heading">
              <span>{t('preview_heading')}</span>
              <SlidersHorizontal size={17} />
            </div>
            <div className="cv-landing-people-grid">
              {[0, 2, 1].map((photoIndex, index) => (
                <button
                  key={photoIndex}
                  className="cv-landing-mini-profile"
                  onClick={onJoin}
                  aria-label={t('profile_join', {
                    name: ['Ren', 'Alex', 'Wei'][index],
                  })}
                >
                  <CharacterPortrait character={portraits[photoIndex]} />
                  <span>
                    {['Ren, 27', 'Alex, 26', 'Wei, 25'][index]}
                    <small>
                      <MapPin size={10} />{' '}
                      {['Tokyo', 'Berlin', 'Shanghai'][index]}
                    </small>
                  </span>
                </button>
              ))}
            </div>
            <button className="cv-landing-preview-action" onClick={onJoin}>
              {t('find_people')}
              <ArrowRight size={18} />
            </button>
          </>
        )}
        {tab === 'match' && (
          <div className="cv-landing-match-demo">
            <CharacterPortrait
              character={person.photo}
              label={t('character_label')}
            />
            <div className="cv-landing-match-copy">
              <strong>
                {person.name}, {person.age}
              </strong>
              <p>{person.interests}</p>
              <small>{person.tag}</small>
            </div>
            <div className="cv-landing-match-actions">
              <button
                aria-label={t('next_profile')}
                onClick={() => {
                  setPersonIndex((personIndex + 1) % demoPeople.length)
                  setLiked(false)
                }}
              >
                <ArrowRight size={20} />
              </button>
              <button
                aria-label={liked ? t('unlike') : t('like')}
                aria-pressed={liked}
                onClick={() => setLiked(!liked)}
                className={liked ? 'is-liked' : ''}
              >
                <Heart size={21} fill={liked ? 'currentColor' : 'none'} />
              </button>
            </div>
            <span className="cv-landing-demo-feedback" aria-live="polite">
              {liked ? t('liked_feedback') : t('match_feedback')}
            </span>
          </div>
        )}
        {tab === 'chat' && (
          <div className="cv-landing-chat-demo">
            <div className="cv-landing-chat-person">
              <CharacterPortrait character={portraits[0]} />
              <span>
                Ren<small>{t('chat_tagline')}</small>
              </span>
              <Heart size={18} />
            </div>
            <p className="cv-landing-chat-bubble">{t('chat_1')}</p>
            <p className="cv-landing-chat-bubble is-own">{t('chat_2')}</p>
            <p className="cv-landing-chat-bubble">{t('chat_3')}</p>
            <button className="cv-landing-chat-input" onClick={onJoin}>
              {t('chat_input')}
              <Send size={17} />
            </button>
          </div>
        )}
      </div>
      <div className="cv-landing-demo-label">
        <span /> {t('demo_label')}
      </div>
    </div>
  )
}
