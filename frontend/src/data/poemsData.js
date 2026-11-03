export const SAMPLE_POEMS = [
  {
    id: 'road-not-taken',
    title: 'The Road Not Taken',
    poet: 'Robert Frost',
    year: '1916',
    vibe: 'Pensive & Contemplative',
    recommendedStyle: 'dissolve',
    recommendedBg: 'forest',
    stanzas: [
      [
        'Two roads diverged in a yellow wood,',
        'And sorry I could not travel both',
        'And be one traveler, long I stood',
        'And looked down one as far as I could',
        'To where it bent in the undergrowth;'
      ],
      [
        'Then took the other, as just as fair,',
        'And having perhaps the better claim,',
        'Because it was grassy and wanted wear;',
        'Though as for that the passing there',
        'Had worn them really about the same,'
      ],
      [
        'And both that morning equally lay',
        'In leaves no step had trodden black.',
        'Oh, I kept the first for another day!',
        'Yet knowing how way leads on to way,',
        'I doubted if I should ever come back.'
      ],
      [
        'I shall be telling this with a sigh',
        'Somewhere ages and ages hence:',
        'Two roads diverged in a wood, and I—',
        'I took the one less traveled by,',
        'And that has made all the difference.'
      ]
    ]
  },
  {
    id: 'do-not-go-gentle',
    title: 'Do Not Go Gentle Into That Good Night',
    poet: 'Dylan Thomas',
    year: '1951',
    vibe: 'Fierce & Urgent',
    recommendedStyle: 'kinetic',
    recommendedBg: 'aurora',
    stanzas: [
      [
        'Do not go gentle into that good night,',
        'Old age should burn and rave at close of day;',
        'Rage, rage against the dying of the light.'
      ],
      [
        'Though wise men at their end know dark is right,',
        'Because their words had forked no lightning they',
        'Do not go gentle into that good night.'
      ],
      [
        'Good men, the last wave by, crying how bright',
        'Their frail deeds might have danced in a green bay,',
        'Rage, rage against the dying of the light.'
      ],
      [
        'Wild men who caught and sang the sun in flight,',
        'And learn, too late, they grieved it on its way,',
        'Do not go gentle into that good night.'
      ],
      [
        'Grave men, near death, who see with blinding sight',
        'Blind eyes could blaze like meteors and be gay,',
        'Rage, rage against the dying of the light.'
      ],
      [
        'And you, my father, there on the sad height,',
        'Curse, bless, me now with your fierce tears, I pray.',
        'Do not go gentle into that good night.',
        'Rage, rage against the dying of the light.'
      ]
    ]
  },
  {
    id: 'ozymandias',
    title: 'Ozymandias',
    poet: 'Percy Bysshe Shelley',
    year: '1818',
    vibe: 'Monumental & Desolate',
    recommendedStyle: 'roll',
    recommendedBg: 'desert',
    stanzas: [
      [
        'I met a traveller from an antique land,',
        'Who said—“Two vast and trunkless legs of stone',
        'Stand in the desert. . . . Near them, on the sand,',
        'Half sunk a shattered visage lies, whose frown,'
      ],
      [
        'And wrinkled lip, and sneer of cold command,',
        'Tell that its sculptor well those passions read',
        'Which yet survive, stamped on these lifeless things,',
        'The hand that mocked them, and the heart that fed;'
      ],
      [
        'And on the pedestal, these words appear:',
        'My name is Ozymandias, King of Kings;',
        'Look on my Works, ye Mighty, and despair!',
        'Nothing beside remains. Round the decay',
        'Of that colossal Wreck, boundless and bare',
        'The lone and level sands stretch far away.”'
      ]
    ]
  },
  {
    id: 'hope-feathers',
    title: 'Hope is the thing with feathers',
    poet: 'Emily Dickinson',
    year: '1891',
    vibe: 'Delicate & Uplifting',
    recommendedStyle: 'drift',
    recommendedBg: 'ocean',
    stanzas: [
      [
        '“Hope” is the thing with feathers -',
        'That perches in the soul -',
        'And sings the tune without the words -',
        'And never stops - at all -'
      ],
      [
        'And sweetest - in the Gale - is heard -',
        'And sore must be the storm -',
        'That could abash the little Bird',
        'That kept so many warm -'
      ],
      [
        'I’ve heard it in the chillest land -',
        'And on the strangest Sea -',
        'Yet - never - in Extremity,',
        'It asked a crumb - of me.'
      ]
    ]
  },
  {
    id: 'invictus',
    title: 'Invictus',
    poet: 'William Ernest Henley',
    year: '1875',
    vibe: 'Resilient & Unconquerable',
    recommendedStyle: 'noir',
    recommendedBg: 'void',
    stanzas: [
      [
        'Out of the night that covers me,',
        'Black as the pit from pole to pole,',
        'I thank whatever gods may be',
        'For my unconquerable soul.'
      ],
      [
        'In the fell clutch of circumstance',
        'I have not winced nor cried aloud.',
        'Under the bludgeonings of chance',
        'My head is bloody, but unbowed.'
      ],
      [
        'Beyond this place of wrath and tears',
        'Looms but the Horror of the shade,',
        'And yet the menace of the years',
        'Finds and shall find me unafraid.'
      ],
      [
        'It matters not how strait the gate,',
        'How charged with punishments the scroll,',
        'I am the master of my fate,',
        'I am the captain of my soul.'
      ]
    ]
  }
];

