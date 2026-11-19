import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Lock, Save, Upload } from 'lucide-react';
import { db } from './supabase';
import { initial, mergeContent } from './data';
import type { Data, TextKey } from './data';

const FIELDS: [TextKey, string][] = [
  ['title', 'Site title'], ['sender', 'Signed by'], ['welcome', 'Welcome headline'],
  ['subtitle', 'Welcome subtitle'], ['message', 'Personal message'], ['birthday', 'Birthday headline'],
  ['birthdaySub', 'Birthday subtitle'], ['letterTitle', 'Letter title'],
  ['envelope', 'Envelope line'], ['closing', 'Closing line'],
];
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [draft, setDraft] = useState<Data>(initial);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!db) return;
    db.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = db.auth.onAuthStateChange((_e, s) => setSession(s));
    db.from('birthday_content').select('content').eq('id', 1).eq('published', true).maybeSingle()
      .then(({ data }) => { if (data?.content) setDraft(mergeContent(data.content as Partial<Data>)); });
    return () => subscription.unsubscribe();
  }, []);

  const patch = <K extends keyof Data>(k: K, v: Data[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const login = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await db.auth.signInWithPassword({
      email: String(f.get('email')), password: String(f.get('password')),
    });
    setBusy(false);
    setNotice(error?.message || 'Signed in');
  };

  const publish = async () => {
    if (!db || !session) return;
    setBusy(true);
    const { error } = await db.from('birthday_content').upsert({
      id: 1, content: draft, published: true, updated_at: new Date().toISOString(),
    });
    setBusy(false);
    setNotice(error?.message || 'Published successfully');
  };

  const uploadPhoto = async (i: number, file?: File) => {
    if (!db || !file) return;
    if (!IMAGE_TYPES.includes(file.type) || file.size > 8388608) { setNotice('Use JPG, PNG or WebP under 8 MB'); return; }
    const path = `gallery/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    const { error } = await db.storage.from('birthday-media').upload(path, file);
    if (error) { setNotice(error.message); return; }
    const url = db.storage.from('birthday-media').getPublicUrl(path).data.publicUrl;
    const photos = [...draft.photos];
    photos[i] = { ...photos[i], url };
    patch('photos', photos);
  };

  const uploadMusic = async (file?: File) => {
    if (!db || !file) return;
    const path = `music/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
    const { error } = await db.storage.from('birthday-media').upload(path, file);
    if (error) { setNotice(error.message); return; }
    patch('music', db.storage.from('birthday-media').getPublicUrl(path).data.publicUrl);
  };

  return (
    <main className="admin">
      <header><a href="/">♡ little love story</a><span>PRIVATE STUDIO</span></header>
      <section className="admin-main">
        <small className="eyebrow">YOUR CREATIVE CORNER</small>
        <h1>Birthday <i>studio.</i></h1>
        <p>Every little detail, just the way you imagined it.</p>

        {!db ? (
          <div className="panel">
            <Lock />
            <h2>Connect your private studio</h2>
            <p>Add the Supabase URL and anon key to your environment variables, then run <code>supabase/schema.sql</code>. Publishing stays disabled until this is configured.</p>
            <a href="https://supabase.com/dashboard">Open Supabase ↗</a>
          </div>
        ) : !session ? (
          <form className="panel login" onSubmit={login}>
            <Lock />
            <h2>Welcome back</h2>
            <p>Sign in to edit your surprise.</p>
            <input name="email" type="email" placeholder="Admin email" autoComplete="username" required />
            <input name="password" type="password" placeholder="Password" autoComplete="current-password" required />
            <button className="primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in securely'}</button>
            <p>{notice}</p>
          </form>
        ) : (
          <>
            <div className="toolbar">
              Authenticated admin
              <button onClick={() => db?.auth.signOut().then(() => setSession(null))}>Sign out</button>
            </div>
            <div className="edit-grid">
              <section className="panel">
                <h2>01 · The story</h2>
                {FIELDS.map(([k, label]) => (
                  <label key={k}>{label}
                    <textarea rows={2} value={draft[k]} onChange={(e) => patch(k, e.target.value)} />
                  </label>
                ))}
                <label>Full love letter (blank line = new paragraph)
                  <textarea className="long" value={draft.letter} onChange={(e) => patch('letter', e.target.value)} />
                </label>
              </section>

              <section className="panel">
                <h2>02 · Fifteen memories</h2>
                <div className="slots">
                  {draft.photos.map((p, i) => (
                    <div className="slot" key={i}>
                      <img src={p.url} alt={`Memory ${i + 1}`} style={{ objectPosition: p.pos }} />
                      <label className="upload"><Upload size={14} /> Replace
                        <input type="file" accept={IMAGE_TYPES.join(',')} onChange={(e) => uploadPhoto(i, e.target.files?.[0])} />
                      </label>
                      <input
                        value={p.caption}
                        aria-label={`Caption ${i + 1}`}
                        onChange={(e) => { const a = [...draft.photos]; a[i] = { ...p, caption: e.target.value }; patch('photos', a); }}
                      />
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel">
                <h2>03 · Soundtrack</h2>
                <label><input type="checkbox" checked={draft.musicEnabled} onChange={(e) => patch('musicEnabled', e.target.checked)} /> Play music from the envelope page</label>
                <label className="upload">Upload a different MP3 / audio
                  <input type="file" accept="audio/*" onChange={(e) => uploadMusic(e.target.files?.[0])} />
                </label>
                {draft.music && <audio controls src={draft.music} />}
              </section>

              <section className="panel">
                <h2>04 · Publish</h2>
                <p>Published changes appear without redeploying.</p>
                <button className="primary" onClick={publish} disabled={busy}><Save size={16} />{busy ? 'Saving…' : 'Save & publish'}</button>
                <p>{notice}</p>
              </section>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
