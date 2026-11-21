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

/** Use the actual bundled song and photo assets from public/. */
export const DEFAULT_MUSIC = '/HAUSER%20-%20Mia%20_%20Sebastian_s%20Theme%20-%20La%20La%20Land(MP3_320K).mp3';
const OLD_CAPTION = 'A little moment, forever.';

/** Person-only photo gallery. All images are stored in public/images/person/. */
export const defaultPhotos: Pic[] = [
  { url: "/images/person/Just%20me_%20being%20cute%20on%20purpose%F0%9F%8C%B7%E2%9C%A8%EF%B8%8F_._._.__Mizoram%20_traditional%20_aizwal%20_fyp(JPG).jpg", pos: '50% 60%', caption: "Cute moments, just for you." },
  { url: "/images/person/Just%20me_%20being%20cute%20on%20purpose%F0%9F%8C%B7%E2%9C%A8%EF%B8%8F_._._.__Mizoram%20_traditional%20_aizwal%20_fyp(JPG)_1.jpg", pos: '50% 50%', caption: "A smile I could never get tired of." },
  { url: "/images/person/Romanticizing%20the%20little%20things%20_%20one%20picture%20at%20a%20time%20%E2%98%81%EF%B8%8F%F0%9F%A6%8B%F0%9F%AA%AD%F0%9F%8E%80%F0%9F%8C%BC(JPG).jpg", pos: '50% 40%', caption: "Romanticizing the little things." },
  { url: "/images/person/Romanticizing%20the%20little%20things%20_%20one%20picture%20at%20a%20time%20%E2%98%81%EF%B8%8F%F0%9F%A6%8B%F0%9F%AA%AD%F0%9F%8E%80%F0%9F%8C%BC(JPG)_3.jpg", pos: '50% 50%', caption: "A little dreamy moment." },
  { url: "/images/person/_A%20little%20too%20desi%20to%20be%20ordinary_%20a%20little%20too%20dreamy%20to%20be%20understood_%20%F0%9F%AA%B7%F0%9F%A6%A2%F0%9F%AA%9E%E2%9C%A8___desicore%F0%9F%91%80%F0%9F%95%8A%EF%B8%8F%F0%9F%8C%B8(JPG).jpg", pos: '50% 45%', caption: "Desi beauty and grace." },
  { url: "/images/person/_A%20little%20too%20desi%20to%20be%20ordinary_%20a%20little%20too%20dreamy%20to%20be%20understood_%20%F0%9F%AA%B7%F0%9F%A6%A2%F0%9F%AA%9E%E2%9C%A8___desicore%F0%9F%91%80%F0%9F%95%8A%EF%B8%8F%F0%9F%8C%B8(JPG)_1.jpg", pos: '50% 45%', caption: "A favorite look." },
  { url: "/images/person/_A%20little%20too%20desi%20to%20be%20ordinary_%20a%20little%20too%20dreamy%20to%20be%20understood_%20%F0%9F%AA%B7%F0%9F%A6%A2%F0%9F%AA%9E%E2%9C%A8___desicore%F0%9F%91%80%F0%9F%95%8A%EF%B8%8F%F0%9F%8C%B8(JPG)_2.jpg", pos: '50% 50%', caption: "A little too dreamy to be ordinary." },
  { url: "/images/person/%E2%9C%A8%F0%9F%AA%B7%F0%9F%92%96(JPG).jpg", pos: '50% 45%', caption: "✨🪷💖" },
  { url: "/images/person/%F0%9F%8C%B8%F0%9F%AB%A7%F0%9F%AA%BB(JPG).jpg", pos: '50% 50%', caption: "🌸🫧🪻" },
  { url: "/images/person/%F0%9F%8C%B8%F0%9F%AB%A7%F0%9F%AA%BB(JPG)_1.jpg", pos: '50% 50%', caption: "Soft colors and smiles." },
  { url: "/images/person/%F0%9F%8C%B8%F0%9F%AB%A7%F0%9F%AA%BB(JPG)_2.jpg", pos: '50% 50%', caption: "A flower-like moment." },
  { url: "/images/person/%F0%9F%92%96%F0%9F%8C%B7%F0%9F%92%97(JPG).jpg", pos: '50% 50%', caption: "💖🌷💗" },
  { url: "/images/person/%F0%9F%92%96%F0%9F%8C%B7%F0%9F%92%97(JPG)_1.jpg", pos: '50% 50%', caption: "Another favorite smile." },
  { url: "/images/person/%F0%9F%A4%8D%F0%9F%A4%8D_newpost_TSA%F0%9F%A4%8D%20_freshersday%E2%9D%A4%20_2023%20_tlresort%20_aizawl%F0%9F%A4%8D_mizoram%20_chakmagirl%E2%9D%A4%EF%B8%8F(JPG).jpg", pos: '50% 45%', caption: "A beautiful memory." },
];

/** Together camera-roll frames: shared memories only, stored in public/images/together/. */
export type Frame = Pic & { fit?: 'cover' | 'contain' };
export const reel: Frame[] = [
  { url: "/images/together/20250614_213134.jpg", pos: '50% 50%', caption: "A little moment together." },
  { url: "/images/together/20250616_074759.jpg", pos: '50% 50%', caption: "A memory worth keeping." },
  { url: "/images/together/20250616_100139.jpg", pos: '50% 50%', caption: "Us, in our own little world." },
  { url: "/images/together/20251212_201244.jpg", pos: '50% 50%', caption: "A day to remember." },
  { url: "/images/together/20251213_183937.jpg", pos: '50% 50%', caption: "Together, always." },
  { url: "/images/together/20251231_185412.jpg", pos: '50% 50%', caption: "A beautiful day together." },
  { url: "/images/together/20260101_073839.jpg", pos: '50% 50%', caption: "A favorite memory." },
  { url: "/images/together/20260808_175201.jpg", pos: '50% 50%', caption: "Our little story." },
  { url: "/images/together/68a0bb55-d9a6-4573-b2eb-d4d5aa389809.png", pos: '50% 50%', caption: "A moment full of love." },
  { url: "/images/together/Picsart_25-12-19_17-58-33-177.jpg", pos: '50% 50%', caption: "A camera-roll favorite." },
  { url: "/images/together/file_0000000022d072078ebb740a40460e46.png", pos: '50% 50%', caption: "Us, forever in memories." },
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
