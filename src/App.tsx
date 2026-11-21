import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart, Volume2, VolumeX, X } from 'lucide-react';
import { db } from './supabase';
import Admin from './Admin';
import { initial, mergeContent, reel } from './data';
import type { Data, Frame, Pic } from './data';

type Page = 'welcome' | 'message' | 'birthday' | 'gallery' | 'envelope' | 'letter';

type FireworkSpark = {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  delay: number;
  size: number;
};

const BACK: Partial<Record<Page, Page>> = {
  message: 'welcome', birthday: 'message', gallery: 'birthday', envelope: 'gallery',
};
const screen = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -16 } };
const TILTS = [-2.2, 1.6, -1, 2.4, -1.8, 1.2];

export default function App() {
  return location.pathname.startsWith('/admin') ? <Admin /> : <Site />;
}

/* ───────────────────────── Camera-roll strip ───────────────────────── */

function FilmStrip({ frames, reverse, onOpen }: { frames: Frame[]; reverse?: boolean; onOpen: (i: number) => void }) {
  const loop = [...frames, ...frames]; // two identical sets => seamless -50% loop
  return (
    <div className={'film' + (reverse ? ' reverse' : '')} role="group" aria-label="Our little camera roll">
      <div className="film-track" style={{ ['--n' as string]: frames.length }}>
        {loop.map((f, i) => {
          const dup = i >= frames.length;
          return (
            <button
              key={i}
              className="frame"
              aria-hidden={dup}
              tabIndex={dup ? -1 : 0}
              aria-label={dup ? undefined : `Open photo: ${f.caption}`}
              onClick={() => onOpen(i % frames.length)}
            >
              <img
                src={f.url}
                alt=""
                loading={dup || i >= 4 ? 'lazy' : 'eager'}
                decoding="async"
                draggable={false}
                style={{ objectPosition: f.pos, objectFit: f.fit ?? 'cover' }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── Photo viewer ───────────────────────── */

function Viewer({ list, index, setIndex, close }: { list: Pic[]; index: number; setIndex: (i: number) => void; close: () => void }) {
  const n = list.length;
  const startX = useRef(0);
  const step = useCallback((d: number) => setIndex((index + d + n) % n), [index, n, setIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, close]);

  const p = list[index];
  return (
    <motion.div
      className="viewer"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={close}
      onTouchStart={(e) => { startX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - startX.current;
        if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
      }}
    >
      <button className="close" aria-label="Close" onClick={close}><X /></button>
      <button className="arrow left" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); step(-1); }}><ChevronLeft /></button>
      <motion.figure key={p.url} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()}>
        <img src={p.url} alt={p.caption} />
        <figcaption>{p.caption}</figcaption>
        <small>{index + 1} / {n}</small>
      </motion.figure>
      <button className="arrow right" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); step(1); }}><ChevronRight /></button>
    </motion.div>
  );
}

/* ───────────────────────── Envelope ───────────────────────── */

function Envelope({ line, onOpened, onMusicStart }: { line: string; onOpened: () => void; onMusicStart: () => void }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const trigger = () => {
    if (open) return;
    setOpen(true);
    // Start soundtrack immediately inside the user's click gesture, before the delayed page transition.
    onMusicStart();
    timer.current = window.setTimeout(onOpened, 2300); // flap opens, letter slides out, then the page turns
  };

  return (
    <motion.section className="screen" {...screen}>
      <small className="eyebrow">CHAPTER TWO · FROM MY HEART</small>
      <button className={'envelope' + (open ? ' open' : '')} onClick={trigger} aria-label="Open the envelope">
        <span className="env-back" />
        <span className="env-paper"><span>With love, always…</span></span>
        <span className="env-front" />
        <span className="env-flap" />
        <span className="wax">♡</span>
        <span className="env-label">A letter for you</span>
      </button>
      <h2>{line}</h2>
      <button className="primary" onClick={trigger} disabled={open}>{open ? 'Opening…' : 'Open your letter ♡'}</button>
    </motion.section>
  );
}

