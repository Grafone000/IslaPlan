// All Home copy lives here. Edit the text in this file; components only lay it out.

export const home = {
  brand: '[Your Brand]',
  bookAction: { label: 'Book your event', href: '/plan' },
  nav: {
    label: 'Main',
    links: [
      { label: 'Events', href: '#events' },
      { label: 'Food & Drinks', href: '#experiences' },
      { label: 'Entertainment', href: '#experiences' },
      { label: 'Decorations', href: '#experiences' },
    ],
    logIn: { label: 'Log in', href: '/login' },
  },
  hero: {
    title: 'Bring the party home.',
    titleEmphasis: "We'll take care of the rest.",
    intro: 'Planning a celebration at home should feel exciting, not stressful.',
    secondaryAction: { label: 'See what we host', href: '#events' },
    image: {
      src: '/images/hero-candlelit-dinner.jpg',
      alt: 'Guests at a candlelit private dinner',
    },
  },
  celebrate: {
    title: 'What are we celebrating?',
    events: [
      'Weddings',
      'Birthdays',
      'Engagements',
      'Wedding proposals',
      'Hen & Stag dos',
      'Baby showers',
      'Graduations',
      "Girls' & Boys' nights",
      'Family & friends reunions',
      'Bespoke events',
    ],
  },
  experiences: [
    {
      title: 'Delicious food and drinks',
      body: 'From a private chef at your table to afternoon tea and canapés, choose what suits your celebration.',
      image: {
        src: '/images/food-dining-room.jpg',
        alt: 'Private dining room with a long dressed table and city views',
      },
    },
    {
      title: 'Your décor, your finishing touches',
      body: 'Flowers, balloons and personalised details: the special touches that make your celebration uniquely yours.',
      image: {
        src: '/images/decor-reception.jpg',
        alt: 'Cocktail reception with a bartender and standing tables',
      },
    },
    {
      title: 'Music and entertainment, your way',
      body: "A DJ, live music or activities for your guests. Tell us your vision and we'll coordinate everything behind the scenes.",
      image: {
        src: '/images/music-dance-party.jpg',
        alt: 'Birthday dance party with DJ and coloured lights',
      },
    },
  ],
  choices: {
    title: 'Your event, your choices',
    paragraphs: [
      'Planning a celebration at home should feel exciting, not stressful. We work with a trusted selection of reliable suppliers, and we take care of the coordination behind the scenes, bringing every detail together so your event runs smoothly.',
      'You stay in control of the choices. From delicious food and drinks to music and entertainment, décor and those special finishing touches, you can select the elements that make your celebration uniquely yours.',
      'Simply tell us your vision and we can make it happen. If you can imagine it, we can make it reality.',
      "Once you've made your selections, you'll receive an estimated proposal based on your choices. If you're happy to take things further, we'll be delighted to get in touch, confirm the details and start bringing your plans to life.",
    ],
  },
  book: {
    title: 'Let’s plan your day.',
    body: "Once you've made your selections, you'll receive an estimated proposal based on your choices.",
    image: {
      src: '/images/cta-table-setting.jpg',
      alt: 'Table setting with ribboned napkins and festive crackers',
    },
  },
  footer: {
    copyright: '© [Your Brand]',
    contact: '[City] · [email@yourbrand.com]',
  },
} as const;
