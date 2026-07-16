# CoolVibes Web

Web client for **CoolVibes** — an inclusive LGBTIQA+ social and dating platform.

**Live:** [coolvibes.lgbt](https://coolvibes.lgbt)

## Quick start

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000). Use `yarn build` for production and `yarn start` to run the production server locally.

## Tech stack

- **Next.js (App Router)** + **React 19** + **TypeScript**
- **Tailwind CSS** for styling
- **Next.js routing** (catch-all route delegates to the existing screen system)
- **i18next** for translations

## Environment

Optional: copy `.env.example` to `.env` and set any `NEXT_PUBLIC_*` variables for local overrides. In production, API and socket URLs are chosen by hostname (e.g. `coolvibes.lgbt`).

## Project structure

- `src/app/` — Next.js App Router entry points (`layout.tsx`, `head.tsx`, catch-all route)
- `src/features/` — domain modules (auth, editor, map, profile, post, …)
- `src/components/` — shared UI
- `src/contexts/`, `src/hooks/`, `src/services/` — app-wide logic and API
- `src/screens/` — route-level screens rendered by the catch-all route
- `src/locales/` — i18n JSON

See [AGENTS.md](./AGENTS.md) for contributor guidelines and conventions.

## About

Privacy-first, open-source social network for the LGBTIQ+ community. No tracking, no ads.

---

MIT Licensed · Made with ❤️ for the LGBTIQ+ community



## 🏳️‍🌈 Classifieds — Community Listings

A safe, inclusive, and supportive space for LGBTQI+ individuals to share opportunities, find housing, connect with others, and grow together.  
Each section is designed to promote equality, safety, and solidarity within our global queer community. 💫

---

---

> 💡 _This Classifieds section is part of a community-driven effort to empower LGBTQI+ people through inclusivity, safety, and shared opportunities._

### 🏠 Housing & Roommates
Find or offer safe and LGBTQ+ friendly living spaces.
- **Roommate Wanted** 🏡  
- **Safe Housing / Shelter** 🛏️  
- **Short-term Stay / Couchsurfing**  
- **LGBTQ+ Flatshare**  
- **Relocation Help**

---

### 💼 Jobs & Opportunities
Discover inclusive job offers and collaboration projects.
- **LGBTQ+ Friendly Jobs** 💼  
- **Remote / Freelance Gigs**  
- **Volunteering & Activism**  
- **Creative Collaboration (art, film, music)**  
- **Mentorship & Networking**

---

### ❤️ Community & Support
Join groups, meetups, and support circles to connect with others.
- **Emotional Support Groups** 🫶  
- **Coming Out Stories** 💬  
- **LGBTQ+ Meetups / Events** 🎉  
- **Support for Trans / Non-Binary Individuals**  
- **Peer Counseling**

---

### 💬 Friendship & Dating
Create meaningful connections in a safe environment.
- **Friendship & Social Circles** 🏳️‍🌈  
- **Dating / Romantic Connections** 💞  
- **Long-distance Penpals** ✉️  
- **Travel Buddy** 🌍  
- **LGBTQ+ Couples’ Community**

---

### 🩺 Health & Wellbeing
Access resources for mental, sexual, and physical health.
- **LGBTQ+ Friendly Clinics** 🏥  
- **Free HIV / STD Testing**  
- **Trans Health & Hormone Info**  
- **Mental Health Resources** 🧠  
- **Wellness & Self-care**

---

### 🎭 Arts & Expression
A space to share creativity and visibility through art.
- **LGBTQ+ Artists & Creators** 🎨  
- **Exhibitions / Film / Music Events**  
- **Creative Collaborations**  
- **Open Calls & Auditions** 🎤  
- **Art for Activism**

---

### ⚖️ Legal & Advocacy
Find help for rights, legal support, and advocacy.
- **Legal Aid & Human Rights** ⚖️  
- **Name / Gender Change Help**  
- **Immigration / Asylum Support**  
- **LGBTQ+ Rights Campaigns**  
- **Anti-Discrimination Reports**

---

### 🧩 Miscellaneous / Other
Everything else that strengthens our community.
- **Lost & Found Items**  
- **LGBTQ+ Book / Media Exchange**  
- **Language Exchange**  
- **Volunteer for Research / Surveys**  
- **Community Announcements**

---