export const CREDIT_STYLES = [
  {
    id: 'roll',
    name: 'Classic Film Roll',
    subtitle: 'Continuous vertical crawl with soft edge masks',
    iconName: 'ScrollText',
    fontCategory: 'serif',
    accentColor: '#EFE8DF'
  },
  {
    id: 'dissolve',
    name: 'A24 Stanza Cards',
    subtitle: 'Lyrical slow cross-fades with generous negative space',
    iconName: 'Sparkles',
    fontCategory: 'serif',
    accentColor: '#FAFBF8'
  },
  {
    id: 'noir',
    name: 'Noir Cold Open',
    subtitle: 'Monospaced tele-type cut-in with dramatic scene stamps',
    iconName: 'Terminal',
    fontCategory: 'mono',
    accentColor: '#84C341'
  },
  {
    id: 'kinetic',
    name: 'Saul Bass Graphic',
    subtitle: 'Brutalist sliding bars & bold high-contrast kinetic typography',
    iconName: 'Layers',
    fontCategory: 'sans',
    accentColor: '#7BB33B'
  },
  {
    id: 'drift',
    name: 'Ambient Drift',
    subtitle: 'Subtle floating scale & parallax glide across atmospheric scenery',
    iconName: 'Wind',
    fontCategory: 'display',
    accentColor: '#C29B78'
  }
];

export const BACKGROUND_PRESETS = [
  {
    id: 'aurora',
    name: 'Kiwi Aurora',
    type: 'abstract',
    description: 'Slow-drifting ethereal emerald, olive & twilight gradients',
    gradient: 'radial-gradient(circle at 20% 30%, rgba(123, 179, 59, 0.45) 0%, transparent 55%), radial-gradient(circle at 80% 70%, rgba(47, 68, 30, 0.7) 0%, transparent 60%), radial-gradient(circle at 50% 50%, rgba(17, 20, 16, 0.95) 0%, #0D110D 100%)',
    baseColor: '#0a0d0a'
  },
  {
    id: 'twilight',
    name: 'Twilight Deep',
    type: 'abstract',
    description: 'Deep indigo, midnight blue, and violet cosmic embers',
    gradient: 'radial-gradient(circle at 75% 25%, rgba(99, 102, 241, 0.35) 0%, transparent 50%), radial-gradient(circle at 25% 75%, rgba(139, 92, 246, 0.3) 0%, transparent 60%), radial-gradient(circle at 50% 50%, #0F172A 0%, #020617 100%)',
    baseColor: '#030712'
  },
  {
    id: 'forest',
    name: 'Misty Pine Forest',
    type: 'photo',
    description: 'Ethereal morning fog rising through evergreen canopy',
    url: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1920&q=80',
    fallbackGradient: 'linear-gradient(to bottom, #1A2E1E, #0A140D)'
  },
  {
    id: 'ocean',
    name: 'Pacific Shore Fog',
    type: 'photo',
    description: 'Moody rhythmic waves breaking against quiet sea cliffs',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
    fallbackGradient: 'linear-gradient(to bottom, #1E293B, #0F172A)'
  },
  {
    id: 'desert',
    name: 'Colossal Dunes',
    type: 'photo',
    description: 'Golden hour shadows across timeless windswept sand dunes',
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1920&q=80',
    fallbackGradient: 'linear-gradient(to bottom, #42281D, #1C120B)'
  },
  {
    id: 'void',
    name: 'Cinema Noir Void',
    type: 'abstract',
    description: 'Pure 35mm matte black with subtle ambient center spotlight',
    gradient: 'radial-gradient(circle at 50% 45%, rgba(255,255,255,0.04) 0%, transparent 65%), #0A0B0A',
    baseColor: '#070807'
  }
];

export const FONT_PAIRINGS = [
  { id: 'cinematic-serif', name: 'Cinematic Serif', fontClass: 'font-serif' },
  { id: 'clean-sans', name: 'Swiss Modern Sans', fontClass: 'font-sans' },
  { id: 'brutalist-mono', name: 'Kiwi Brutalist Mono', fontClass: 'font-mono' }
];
