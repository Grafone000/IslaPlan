// All Home copy lives here. Edit the text in this file; components only lay it out.

export const home = {
  brand: 'IslaPlan',
  menu: {
    open: 'Open menu',
    close: 'Close menu',
    label: 'Menu',
    links: [
      { label: 'Book your event', href: '/plan' },
      { label: 'What we do', href: '/#events' },
    ],
    logIn: { label: 'Log in', href: '/login' },
  },
  hero: {
    image: {
      src: '/images/hero-candlelit-dinner.jpg',
      alt: 'Guests at a candlelit private dinner',
    },
  },
  coordinate: {
    lines: ['You celebrate', 'We coordinate'],
    plan: { label: 'Plan your event', href: '#book' },
    see: { label: 'See what we do', href: '#events' },
    image: {
      src: '/images/food-dining-room.jpg',
      alt: 'Private dining room with a long dressed table',
    },
  },
  story: {
    title: 'Bring the party home.',
    titleEmphasis: 'We’ll take care of the rest.',
    paragraphs: [
      'Planning a celebration at home should feel exciting, not stressful. We work with a trusted selection of reliable suppliers and take care of the coordination behind the scenes, bringing every detail together so your event runs smoothly.',
      'You stay in control of the choices. From delicious food and drinks to music and entertainment, décor and those special finishing touches, you can select the elements that make your celebration uniquely yours.',
      'Simply tell us your vision and we can make it happen. If you can imagine it, we can make it reality.',
      'Once you’ve made your selections, you’ll receive an estimated proposal based on your choices. If you’re happy to take things further, we’ll be delighted to get in touch, confirm the details and start bringing your plans to life.',
    ],
    image: {
      src: '/images/decor-reception.jpg',
      alt: 'Cocktail reception with a bartender and standing tables',
    },
  },
  events: {
    title: 'What we do',
    items: [
      'Weddings',
      'Birthdays',
      'Engagements',
      'Wedding proposals',
      'Hen & Stag dos',
      'Baby showers',
      'Graduations',
      'Girls’ & Boys’ nights',
      'Family & friends reunions',
      'Bespoke events',
    ],
  },
  book: {
    action: { label: 'Let’s start planning', href: '/plan' },
    body: 'Tell us what you’re celebrating, get an estimate, our team is here to shape the rest.',
    image: {
      src: '/images/cta-table-setting.jpg',
      alt: 'Table setting with ribboned napkins and festive crackers',
    },
  },
  footer: {
    copyright: '© IslaPlan',
    contact: '[City] · [email@yourbrand.com]',
  },
} as const;