### 🏷️ Suggested Tags
Use these hashtags to make your posts easier to find:


Report
We want to protect our community and make sure you feel safe. Don’t worry, your feedback is anonymous and they won’t know that you’ve blocked or reported them.

Fake profile
Inappropriate content
Scam or commercial
Identity-based hate
Off Badoo behavior
Underage
I’m just not interested


Block
Are you sure?
Block to stop them from messaging you. Block and report if something’s wrong or unsafe.
Yes, Block
Block And Report





How tall are you?
Switch to inches
inches
I’d rather not say



What's your relationship status?
Single
Taken
It’s complicated
Open
I’d rather not say

What’s your sexual orientation?
Straight
Gay
Lesbian
Bisexual
Asexual
Demisexual
Pansexual
Queer
Questioning
I’d rather not say

How do you feel about kids?
I’d like them someday
I’d like them soon
I don’t want kids
I already have kids
I’d rather not say

Do you smoke?
Yes
No
Sometimes
I’d rather not say

Do you drink?
Socially
Never
Often
No, I’m sober
I’d rather not say


Star Sign
What’s your star sign?
Aries
Taurus
Gemini
Cancer
Leo
Virgo
Libra
Scorpio
Sagittarius
Capricorn
Aquarius
Pisces
I’d rather not say

Pets
Do you have pets?
Cat(s)
Dog(s)
Both cats and dogs
Other animals
No pets
I’d rather not say

Education Level
What level of education do you have?
High school
Graduate degree or higher
In grad school
In college
Undergraduate degree
I’d rather not say


Religion
What’s your religion?
Agnostic
Atheist
Buddhist
Catholic
Christian
Hindu
Jain
Jewish
Mormon
Muslim
Zoroastrian
Sikh
Spiritual
Other
I’d rather not say


Personality
Are you an introvert or an extrovert?
Introvert
Extrovert
Somewhere in between
I’d rather not say


INTERESTS

[
    {
        "$gpb": "Group",
        "group_id": 1,
        "name": "Entertainment",
        "item_preview_count": 8
    },
    {
        "$gpb": "Group",
        "group_id": 2,
        "name": "Film and TV",
        "item_preview_count": 8
    },
    {
        "$gpb": "Group",
        "group_id": 3,
        "name": "Food and drink",
        "item_preview_count": 8
    },
    {
        "$gpb": "Group",
        "group_id": 4,
        "name": "Going out",
        "item_preview_count": 8
    },
    {
        "$gpb": "Group",
        "group_id": 5,
        "name": "Lifestyle",
        "item_preview_count": 8
    },
    {
        "$gpb": "Group",
        "group_id": 6,
        "name": "Music",
        "item_preview_count": 8
    },
    {
        "$gpb": "Group",
        "group_id": 7,
        "name": "Reading and books",
        "item_preview_count": 8
    },
    {
        "$gpb": "Group",
        "group_id": 8,
        "name": "Self-care",
        "item_preview_count": 0
    },
    {
        "$gpb": "Group",
        "group_id": 9,
        "name": "Skills and hobbies",
        "item_preview_count": 8
    },
    {
        "$gpb": "Group",
        "group_id": 10,
        "name": "Sports and fitness",
        "item_preview_count": 8
    },
    {
        "$gpb": "Group",
        "group_id": 11,
        "name": "Technology",
        "item_preview_count": 0
    },
    {
        "$gpb": "Group",
        "group_id": 12,
        "name": "Travel",
        "item_preview_count": 8
    },
    {
        "$gpb": "Group",
        "group_id": 13,
        "name": "Values",
        "item_preview_count": 0
    }
]


