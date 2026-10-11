// Learn Thai sync: one Durable Object per learner, keyed by the name in their personal link.
//
//   GET  /u/<name>      → the learner's progress JSON (404 before the first save)
//   PUT  /u/<name>      → merge the body into what's stored; returns the merged result
//   GET  /u/<name>/ws   → WebSocket; the object sends {saved} whenever any device saves
//
// No passwords, same as the app: the name in the link is the identity.

const NAME = /^[a-z0-9-]{1,30}$/;

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const cors = corsHeaders(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const m = url.pathname.match(/^\/u\/([^/]+)(\/ws)?$/);
    if (!m) return new Response('Learn Thai sync', { headers: cors });
    const name = decodeURIComponent(m[1]).toLowerCase();
    if (!NAME.test(name)) return new Response('bad name', { status: 400, headers: cors });
    const obj = env.LEARNERS.get(env.LEARNERS.idFromName(name));
    const res = await obj.fetch(req);
    if (res.status === 101) return res; // WebSocket upgrade: headers are fixed
    const h = new Headers(res.headers);
    for (const [k, v] of Object.entries(cors)) h.set(k, v);
    return new Response(res.body, { status: res.status, headers: h });
  },
};

function corsHeaders(req, env) {
  const origin = req.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim());
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0] || '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Device',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

export class Learner {
  constructor(state) {
    this.state = state;
  }

  async fetch(req) {
    if (req.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      this.state.acceptWebSocket(pair[1]); // hibernatable: costs nothing while idle
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    const stored = (await this.state.storage.get('data')) || null;
    if (req.method === 'GET') {
      return stored ? json(stored) : new Response('not found', { status: 404 });
    }
    if (req.method === 'PUT') {
      let incoming;
      try { incoming = await req.json(); } catch { return new Response('bad json', { status: 400 }); }
      if (!incoming || typeof incoming !== 'object') return new Response('bad json', { status: 400 });
      const merged = merge(stored || {}, incoming);
      merged.saved = new Date().toISOString();
      await this.state.storage.put('data', merged);
      const note = JSON.stringify({ saved: merged.saved, from: req.headers.get('X-Device') || '' });
      for (const ws of this.state.getWebSockets()) { try { ws.send(note); } catch {} }
      return json(merged);
    }
    return new Response('method not allowed', { status: 405 });
  }

  webSocketMessage(ws, msg) { if (msg === 'ping') { try { ws.send('pong'); } catch {} } }
  webSocketClose(ws) { try { ws.close(); } catch {} }
  webSocketError(ws) { try { ws.close(); } catch {} }
}

const json = data => new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

// Same rules as the app: newest change wins per phrase, daily activity keeps the larger count,
// lessons/songs keep the later finish time, settings come from the device that saved last.
function merge(base, add) {
  const out = { ...base, items: { ...(base.items || {}) }, log: { ...(base.log || {}) }, secs: { ...(base.secs || {}) }, lessons: { ...(base.lessons || {}) }, songs: { ...(base.songs || {}) } };
  for (const [id, r] of Object.entries(add.items || {})) {
    const l = out.items[id];
    if (!l || (r.updated || 0) > (l.updated || 0) || ((r.updated || 0) === (l.updated || 0) && (r.reps || 0) > (l.reps || 0))) out.items[id] = r;
  }
  for (const k of ['log', 'secs']) {
    for (const [d, v] of Object.entries(add[k] || {})) out[k][d] = Math.max(out[k][d] || 0, +v || 0);
  }
  for (const k of ['lessons', 'songs']) {
    for (const [id, v] of Object.entries(add[k] || {})) out[k][id] = Math.max(out[k][id] || 0, +v || 0);
  }
  if (add.settings) out.settings = { ...(base.settings || {}), ...add.settings };
  if (add.name) out.name = add.name;
  return out;
}
