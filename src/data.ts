export type Pic = { url: string; caption: string; pos?: string };

export type TextKey =
  | 'title' | 'sender' | 'welcome' | 'subtitle' | 'message'
  | 'birthday' | 'birthdaySub' | 'letterTitle' | 'envelope' | 'closing';

export type Data = Record<TextKey, string> & {
  letter: string;
  music: string;
  musicEnabled: boolean;
  photos: Pic[];
};

/** Bundled song (created by scripts/prepare_assets.py). */
export const DEFAULT_MUSIC = '/audio/theme.mp3';
const OLD_CAPTION = 'A little moment, forever.';

const her = (n: number) => `/photos/her-${String(n).padStart(2, '0')}.jpg`;
const us = (n: number) => `/photos/us-${String(n).padStart(2, '0')}.jpg`;

/** Exactly 15 scrapbook slots. `pos` is the CSS object-position that keeps her face in frame. */
export const defaultPhotos: Pic[] = [
  { url: her(1),  pos: '50% 70%', caption: 'A forest fairytale, and you are the main character.' },
  { url: her(2),  pos: '50% 45%', caption: 'The sun followed you up every single step.' },
  { url: her(3),  pos: '65% 30%', caption: 'That look over your glasses… I still have not recovered.' },
  { url: her(4),  pos: '45% 50%', caption: 'Lantern light and a red dress, like a scene from a film.' },
  { url: her(5),  pos: '50% 50%', caption: 'Green grass, blue skies and your smile. Perfect.' },
  { url: her(6),  pos: '60% 60%', caption: 'That soft, shy smile in golden light melts me.' },
  { url: her(7),  pos: '50% 35%', caption: 'Cute on purpose, and it works every single time.' },
  { url: her(8),  pos: '50% 40%', caption: 'Even a quiet hall glows when you are standing in it.' },
  { url: her(9),  pos: '45% 50%', caption: 'The flowers bloom a little brighter around you.' },
  { url: her(10), pos: '55% 50%', caption: 'Saluting the flowers, and they salute you right back.' },
  { url: her(11), pos: '55% 50%', caption: 'A flower in your hair and mischief in your eyes.' },
  { url: her(12), pos: '50% 40%', caption: 'Graceful in pink. You wear a saree like poetry.' },
  { url: her(13), pos: '50% 30%', caption: 'Elegance with the sweetest smile.' },
  { url: her(14), pos: '65% 30%', caption: 'Pure softness, caught mid-giggle by the pool.' },
  { url: us(10),  pos: '40% 50%', caption: 'Glowing by the river. Even your cartoon twin agrees.' },
];

/** The "camera roll" shown around the letter. `fit: contain` keeps the photo-booth strip whole. */
export type Frame = Pic & { fit?: 'cover' | 'contain' };
export const reel: Frame[] = [
  { url: us(1),  pos: '50% 62%', caption: 'Us, caught in the mirror' },
  { url: us(2),  pos: '50% 35%', caption: 'Flowers could not outshine you' },
  { url: us(3),  pos: '50% 40%', caption: 'My favourite place is right next to you' },
  { url: us(4),  pos: '30% 12%', caption: 'Waiting together' },
  { url: us(5),  pos: '40% 45%', caption: 'Roses, thumbs up, and you' },
  { url: us(6),  pos: '60% 75%', caption: 'Night lights and a red scarf' },
  { url: us(7),  pos: '57% 50%', caption: 'Winter smiles' },
  { url: us(8),  pos: '80% 40%', caption: 'Our sunny little date' },
  { url: us(9),  pos: '50% 30%', caption: 'Us, but in a storybook' },
  { url: us(10), pos: '40% 50%', caption: 'You and your cartoon twin' },
  { url: us(11), fit: 'contain', caption: 'Four poses, one forever' },
];

export const initial: Data = {
  title: 'A Little World of Love',
  sender: 'Someone who adores you',
  welcome: 'I made something special for you…',
  subtitle: 'A little world filled with love, just for you.',
  message:
    'Before we begin, I just want you to know how incredibly special you are to me. You make ordinary days feel a little more magical.',
  birthday: 'Happy Birthday, my favorite person!',
  birthdaySub: 'Today, the world is a little brighter because you are in it.',
  letterTitle: 'To my most special person…',
  letter:
    'My dearest,\n\nIf I could wrap every warm thought, every smile, and every little moment of happiness into a gift, I would give it all to you. You deserve to feel celebrated not just today, but in all the ordinary days in between.\n\nThank you for being exactly who you are. I hope this new chapter brings you gentle mornings, brave dreams, unexpected joy, and countless reasons to smile.\n\nNo matter where life takes you, I hope you never forget how wonderfully special you are.\n\nWith all my heart,',
  envelope: 'There’s something I’ve wanted to tell you…',
  closing: 'Happy Birthday, once again. You deserve all the happiness in this world. ♡',
  music: DEFAULT_MUSIC,
  musicEnabled: true,
  photos: defaultPhotos,
};

/**
 * Merge content saved in Supabase over the built-in defaults.
 * An empty photo slot, the old placeholder caption, or a missing song falls back to the default,
 * so previously published (empty) content can never blank out the new photos or the music.
 */
export function mergeContent(saved?: Partial<Data> | null): Data {
  const c = saved ?? {};
  const photos = defaultPhotos.map((d, i) => {
    const s = c.photos?.[i];
    return {
      url: s?.url || d.url,
      caption: s?.caption && s.caption !== OLD_CAPTION ? s.caption : d.caption,
      pos: d.pos,
    };
  });
  return {
    ...initial,
    ...c,
    photos,
    music: c.music || DEFAULT_MUSIC,
    musicEnabled: c.music ? c.musicEnabled ?? true : true,
  };
}
