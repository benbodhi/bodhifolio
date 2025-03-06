import { Project } from './types'

export const projects: Project[] = [
  {
    id: 1,
    title: `NOUNER.lol`,
    type: `project`,
    description: `<strong>NOUNER #1111</strong> is my 1977 Ford LTD Variety Bash car. I drive it around Australia, primarily raising money for Variety - The Children's Charity and raising awareness of <a href="https://nouns.world">Nouns</a>.`,
    media: [
      {
        type: `image`,
        src: `/project-media/nouner.lol-mudsplash-web.jpg`
      },
      {
        type: `image`,
        src: `/project-media/nouner.lol-side-web.jpg`
      }
    ],
    links: [
      {
        label: `Instagram`,
        url: `https://instagram.com/nouner.lol`,
        type: `primary`
      },
      {
        label: `nouner.lol`,
        url: `https://nouner.lol`,
        type: `secondary`
      }
    ]
  },
  {
    id: 2,
    title: `SVG Support`,
    type: `software`,
    description: `Back in 2013, I published my SVG Support WordPress plugin so I could more easily install it on the sites I was building.<br><br>It's <a href="https://github.com/benbodhi/svg-support">open source</a>, free to use and has since grown to be used on 1 million+ active websites.`,
    media: [
      {
        type: `image`,
        src: `/project-media/svg-support.png`
      }
      // Test different video styles and aspect ratios
      // ,
      // {
      //   type: `video`,
      //   src: `https://youtube.com/shorts/nViMYrFpIis`
      // },
      // {
      //   type: `video`,
      //   src: `https://youtu.be/igODARo6hZg`
      // },
      // {
      //   type: `video`,
      //   src: `https://youtu.be/sSOxPJD-VNo`
      // }
    ],
    links: [
      {
        label: `svg.support`,
        url: `https://svg.support`,
        type: `primary`
      }
    ]
  },
  {
    id: 3,
    title: `Alps`,
    type: `project`,
    description: `Co-founder of Alps, a community of snow and mountain loving people, empowered by a membership auction system. The auction proceeds go into a treasury that is managed by members.<br><br>Built on <a href="https://ethereum.org/">Ξthereum</a>`,
    media: [
      {
        type: `image`,
        src: `/project-media/alps-lil-bubble-level-up.jpg`
      },
      {
        type: `image`,
        src: `/project-media/alps-scene-gondy.jpg`
      }
    ],
    links: [
      {
        label: `alps.wtf`,
        url: `https://alps.wtf`,
        type: `primary`
      },
      {
        label: `alps.center`,
        url: `https://alps.center/`,
        type: `secondary`
      }
    ]
  },
  {
    id: 4,
    title: `Behind The Noggles`,
    type: `media`,
    description: `Leo Clark made a short film documentary about my journey in Nouns and beyond.<br><br><a href="https://www.nouns.camp/proposals/461">Funded by Nouns - Prop 461</a>`,
    media: [
      {
        type: `video`,
        src: `https://youtu.be/B9xxBuckhxs`,
        isCover: true
      }
    ],
    links: []
  },
  {
    id: 5,
    title: `Zero Rights Media`,
    type: `media`,
    description: `Co-founder and team member of the onchain media collective Zero Rights Media (formerly known as The Noun Square).<br><br>The Ethereum ecosystem is open source, and it deserves media content that is too.`,
    media: [
      {
        type: `image`,
        src: `/project-media/zrm-zoggles.png`
      },
      {
        type: `video`,
        src: `https://vimeo.com/1045807123`
      }
    ],
    listItems: [
      `CC0/Ethereum Podcast <a href="https://zeropod.xyz">ZEROPOD</a>`,
      `Daily Game <a href="https://nomo.wtf">NOMO Nouns</a>`,
      `<a href="https://x.com/zerorightsmedia">The Noun Square</a> Weekly 𝕏 Space`,
      `Clanker Podcast <a href="https://youtu.be/jZfbHPnWHR0?si=mChLYmbxN0L3CnmM">Must Clank</a>`
    ],
    links: [
      {
        label: `zerorights.media`,
        url: `https://zerorights.media`,
        type: `primary`
      }
    ]
  },
  {
    id: 6,
    title: `Mr. Bill's Tunes`,
    type: `resource`,
    description: `I've been fortunate to not only be a good friend of Bill's but to build Mr. Bill's Tunes with him since the beginning, back in 2010.<br><br>The site is an Ableton Live mastery gold mine!`,
    media: [],
    listItems: [
      `The Art of Mr. Bill Tutorial Series`,
      `Ableton Devices Tutorials`,
      `Download Sample Packs`,
      `Reverse Engineer Project Files`,
      `Studio Live Streams`,
      `HCA Feed (Tips & Tricks)`,
      `The Mr. Bill Podcast Early Access`
    ],
    promo: `Use code BENBODHILOVESYOU for 10% off`,
    links: [
      {
        label: `mrbillstunes.com`,
        url: `https://mrbillstunes.com`,
        type: `primary`
      }
    ]
  },
  {
    id: 7,
    title: `Watch Grass`,
    type: `project`,
    description: `My first foray into <strong>p5.js experimentation</strong> is "<a href="https://watchgrass.benbodhi.energy/">Watch Grass</a>", a play on the "touch grass" saying.<br><br>I made a simple website where you can see iterations of the grass growing, manually or automatically, and you can "mow" the grass to start fresh.<br><br>I also experimented with minting this site as a <a href="https://zora.co/collect/zora:0x339d3cf921ef7fa5e9727c6f1f958279486e94be/1?referrer=0xa903C06BF35286f6d1cDAD25396748353979a44C">functional NFT on Zora</a>.`,
    media: [
      {
        type: `image`,
        src: `/project-media/watch-grass.png`,
        isCover: true
      }
    ],
    links: [
      {
        label: `Watch Grass`,
        url: `https://watchgrass.benbodhi.energy/`,
        type: `primary`
      },
      {
        label: `Collect`,
        url: `https://zora.co/collect/zora:0x339d3cf921ef7fa5e9727c6f1f958279486e94be/1?referrer=0xa903C06BF35286f6d1cDAD25396748353979a44C`,
        type: `secondary`
      }
    ]
  },
  {
    id: 8,
    title: `Bicycle Day Reflections`,
    type: `project`,
    description: `A collection of 420 NFTs, <a href="https://highlight.xyz/mint/base:0xA3527304322E1B2E9716E5f9c70C3F9b816A7299">available to collect</a>, exploring the synergy between <strong>human creativity and AI tooling in a psychedelic context</strong>.<br><br>Inspired by Bicycle Day, this project envisions what a camera might capture if it could perceive reality through the lens of a psychedelic experience.<br><br>While the human mind sees <strong>energy, depth, and intricate patterns</strong>, traditional photography flattens it to the "ordinary".<br><br><em>What if the lens could truly see?</em>`,
    media: [],
    links: [
      {
        label: `View/Collect`,
        url: `https://highlight.xyz/mint/base:0xA3527304322E1B2E9716E5f9c70C3F9b816A7299`,
        type: `primary`
      }
    ]
  },
  {
    id: 9,
    title: `BOARDS`,
    type: `project`,
    description: `I built <a href="https://boards.wtf">boards.wtf</a> as a showcase of so many talented artists I have had the pleasure of working with in the Nouns community and crypto space in general. What better than to showcase art on skateboards so you can ride them or put them on the wall.<br><br> Ride On!`,
    media: [
      {
        type: `image`,
        src: `/project-media/boards.wtf-sticker.png`,
        isCover: true
      },
      {
        type: `image`,
        src: `/project-media/boards.wtf-logo.png`
      },
      {
        type: `image`,
        src: `/project-media/boards.wtf-UFO-collab.png`
      }
    ],
    links: [
      {
        label: `boards.wtf`,
        url: `https://boards.wtf`,
        type: `primary`
      }
    ]
  }
]