[
    {
        "$gpb": "Interest",
        "interest_id": 247,
        "name": "3D printing",
        "group_id": 11,
        "emoji": "🖨️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 175,
        "name": "Acting",
        "group_id": 9,
        "emoji": "🎭",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 21,
        "name": "Action films",
        "group_id": 2,
        "emoji": "🏃",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 253,
        "name": "Adventure",
        "group_id": 12,
        "emoji": "⛰️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 125,
        "name": "Afrobeats",
        "group_id": 6,
        "emoji": "🥁",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 249,
        "name": "AI",
        "group_id": 11,
        "emoji": "🧠",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 88,
        "name": "Animal lover",
        "group_id": 5,
        "emoji": "🐱",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 14,
        "name": "Animated films",
        "group_id": 2,
        "emoji": "✏️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 18,
        "name": "Anime",
        "group_id": 2,
        "emoji": "💢",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 150,
        "name": "Aromatherapy",
        "group_id": 8,
        "emoji": "🧴",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 85,
        "name": "Art admirer",
        "group_id": 5,
        "emoji": "🎨",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 159,
        "name": "Arts and crafts",
        "group_id": 9,
        "emoji": "✂️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 81,
        "name": "Astrology",
        "group_id": 5,
        "emoji": "⭐️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 165,
        "name": "Astronomy",
        "group_id": 9,
        "emoji": "🌌",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 210,
        "name": "Athletics",
        "group_id": 10,
        "emoji": "🎽",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 228,
        "name": "Badminton",
        "group_id": 10,
        "emoji": "🏸",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 45,
        "name": "Baking expert",
        "group_id": 3,
        "emoji": "🍰",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 41,
        "name": "Barbecues",
        "group_id": 3,
        "emoji": "🍖",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 97,
        "name": "Bargain hunter",
        "group_id": 5,
        "emoji": "💰",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 72,
        "name": "Bars",
        "group_id": 4,
        "emoji": "🥂",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 206,
        "name": "Baseball",
        "group_id": 10,
        "emoji": "⚾️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 212,
        "name": "Basketball",
        "group_id": 10,
        "emoji": "🏀",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 260,
        "name": "Beach holidays",
        "group_id": 12,
        "emoji": "🏖",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 49,
        "name": "Beer",
        "group_id": 3,
        "emoji": "🍺",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 189,
        "name": "Best dancer",
        "group_id": 9,
        "emoji": "💃",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 131,
        "name": "Big bookworm",
        "group_id": 7,
        "emoji": "📚",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 140,
        "name": "Biographies",
        "group_id": 7,
        "emoji": "📖",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 167,
        "name": "Bird watching",
        "group_id": 9,
        "emoji": "🦅",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 272,
        "name": "Black Lives Matter",
        "group_id": 13,
        "emoji": "🖤",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 190,
        "name": "Blogging",
        "group_id": 9,
        "emoji": "💻",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 7,
        "name": "Board games",
        "group_id": 1,
        "emoji": "🎲",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 264,
        "name": "Boat cruises",
        "group_id": 12,
        "emoji": "🛳️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 271,
        "name": "Body positivity",
        "group_id": 13,
        "emoji": "👏",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 219,
        "name": "Bodybuilding",
        "group_id": 10,
        "emoji": "🏋️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 12,
        "name": "Bollywood",
        "group_id": 2,
        "emoji": "🇮🇳",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 141,
        "name": "Book clubs",
        "group_id": 7,
        "emoji": "🔖",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 64,
        "name": "Bottomless brunch",
        "group_id": 4,
        "emoji": "🍾",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 11,
        "name": "Bowling",
        "group_id": 1,
        "emoji": "🎳",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 237,
        "name": "Boxing",
        "group_id": 10,
        "emoji": "🥊",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 54,
        "name": "Bubble tea",
        "group_id": 3,
        "emoji": "🥤",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 259,
        "name": "Camping",
        "group_id": 12,
        "emoji": "🏕",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 4,
        "name": "Card games",
        "group_id": 1,
        "emoji": "♠️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 215,
        "name": "Cardio",
        "group_id": 10,
        "emoji": "🏃",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 257,
        "name": "Carefree traveller",
        "group_id": 12,
        "emoji": "🌎",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 29,
        "name": "Cartoons",
        "group_id": 2,
        "emoji": "🤠",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 169,
        "name": "Chemistry",
        "group_id": 9,
        "emoji": "🧪",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 176,
        "name": "Chess player",
        "group_id": 9,
        "emoji": "♟",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 43,
        "name": "Chocolate fan",
        "group_id": 3,
        "emoji": "🍫",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 186,
        "name": "Circus skills",
        "group_id": 9,
        "emoji": "🎪",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 261,
        "name": "City explorer",
        "group_id": 12,
        "emoji": "🔎",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 144,
        "name": "Classic fiction",
        "group_id": 7,
        "emoji": "🕯️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 117,
        "name": "Classical music",
        "group_id": 6,
        "emoji": "🎹",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 168,
        "name": "Climbing",
        "group_id": 9,
        "emoji": "🧗‍♂️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 74,
        "name": "Clubbing",
        "group_id": 4,
        "emoji": "🔊",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 47,
        "name": "Cocktails",
        "group_id": 3,
        "emoji": "🍹",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 57,
        "name": "Coffee shops",
        "group_id": 4,
        "emoji": "☕",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 38,
        "name": "Coffee-fuelled",
        "group_id": 3,
        "emoji": "☕️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 166,
        "name": "Collecting art",
        "group_id": 9,
        "emoji": "🖼",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 138,
        "name": "Comic books",
        "group_id": 7,
        "emoji": "💥",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 68,
        "name": "Concerts",
        "group_id": 4,
        "emoji": "🎫",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 183,
        "name": "Content creator",
        "group_id": 9,
        "emoji": "🤳🏼",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 56,
        "name": "Cooking",
        "group_id": 3,
        "emoji": "🥘",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 16,
        "name": "Cooking shows",
        "group_id": 2,
        "emoji": "🍳",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 8,
        "name": "Cosplay",
        "group_id": 1,
        "emoji": "🧚",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 258,
        "name": "Country escapes",
        "group_id": 12,
        "emoji": "🌳",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 127,
        "name": "Country music",
        "group_id": 6,
        "emoji": "🪕",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 154,
        "name": "Creating playlists",
        "group_id": 9,
        "emoji": "▶️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 172,
        "name": "Creative soul",
        "group_id": 9,
        "emoji": "💫",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 222,
        "name": "Cricket",
        "group_id": 10,
        "emoji": "🏏",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 196,
        "name": "Crocheting",
        "group_id": 9,
        "emoji": "🧶",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 78,
        "name": "Crystals",
        "group_id": 5,
        "emoji": "🔮",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 94,
        "name": "Cuddle lover",
        "group_id": 5,
        "emoji": "💕",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 244,
        "name": "Cycling",
        "group_id": 10,
        "emoji": "🚲",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 110,
        "name": "Dance beats",
        "group_id": 6,
        "emoji": "🎉",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 208,
        "name": "Darts",
        "group_id": 10,
        "emoji": "🎯",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 62,
        "name": "Dating",
        "group_id": 4,
        "emoji": "🍴",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 128,
        "name": "Desi",
        "group_id": 6,
        "emoji": "🪕",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 179,
        "name": "Designing",
        "group_id": 9,
        "emoji": "✏️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 61,
        "name": "Dinner with friends",
        "group_id": 4,
        "emoji": "🍜",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 129,
        "name": "Disco",
        "group_id": 6,
        "emoji": "🕺",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 192,
        "name": "DIY projects",
        "group_id": 9,
        "emoji": "🔨",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 130,
        "name": "DJing",
        "group_id": 6,
        "emoji": "🎛️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 20,
        "name": "Documentaries",
        "group_id": 2,
        "emoji": "🎥",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 70,
        "name": "Drag shows",
        "group_id": 4,
        "emoji": "👠",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 96,
        "name": "Dream chaser",
        "group_id": 5,
        "emoji": "💭",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 58,
        "name": "Eating out",
        "group_id": 4,
        "emoji": "🍽",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 124,
        "name": "EDM",
        "group_id": 6,
        "emoji": "🤖",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 246,
        "name": "Electronics",
        "group_id": 11,
        "emoji": "🖥️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 266,
        "name": "Environmentalism",
        "group_id": 13,
        "emoji": "🌿",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 221,
        "name": "Exercising",
        "group_id": 10,
        "emoji": "🏋️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 134,
        "name": "Fantasy books",
        "group_id": 7,
        "emoji": "🐉",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 22,
        "name": "Fantasy films",
        "group_id": 2,
        "emoji": "🐉",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 40,
        "name": "Fast food",
        "group_id": 3,
        "emoji": "🍕",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 265,
        "name": "Feminism",
        "group_id": 13,
        "emoji": "💜",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 65,
        "name": "Festivals",
        "group_id": 4,
        "emoji": "🎊",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 17,
        "name": "Film fanatic",
        "group_id": 2,
        "emoji": "🍿",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 161,
        "name": "Fishing",
        "group_id": 9,
        "emoji": "🎣",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 229,
        "name": "Fitness enthusiast",
        "group_id": 10,
        "emoji": "👟",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 155,
        "name": "Flea markets",
        "group_id": 9,
        "emoji": "👕",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 205,
        "name": "Football",
        "group_id": 10,
        "emoji": "⚽️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 239,
        "name": "Frisbee",
        "group_id": 10,
        "emoji": "🥏",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 100,
        "name": "Full-time raver",
        "group_id": 5,
        "emoji": "🤘",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 142,
        "name": "Funny books",
        "group_id": 7,
        "emoji": "😆",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 30,
        "name": "Funny films",
        "group_id": 2,
        "emoji": "🤣",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 71,
        "name": "Galleries",
        "group_id": 4,
        "emoji": "🖼️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 28,
        "name": "Game shows",
        "group_id": 2,
        "emoji": "🕹️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 162,
        "name": "Gaming fan",
        "group_id": 9,
        "emoji": "🎮",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 181,
        "name": "Gardening pro",
        "group_id": 9,
        "emoji": "🌿",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 160,
        "name": "Geology",
        "group_id": 9,
        "emoji": "🌋",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 178,
        "name": "Gifted writer",
        "group_id": 9,
        "emoji": "✍️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 66,
        "name": "Gigs",
        "group_id": 4,
        "emoji": "🎟️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 48,
        "name": "Gin",
        "group_id": 3,
        "emoji": "🍸",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 203,
        "name": "Go-karting",
        "group_id": 10,
        "emoji": "🏎️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 158,
        "name": "Golf",
        "group_id": 9,
        "emoji": "⛳️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 194,
        "name": "Great cook",
        "group_id": 9,
        "emoji": "🧑‍🍳",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 232,
        "name": "Gym lover",
        "group_id": 10,
        "emoji": "💪",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 234,
        "name": "Gymnastics",
        "group_id": 10,
        "emoji": "🤸",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 105,
        "name": "Hair and beauty",
        "group_id": 5,
        "emoji": "💄",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 86,
        "name": "Happy homebody",
        "group_id": 5,
        "emoji": "🏠",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 106,
        "name": "Hard worker",
        "group_id": 5,
        "emoji": "🗓️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 53,
        "name": "Healthy food",
        "group_id": 3,
        "emoji": "🥦",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 240,
        "name": "Hiking",
        "group_id": 10,
        "emoji": "🥾",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 113,
        "name": "Hip hop",
        "group_id": 6,
        "emoji": "🎧",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 133,
        "name": "Historical fiction",
        "group_id": 7,
        "emoji": "🎩",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 224,
        "name": "Hockey",
        "group_id": 10,
        "emoji": "🏑",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 135,
        "name": "Horror books",
        "group_id": 7,
        "emoji": "👻",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 24,
        "name": "Horror films",
        "group_id": 2,
        "emoji": "👻",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 188,
        "name": "Horse riding",
        "group_id": 9,
        "emoji": "🐴",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 122,
        "name": "House tunes",
        "group_id": 6,
        "emoji": "📀",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 267,
        "name": "Human rights",
        "group_id": 13,
        "emoji": "✊",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 225,
        "name": "Ice hockey",
        "group_id": 10,
        "emoji": "🏒",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 177,
        "name": "Ice skating",
        "group_id": 9,
        "emoji": "⛸️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 116,
        "name": "Indie",
        "group_id": 6,
        "emoji": "🎸",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 19,
        "name": "Indie films",
        "group_id": 2,
        "emoji": "🎞️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 118,
        "name": "Jazz",
        "group_id": 6,
        "emoji": "🎺",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 255,
        "name": "Jet-setter",
        "group_id": 12,
        "emoji": "✈️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 148,
        "name": "Journalling",
        "group_id": 8,
        "emoji": "🖊",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 35,
        "name": "K-Dramas",
        "group_id": 2,
        "emoji": "🤯",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 112,
        "name": "K-Pop",
        "group_id": 6,
        "emoji": "🎤",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 67,
        "name": "Karaoke",
        "group_id": 4,
        "emoji": "🎤",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 197,
        "name": "Knitting",
        "group_id": 9,
        "emoji": "🧶",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 121,
        "name": "Latin",
        "group_id": 6,
        "emoji": "💃",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 104,
        "name": "Law of attraction",
        "group_id": 5,
        "emoji": "🧲",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 59,
        "name": "LGBTQIA+ nightlife",
        "group_id": 4,
        "emoji": "🌈",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 270,
        "name": "LGBTQIA+ rights",
        "group_id": 13,
        "emoji": "🏳️‍🌈",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 98,
        "name": "Lifelong learner",
        "group_id": 5,
        "emoji": "📝",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 202,
        "name": "Make-up",
        "group_id": 9,
        "emoji": "💄",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 139,
        "name": "Manga",
        "group_id": 7,
        "emoji": "🌸",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 238,
        "name": "Martial arts",
        "group_id": 10,
        "emoji": "🥋",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 180,
        "name": "Mathematics",
        "group_id": 9,
        "emoji": "➗",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 149,
        "name": "Meditation",
        "group_id": 8,
        "emoji": "🧘",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 120,
        "name": "Metal",
        "group_id": 6,
        "emoji": "💀",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 146,
        "name": "Mindfulness",
        "group_id": 8,
        "emoji": "☁️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 187,
        "name": "Movie maker",
        "group_id": 9,
        "emoji": "🎬",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 27,
        "name": "Murder mystery",
        "group_id": 2,
        "emoji": "🕵️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 69,
        "name": "Museums",
        "group_id": 4,
        "emoji": "🏛",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 114,
        "name": "Music fan",
        "group_id": 6,
        "emoji": "🎵",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 184,
        "name": "Music producer",
        "group_id": 9,
        "emoji": "🎧",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 1,
        "name": "Musicals",
        "group_id": 1,
        "emoji": "🎼",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 201,
        "name": "Nail art",
        "group_id": 9,
        "emoji": "💅",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 82,
        "name": "Nature lover",
        "group_id": 5,
        "emoji": "🌲",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 213,
        "name": "Netball",
        "group_id": 10,
        "emoji": "🏀",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 103,
        "name": "Nights in",
        "group_id": 5,
        "emoji": "😴",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 60,
        "name": "Nights out",
        "group_id": 4,
        "emoji": "🌛",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 13,
        "name": "Nollywood",
        "group_id": 2,
        "emoji": "🇳🇬",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 34,
        "name": "Nordic noir",
        "group_id": 2,
        "emoji": "😨",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 185,
        "name": "Painting",
        "group_id": 9,
        "emoji": "🎨",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 227,
        "name": "Parkour",
        "group_id": 10,
        "emoji": "🏙️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 10,
        "name": "Party planner",
        "group_id": 1,
        "emoji": "🎈",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 23,
        "name": "Period dramas",
        "group_id": 2,
        "emoji": "👗",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 77,
        "name": "Pescatarian",
        "group_id": 5,
        "emoji": "🐟",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 87,
        "name": "Pet parent",
        "group_id": 5,
        "emoji": "🐕",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 199,
        "name": "Petrol head",
        "group_id": 9,
        "emoji": "🚙",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 191,
        "name": "Photography",
        "group_id": 9,
        "emoji": "📸",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 163,
        "name": "Physics",
        "group_id": 9,
        "emoji": "💡",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 93,
        "name": "Piercings",
        "group_id": 5,
        "emoji": "💎",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 241,
        "name": "Pilates",
        "group_id": 10,
        "emoji": "🤸",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 170,
        "name": "Plant parent",
        "group_id": 9,
        "emoji": "💐",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 174,
        "name": "Playing instruments",
        "group_id": 9,
        "emoji": "🎻",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 6,
        "name": "Podcasts",
        "group_id": 1,
        "emoji": "🎙️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 137,
        "name": "Poetry",
        "group_id": 7,
        "emoji": "💌",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 209,
        "name": "Pool",
        "group_id": 10,
        "emoji": "🎱",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 115,
        "name": "Pop",
        "group_id": 6,
        "emoji": "🎶",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 157,
        "name": "Pottery",
        "group_id": 9,
        "emoji": "⚱️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 245,
        "name": "Programming",
        "group_id": 11,
        "emoji": "💻",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 92,
        "name": "Proud parent",
        "group_id": 5,
        "emoji": "👶",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 200,
        "name": "Public speaking",
        "group_id": 9,
        "emoji": "📢",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 63,
        "name": "Pubs",
        "group_id": 4,
        "emoji": "🍻",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 126,
        "name": "Punk",
        "group_id": 6,
        "emoji": "🧑‍🎤",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 5,
        "name": "Puzzles",
        "group_id": 1,
        "emoji": "🧩",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 111,
        "name": "R&B",
        "group_id": 6,
        "emoji": "🎙️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 37,
        "name": "Reality TV",
        "group_id": 2,
        "emoji": "😮",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 109,
        "name": "Reggae",
        "group_id": 6,
        "emoji": "🌴",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 152,
        "name": "Relaxing",
        "group_id": 8,
        "emoji": "🛋️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 102,
        "name": "Risk taker",
        "group_id": 5,
        "emoji": "😜",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 252,
        "name": "Road trips",
        "group_id": 12,
        "emoji": "🚗",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 248,
        "name": "Robotics",
        "group_id": 11,
        "emoji": "🦾",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 119,
        "name": "Rock",
        "group_id": 6,
        "emoji": "👩‍🎤",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 198,
        "name": "Roller skating",
        "group_id": 9,
        "emoji": "🛹",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 15,
        "name": "Rom-coms",
        "group_id": 2,
        "emoji": "❤️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 132,
        "name": "Romance books",
        "group_id": 7,
        "emoji": "❤️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 243,
        "name": "Rowing",
        "group_id": 10,
        "emoji": "🚣",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 217,
        "name": "Rugby",
        "group_id": 10,
        "emoji": "🏉",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 230,
        "name": "Running",
        "group_id": 10,
        "emoji": "💨",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 231,
        "name": "Running clubs",
        "group_id": 10,
        "emoji": "🏃‍➡️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 262,
        "name": "Safari",
        "group_id": 12,
        "emoji": "🦁",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 207,
        "name": "Sailing",
        "group_id": 10,
        "emoji": "⛵",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 136,
        "name": "Sci-fi books",
        "group_id": 7,
        "emoji": "👽",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 25,
        "name": "Sci-fi films",
        "group_id": 2,
        "emoji": "👽",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 164,
        "name": "Scrapbooking",
        "group_id": 9,
        "emoji": "📔",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 236,
        "name": "Scuba diving",
        "group_id": 10,
        "emoji": "🤿",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 95,
        "name": "Seeing family",
        "group_id": 5,
        "emoji": "💗",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 91,
        "name": "Seeing friends",
        "group_id": 5,
        "emoji": "👯‍♀️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 151,
        "name": "Self-care",
        "group_id": 8,
        "emoji": "🛁",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 107,
        "name": "Self-expression",
        "group_id": 5,
        "emoji": "🦋",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 143,
        "name": "Self-help books",
        "group_id": 7,
        "emoji": "🏆",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 108,
        "name": "Self-love",
        "group_id": 5,
        "emoji": "💝",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 89,
        "name": "Self-made",
        "group_id": 5,
        "emoji": "👑",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 195,
        "name": "Sewing",
        "group_id": 9,
        "emoji": "🧵",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 9,
        "name": "Shopping",
        "group_id": 1,
        "emoji": "🛍",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 256,
        "name": "Sightseeing",
        "group_id": 12,
        "emoji": "🌍",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 182,
        "name": "Singing sensation",
        "group_id": 9,
        "emoji": "🎤",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 254,
        "name": "Skiing",
        "group_id": 10,
        "emoji": "⛷️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 153,
        "name": "Skin care",
        "group_id": 8,
        "emoji": "🌞",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 233,
        "name": "Snooker",
        "group_id": 10,
        "emoji": "🔴",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 214,
        "name": "Snowboarding",
        "group_id": 10,
        "emoji": "🏂",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 31,
        "name": "Soap operas",
        "group_id": 2,
        "emoji": "💓",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 101,
        "name": "Social butterfly",
        "group_id": 5,
        "emoji": "🧡",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 145,
        "name": "Spa days",
        "group_id": 8,
        "emoji": "🧖",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 99,
        "name": "Spiritual being",
        "group_id": 5,
        "emoji": "🤍",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 80,
        "name": "Spontaneous spirit",
        "group_id": 5,
        "emoji": "⚡️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 204,
        "name": "Sports fan",
        "group_id": 10,
        "emoji": "⚽️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 3,
        "name": "Stand-up",
        "group_id": 1,
        "emoji": "😄",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 274,
        "name": "Stop Asian Hate",
        "group_id": 13,
        "emoji": "🚫",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 52,
        "name": "Street food",
        "group_id": 3,
        "emoji": "🥢",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 90,
        "name": "Style icon",
        "group_id": 5,
        "emoji": "👕",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 79,
        "name": "Sunbathing",
        "group_id": 5,
        "emoji": "☀️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 32,
        "name": "Superhero films",
        "group_id": 2,
        "emoji": "🦸",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 216,
        "name": "Surfing",
        "group_id": 10,
        "emoji": "🏄",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 42,
        "name": "Sushi fanatic",
        "group_id": 3,
        "emoji": "🍣",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 268,
        "name": "Sustainability",
        "group_id": 13,
        "emoji": "♻️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 44,
        "name": "Sweet tooth",
        "group_id": 3,
        "emoji": "🍭",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 218,
        "name": "Swimming",
        "group_id": 10,
        "emoji": "🏊‍♀️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 226,
        "name": "Table tennis",
        "group_id": 10,
        "emoji": "🏓",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 51,
        "name": "Takeaways",
        "group_id": 3,
        "emoji": "🥡",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 193,
        "name": "Tarot reading",
        "group_id": 9,
        "emoji": "🔮",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 83,
        "name": "Tattoos",
        "group_id": 5,
        "emoji": "🌹",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 55,
        "name": "Tea sipper",
        "group_id": 3,
        "emoji": "🍵",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 251,
        "name": "Tech whizz",
        "group_id": 11,
        "emoji": "📱",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 123,
        "name": "Techno",
        "group_id": 6,
        "emoji": "🔌",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 211,
        "name": "Tennis",
        "group_id": 10,
        "emoji": "🎾",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 2,
        "name": "Theatre",
        "group_id": 1,
        "emoji": "🎭",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 147,
        "name": "Therapy",
        "group_id": 8,
        "emoji": "💬",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 84,
        "name": "Thrill seeker",
        "group_id": 5,
        "emoji": "🚀",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 36,
        "name": "Thrillers",
        "group_id": 2,
        "emoji": "😬",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 39,
        "name": "Total foodie",
        "group_id": 3,
        "emoji": "🍔",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 156,
        "name": "Train spotting",
        "group_id": 9,
        "emoji": "🚆",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 269,
        "name": "Trans rights",
        "group_id": 13,
        "emoji": "💖",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 33,
        "name": "True crime shows",
        "group_id": 2,
        "emoji": "🩸",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 26,
        "name": "TV series",
        "group_id": 2,
        "emoji": "📺",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 75,
        "name": "Vegan",
        "group_id": 5,
        "emoji": "🌱",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 76,
        "name": "Vegetarian",
        "group_id": 5,
        "emoji": "🍏",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 171,
        "name": "Vintage clothes",
        "group_id": 9,
        "emoji": "👖",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 173,
        "name": "Vinyl collector",
        "group_id": 9,
        "emoji": "💿",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 223,
        "name": "Volleyball",
        "group_id": 10,
        "emoji": "🏐",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 273,
        "name": "Volunteering",
        "group_id": 13,
        "emoji": "🙋",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 250,
        "name": "VR",
        "group_id": 11,
        "emoji": "😎",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 73,
        "name": "Weekend brunch",
        "group_id": 4,
        "emoji": "🥞",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 263,
        "name": "Weekend getaways",
        "group_id": 12,
        "emoji": "🧳",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 220,
        "name": "Weightlifting",
        "group_id": 10,
        "emoji": "🏋️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 50,
        "name": "Whisky",
        "group_id": 3,
        "emoji": "🥃",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 46,
        "name": "Wine",
        "group_id": 3,
        "emoji": "🍷",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 235,
        "name": "Wrestling",
        "group_id": 10,
        "emoji": "🤼‍♂️",
        "hp_element_id": 0
    },
    {
        "$gpb": "Interest",
        "interest_id": 242,
        "name": "Yoga",
        "group_id": 10,
        "emoji": "🧘",
        "hp_element_id": 0
    }
]


OVERLAY
opacity: 1;
    background-image: radial-gradient(transparent 1px, #ffffff 1px);
    transform: none;
    mask: linear-gradient(#ffffff calc(100% - 20px), #0000);
    width: 100%;
    background-color: transparent;
    backdrop-filter: blur(3px);
    height: 100%;
    background-size: 2px 2px;