/* ───────────────────────── Site ───────────────────────── */

function Site() {
  const [page, setPage] = useState<Page>('welcome');
  const [data, setData] = useState<Data>(initial);
  const [viewer, setViewer] = useState<{ list: Pic[]; i: number } | null>(null);
  const [hearts, setHearts] = useState<{ id: number; x: number; s: number; d: number }[]>([]);
  const [playing, setPlaying] = useState(false);
  const [ambient, setAmbient] = useState(false);
  const [welcomeOpening, setWelcomeOpening] = useState(false);
  const [fireworks, setFireworks] = useState<FireworkSpark[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<number | undefined>(undefined);
  const welcomeTimer = useRef<number | undefined>(undefined);
  const hasAudio = data.musicEnabled && !!data.music;

  /* published content (falls back to the built-in content when Supabase is not configured) */
  useEffect(() => {
    if (!db) return;
    let off = false;
    db.from('birthday_content').select('content').eq('id', 1).eq('published', true).maybeSingle()
      .then(({ data: row }) => { if (!off && row?.content) setData(mergeContent(row.content as Partial<Data>)); });
    return () => { off = true; };
  }, []);

  /* one persistent audio element, never created twice */
  useEffect(() => {
    if (!hasAudio) return;
    const a = new Audio(data.music);
    a.loop = true;
    a.preload = 'auto';
    a.volume = 0;
    a.load();
    a.load();
    const on = () => setPlaying(true);
    const off = () => setPlaying(false);
    a.addEventListener('play', on);
    a.addEventListener('pause', off);
    audioRef.current = a;
    return () => {
      window.clearInterval(fadeRef.current);
      a.pause();
      a.removeEventListener('play', on);
      a.removeEventListener('pause', off);
      audioRef.current = null;
    };
  }, [hasAudio, data.music]);

  /* Eagerly warm the audio and photo assets at first render for faster loading. */
  useEffect(() => {
    if (hasAudio) { const a = audioRef.current; if (a) { a.preload = 'auto'; a.load(); } }
    [...data.photos, ...reel].forEach((p) => {
      const img = new Image(); img.decoding = 'async'; img.loading = 'eager'; img.src = p.url;
    });
  }, [hasAudio, data.music, data.photos]);
  useEffect(() => {
    if (page === 'gallery' || page === 'envelope') reel.forEach((f) => { new Image().src = f.url; });
  }, [page]);

  /* decorative GIFs load after the first paint; the heavy one only on wide screens */
  useEffect(() => {
    const t = window.setTimeout(() => setAmbient(true), 1200);
    return () => window.clearTimeout(t);
  }, []);

  const fadeTo = (a: HTMLAudioElement, to: number, ms: number, done?: () => void) => {
    window.clearInterval(fadeRef.current);
    const from = a.volume, steps = 24;
    let i = 0;
    fadeRef.current = window.setInterval(() => {
      i += 1;
      a.volume = Math.min(1, Math.max(0, from + ((to - from) * i) / steps));
      if (i >= steps) { window.clearInterval(fadeRef.current); done?.(); }
    }, ms / steps);
  };
  const startMusic = async () => {
    const a = audioRef.current;
    if (!a || !a.paused) return;
    try { a.volume = 0; await a.play(); fadeTo(a, 0.75, 2200); } catch { /* blocked: the Music button starts it */ }
  };
  /* Best-effort autoplay on initial page load. Browsers may block audible autoplay until a user gesture. */
  useEffect(() => {
    if (hasAudio) startMusic();
  }, [hasAudio, data.music]);

  /* Retry when the final letter page appears in case initial autoplay was blocked. */
  useEffect(() => {
    if (page === 'letter' && hasAudio) startMusic();
  }, [page, hasAudio, data.music]);

  const stopMusic = (reset: boolean) => {
    const a = audioRef.current;
    if (!a) return;
    fadeTo(a, 0, 700, () => { a.pause(); if (reset) a.currentTime = 0; });
  };

  /* every navigation comes from a tap, so the song may start right when the envelope page opens */
  const go = (p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0 });
    if (p === 'welcome') stopMusic(true);
    else startMusic(); // first navigation is a user gesture, so autoplay is more likely to be allowed
  };

  useEffect(() => () => window.clearTimeout(welcomeTimer.current), []);

  const openSurprise = () => {
    if (welcomeOpening) return;

    setWelcomeOpening(true);
    startMusic(); // The welcome click is the browser's user-gesture permission for audio.

    const palette = ['#ffd98a', '#f7a9b8', '#fff4d7', '#d9b7ff', '#f4c76b'];
    const centers = [{ x: 18, y: 27 }, { x: 50, y: 18 }, { x: 82, y: 28 }];
    const base = Date.now();
    const sparks = centers.flatMap((center, burst) =>
      Array.from({ length: 26 }, (_, index) => {
        const angle = (Math.PI * 2 * index) / 26 + (burst % 2) * 0.08;
        const distance = 48 + Math.random() * 76;
        return {
          id: base + burst * 100 + index,
          x: center.x,
          y: center.y,
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance,
          color: palette[(index + burst * 2) % palette.length],
          delay: burst * 110 + Math.random() * 90,
          size: 2 + Math.random() * 2.4,
        };
      })
    );

    setFireworks(sparks);
    welcomeTimer.current = window.setTimeout(() => {
      setFireworks([]);
      setWelcomeOpening(false);
      go('message');
    }, 1450);
  };

  const sendLove = () => {
    const base = Date.now();
    const batch = Array.from({ length: 16 }, (_, i) => ({
      id: base + i, x: Math.random() * 100, s: 0.9 + Math.random() * 1.5, d: 2.4 + Math.random() * 2,
    }));
    setHearts((h) => [...h, ...batch]);
    const palette = ['#fff4cf', '#ffcb58', '#c92d40', '#f5a25b', '#ffe8f0'];
    const sparks = Array.from({ length: 54 }, (_, i) => {
      const burst = i % 3;
      const angle = Math.random() * Math.PI * 2;
      const distance = 55 + Math.random() * 180;
      return {
        id: base + 100 + i, x: 18 + burst * 32 + Math.random() * 10, y: 22 + Math.random() * 45,
        dx: Math.cos(angle) * distance, dy: Math.sin(angle) * distance,
        color: palette[(i + burst * 2) % palette.length], delay: burst * 140 + Math.random() * 100,
        size: 2 + Math.random() * 2.5,
      };
    });
    setFireworks(sparks);
    window.setTimeout(() => { setHearts((h) => h.filter((b) => !batch.some((x) => x.id === b.id))); setFireworks([]); }, 3000);
  };

  const paragraphs = data.letter.split(/\n{2,}/).filter(Boolean);
  const wide = typeof window !== 'undefined' && window.matchMedia('(min-width: 900px)').matches;
  const openMemory = (i: number) => setViewer({ list: data.photos, i });
  const openReel = (i: number) => setViewer({ list: reel, i });

  return (
    <main className="world">
      <div className="ambient-art" aria-hidden="true">
        <img className="ambient ambient-letter ambient-letter-one" src="/asset/love-letter-01.png" alt="" />
        <img className="ambient ambient-letter ambient-letter-two" src="/asset/love-letter-02.png" alt="" />
        <img className="ambient ambient-moon" src="/asset/moon-cloud.png" alt="" />
        <img className="ambient ambient-heart-cloud" src="/asset/heart-cloud.png" alt="" />
        {ambient && <>
          <img className="ambient ambient-gif ambient-butterfly" src="/asset/gif/twntysix-butterfly-26001.gif" alt="" />
          <img className="ambient ambient-gif ambient-cute" src="/asset/gif/kuzu420-cute-23523_512.gif" alt="" />
          {wide && <img className="ambient ambient-gif ambient-cherries" src="/asset/gif/alanajordan-cherries-26093.gif" alt="" />}
        </>}
      </div>
      <div className="dust" aria-hidden="true">
        {Array.from({ length: 22 }, (_, i) => <i key={i} style={{ left: (i * 37) % 100 + '%', animationDelay: (i % 7) + 's' }} />)}
      </div>
      {fireworks.length > 0 && (
        <div className="fireworks" aria-hidden="true">
          {fireworks.map((spark) => (
            <i
              key={spark.id}
              className="firework-spark"
              style={{
                left: `${spark.x}%`,
                top: `${spark.y}%`,
                width: `${spark.size}px`,
                height: `${spark.size * 2.8}px`,
                background: spark.color,
                color: spark.color,
                ['--spark-x' as string]: `${spark.dx}px`,
                ['--spark-y' as string]: `${spark.dy}px`,
                ['--spark-delay' as string]: `${spark.delay}ms`,
              }}
            />
          ))}
        </div>
      )}
      <div className="brand">♡ <span>{data.title.toUpperCase()}</span></div>

      <AnimatePresence mode="wait">
        {page === 'welcome' && (
          <motion.section className="screen welcome-screen" key="welcome" {...screen}>
            <button
              type="button"
              className={'gift' + (welcomeOpening ? ' gift-opening' : '')}
              onClick={openSurprise}
              aria-label="Tap the gift to open your surprise"
              disabled={welcomeOpening}
            >
              <span className="gift-glow" />
              <span className="gift-box">
                <span className="gift-ribbon" />
                <span className="gift-heart">♡</span>
              </span>
              <span className="gift-lid">
                <span className="gift-lid-ribbon" />
                <span className="gift-bow gift-bow-left" />
                <span className="gift-bow gift-bow-right" />
                <span className="gift-bow-knot" />
              </span>
              <span className="gift-sparkle gift-sparkle-one">✦</span>
              <span className="gift-sparkle gift-sparkle-two">✧</span>
              <span className="gift-sparkle gift-sparkle-three">✦</span>
            </button>
            <small className="eyebrow">A LITTLE SURPRISE FOR YOU</small>
            <h1>{data.welcome}</h1>
            <p>{data.subtitle}</p>
            <button className="primary welcome-cta" onClick={openSurprise} disabled={welcomeOpening}>
              {welcomeOpening ? 'Opening your surprise…' : 'Open your surprise ♡'}
            </button>
            <small className="bottom">MADE WITH ALL MY HEART</small>
          </motion.section>
        )}

        {page === 'message' && (
          <motion.section className="screen" key="message" {...screen}>
            <div className="big-heart" aria-hidden="true">♡</div>
            <small className="eyebrow">BEFORE THE MAGIC BEGINS</small>
            <h2>{data.message}</h2>
            <p className="script">You are a beautiful part of my world.</p>
            <button className="primary" onClick={() => go('birthday')}>There’s more… ♡</button>
          </motion.section>
        )}

        {page === 'birthday' && (
          <motion.section className="screen" key="birthday" {...screen}>
            <div className="confetti" aria-hidden="true">
              {Array.from({ length: 26 }, (_, i) => (
                <i key={i} style={{ left: (i * 37 + 11) % 100 + '%', animationDelay: (i % 9) * 0.45 + 's', background: ['#8B1E20', '#C9A46D', '#B80F1A', '#e8c9a0'][i % 4] }} />
              ))}
            </div>
            <small className="eyebrow">TODAY IS ALL ABOUT YOU</small>
            <button className="cake cake-showcase" type="button" onClick={sendLove} aria-label="Tap the birthday cake for fireworks">
              <span className="cake-shadow" />
              <span className="cake-plate" />
              <span className="cake-tier cake-bottom"><span className="icing drip-bottom" /></span>
              <span className="cake-tier cake-top"><span className="icing drip-top" /></span>
              <span className="cake-berries" aria-hidden="true"><i /><i /><i /><i /><i /></span>
              <span className="cake-candle"><span className="flame" /></span>
              <span className="cake-sparkle sparkle-one">✦</span><span className="cake-sparkle sparkle-two">✧</span>
            </button>
            <h1>{data.birthday}</h1>
            <p>{data.birthdaySub}</p>
            <button className="primary" onClick={sendLove}>Send more love <Heart size={16} /></button>
            <button className="quiet" onClick={() => go('gallery')}>See our little memories ↓</button>
          </motion.section>
        )}

        {page === 'gallery' && (
          <motion.section className="gallery" key="gallery" {...screen}>
            <small className="eyebrow">CHAPTER ONE · THE LITTLE THINGS</small>
            <h2>Moments I’d <i>keep forever.</i></h2>
            <p>Every picture holds a little piece of happiness.</p>
            <div className="scrapbook">
              {data.photos.map((p, i) => (
                <motion.div
                  key={i}
                  className="memory-wrap"
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '0px 0px -8% 0px' }}
                  transition={{ duration: 0.6, delay: (i % 3) * 0.08 }}
                >
                  <button className="memory" style={{ ['--tilt' as string]: TILTS[i % TILTS.length] + 'deg' }} onClick={() => openMemory(i)} aria-label={`Open photo: ${p.caption}`}>
                    <img src={p.url} alt={p.caption} loading="lazy" decoding="async" style={{ objectPosition: p.pos }} />
                    <span>{p.caption}</span>
                  </button>
                </motion.div>
              ))}
            </div>
            <button className="primary" onClick={() => go('envelope')}>One last surprise ♡</button>
          </motion.section>
        )}

        {page === 'envelope' && <Envelope key="envelope" line={data.envelope} onOpened={() => go('letter')} onMusicStart={startMusic} />}

        {page === 'letter' && (
          <motion.section className="letter-page" key="letter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9 }}>
            <p className="reel-label">our little camera roll ✦</p>
            <FilmStrip frames={reel} reverse onOpen={openReel} />
            <article>
              <small className="eyebrow">A FEW WORDS, JUST FOR YOU</small>
              <h1>{data.letterTitle}</h1>
              {paragraphs.map((t, i) => (
                <motion.p key={i} className="letter-copy" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '0px 0px -6% 0px' }} transition={{ duration: 0.9 }}>{t}</motion.p>
              ))}
              <p className="closing">{data.closing}</p>
              <p className="signature">With love, {data.sender}</p>
              <footer>THIS LITTLE WORLD WAS MADE ONLY FOR YOU ♡</footer>
            </article>
            <FilmStrip frames={[...reel].reverse()} onOpen={(i) => openReel(reel.length - 1 - i)} />
            <button className="quiet" onClick={() => go('welcome')}>Experience it again ↗</button>
          </motion.section>
        )}
      </AnimatePresence>

      {BACK[page] && <button className="back" onClick={() => go(BACK[page] as Page)}>← Back</button>}

      {hasAudio && (
        <button className="music" aria-label={playing ? 'Pause music' : 'Play music'} onClick={() => (playing ? stopMusic(false) : startMusic())}>
          {playing ? <Volume2 size={18} /> : <VolumeX size={18} />}<span>{playing ? 'Music on' : 'Music off'}</span>
        </button>
      )}

      <div className="hearts" aria-hidden="true">
        {hearts.map((h) => <span key={h.id} style={{ left: h.x + '%', fontSize: h.s + 'rem', animationDuration: h.d + 's' }}>♥</span>)}
      </div>

      <AnimatePresence>
        {viewer && <Viewer list={viewer.list} index={viewer.i} setIndex={(i) => setViewer({ list: viewer.list, i })} close={() => setViewer(null)} />}
      </AnimatePresence>

    </main>
  );
}
