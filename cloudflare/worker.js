// api/index.ts
import { env as env2 } from "cloudflare:workers";

// lib/server.ts
import { env } from "cloudflare:workers";
var ApiError = class extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
  status;
};
var db = () => {
  if (!env.DB) throw new Error("Database unavailable");
  return env.DB;
};
var uid = () => crypto.randomUUID().replaceAll("-", "");
var secret = () => uid() + uid();
async function hash(s) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, "0")).join("");
}
function txt(v, max = 120, required = true) {
  if (typeof v !== "string" || v.length > max || required && !v.trim()) throw new ApiError("\u0644\u0637\u0641\u0627\u064B \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0631\u0627 \u06A9\u0627\u0645\u0644 \u0648 \u06A9\u0648\u062A\u0627\u0647 \u0648\u0627\u0631\u062F \u06A9\u0646.");
  return v.trim();
}
function money(v) {
  const n = Number(v);
  if (!Number.isSafeInteger(n) || n < 0 || n > 1e12) throw new ApiError("\u0645\u0628\u0644\u063A \u0645\u0639\u062A\u0628\u0631 \u0628\u0647 \u062A\u0648\u0645\u0627\u0646 \u0648\u0627\u0631\u062F \u06A9\u0646.");
  return n;
}
function url(v) {
  if (!v) return "";
  const s = txt(v, 1500);
  try {
    const u = new URL(s);
    if (!["https:", "http:"].includes(u.protocol)) throw 0;
    return u.href;
  } catch {
    throw new ApiError("\u0644\u06CC\u0646\u06A9 \u0645\u06A9\u0627\u0646 \u0628\u0627\u06CC\u062F \u06CC\u06A9 \u0622\u062F\u0631\u0633 \u0645\u0639\u062A\u0628\u0631 \u0628\u0627\u0634\u062F.");
  }
}
function dateTime(date, time) {
  const d = txt(date, 10), t = txt(time, 5);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(t) || Number.isNaN(Date.parse(d + "T" + t + ":00+03:30")) || (/* @__PURE__ */ new Date(d + "T12:00:00Z")).toISOString().slice(0, 10) !== d) throw new ApiError("\u062A\u0627\u0631\u06CC\u062E \u0648 \u0633\u0627\u0639\u062A \u0645\u0639\u062A\u0628\u0631 \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646.");
  return { date: d, time: t };
}
async function body(req) {
  if (!req.headers.get("content-type")?.includes("application/json")) throw new ApiError("\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A.");
  const raw = await req.text();
  if (raw.length > 32e3) throw new ApiError("\u062D\u062C\u0645 \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0628\u06CC\u0634\u062A\u0631 \u0627\u0632 \u062D\u062F \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 413);
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw 0;
    return parsed;
  } catch {
    throw new ApiError("\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A.");
  }
}
async function rate(req, scope, limit) {
  const hour = Math.floor(Date.now() / 36e5), key = await hash(`${scope}:${req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "local"}:${hour}`);
  const r = await db().prepare("INSERT INTO rate_limits (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count").bind(key, Date.now() + 36e5).first();
  if (r && r.count > limit) throw new ApiError("\u062A\u0639\u062F\u0627\u062F \u062F\u0631\u062E\u0648\u0627\u0633\u062A\u200C\u0647\u0627 \u0632\u06CC\u0627\u062F \u0634\u062F\u0647\u061B \u06A9\u0645\u06CC \u0628\u0639\u062F \u062F\u0648\u0628\u0627\u0631\u0647 \u062A\u0644\u0627\u0634 \u06A9\u0646.", 429);
}
function response(value, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" } });
}
async function handle(fn) {
  try {
    return response(await fn());
  } catch (e) {
    if (e instanceof ApiError) return response({ error: e.message }, e.status);
    console.error("Gathering API failure", e instanceof Error ? e.message : "unknown");
    return response({ error: "\u0627\u0631\u062A\u0628\u0627\u0637 \u0628\u0627 \u0633\u0631\u0648\u06CC\u0633 \u0628\u0631\u0642\u0631\u0627\u0631 \u0646\u0634\u062F. \u062F\u0648\u0628\u0627\u0631\u0647 \u062A\u0644\u0627\u0634 \u06A9\u0646." }, 500);
  }
}
async function gathering(id) {
  if (!/^[a-f0-9]{32}$/.test(id)) throw new ApiError("\u0627\u06CC\u0646 \u062F\u0648\u0631\u0647\u0645\u06CC \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F.", 404);
  const e = await db().prepare("SELECT id,title,kind,description,budget,final_time_id AS finalTimeId,final_place_id AS finalPlaceId,created_at AS createdAt FROM gatherings WHERE id=?").bind(id).first();
  if (!e) throw new ApiError("\u0627\u06CC\u0646 \u062F\u0648\u0631\u0647\u0645\u06CC \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F \u06CC\u0627 \u062D\u0630\u0641 \u0634\u062F\u0647.", 404);
  return e;
}
async function member(req, id, required = true) {
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (token && /^[a-f0-9]{64}$/.test(token)) {
    const m = await db().prepare("SELECT id,name,role,attendance,created_at AS createdAt FROM members WHERE event_id=? AND token_hash=?").bind(id, await hash(token)).first();
    if (m) return m;
  }
  if (required) throw new ApiError("\u0628\u0631\u0627\u06CC \u0645\u0634\u0627\u0631\u06A9\u062A\u060C \u0627\u0648\u0644 \u0628\u0647 \u062F\u0648\u0631\u0647\u0645\u06CC \u0628\u067E\u06CC\u0648\u0646\u062F.", 401);
  return null;
}
function host(m) {
  if (m.role !== "host") throw new ApiError("\u0627\u06CC\u0646 \u06A9\u0627\u0631 \u0641\u0642\u0637 \u0628\u0627 \u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u06CC\u0632\u0628\u0627\u0646 \u0627\u0646\u062C\u0627\u0645 \u0645\u06CC\u200C\u0634\u0648\u062F.", 403);
}
async function option(id, eventId) {
  const o = await db().prepare("SELECT * FROM options WHERE id=? AND event_id=?").bind(id, eventId).first();
  if (!o) throw new ApiError("\u0627\u06CC\u0646 \u06AF\u0632\u06CC\u0646\u0647 \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F.", 404);
  return o;
}
async function createEvent(req) {
  const b = await body(req);
  await rate(req, "create", 20);
  const id = uid(), mid = uid(), token = secret(), now = Date.now(), kind = ["cafe", "picnic", "game", "party"].includes(b.kind) ? b.kind : "cafe";
  const title = txt(b.title, 100), description = txt(b.description || "", 1200, false), name = txt(b.hostName, 40), budget = money(b.budget || 0);
  if (!Array.isArray(b.times) || !b.times.length || b.times.length > 12) throw new ApiError("\u062D\u062F\u0627\u0642\u0644 \u06CC\u06A9 \u0632\u0645\u0627\u0646 \u0628\u0631\u0627\u06CC \u0631\u0623\u06CC\u200C\u06AF\u06CC\u0631\u06CC \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646.");
  if (!Array.isArray(b.places) || b.places.length > 12) throw new ApiError("\u06AF\u0632\u06CC\u0646\u0647\u200C\u0647\u0627\u06CC \u0645\u06A9\u0627\u0646 \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A.");
  const statements = [db().prepare("INSERT INTO gatherings (id,title,kind,description,budget,created_at) VALUES (?,?,?,?,?,?)").bind(id, title, kind, description, budget, now), db().prepare("INSERT INTO members (id,event_id,name,role,token_hash,created_at) VALUES (?,?,?,'host',?,?)").bind(mid, id, name, await hash(token), now)];
  const seen = /* @__PURE__ */ new Set();
  for (const t of b.times) {
    const v = dateTime(t.date, t.time);
    if (seen.has(v.date + v.time)) continue;
    seen.add(v.date + v.time);
    statements.push(db().prepare("INSERT INTO options (id,event_id,kind,date,time,created_at) VALUES (?,?,'time',?,?,?)").bind(uid(), id, v.date, v.time, now));
  }
  for (const p of b.places) statements.push(db().prepare("INSERT INTO options (id,event_id,kind,label,address,url,created_at) VALUES (?,?,'place',?,?,?,?)").bind(uid(), id, txt(p.label, 100), txt(p.address || "", 400, false), url(p.url), now));
  await db().batch(statements);
  await db().prepare("DELETE FROM rate_limits WHERE expires<?").bind(Date.now()).run();
  return { id, token, memberId: mid };
}
async function readEvent(req, id) {
  const event = await gathering(id), data = await db().batch([
    db().prepare("SELECT id,name,role,attendance,created_at AS createdAt FROM members WHERE event_id=? ORDER BY created_at,id").bind(id),
    db().prepare("SELECT id,kind,label,date,time,address,url,created_at AS createdAt FROM options WHERE event_id=? ORDER BY date,time,created_at,id").bind(id),
    db().prepare("SELECT v.option_id AS optionId,v.member_id AS memberId,v.value FROM votes v JOIN options o ON o.id=v.option_id WHERE o.event_id=?").bind(id),
    db().prepare("SELECT id,title,quantity,assignee_id AS assigneeId,done,author_id AS authorId,created_at AS createdAt FROM tasks WHERE event_id=? ORDER BY created_at,id").bind(id),
    db().prepare("SELECT id,title,amount,payer_id AS payerId,participant_ids AS participantIds,author_id AS authorId,created_at AS createdAt FROM expenses WHERE event_id=? ORDER BY created_at DESC,id").bind(id),
    db().prepare("SELECT id,author_id AS authorId,topic,body,created_at AS createdAt FROM comments WHERE event_id=? ORDER BY created_at,id").bind(id)
  ]);
  return { event, members: data[0].results, options: data[1].results, votes: data[2].results, tasks: data[3].results, expenses: data[4].results.map((e) => ({ ...e, participantIds: JSON.parse(e.participantIds) })), comments: data[5].results, me: await member(req, id, false) };
}
async function act(req, id) {
  const b = await body(req);
  await gathering(id);
  const now = Date.now();
  if (b.action === "join") {
    await rate(req, "join", 100);
    if (await member(req, id, false)) throw new ApiError("\u0642\u0628\u0644\u0627\u064B \u0628\u0647 \u0627\u06CC\u0646 \u062F\u0648\u0631\u0647\u0645\u06CC \u067E\u06CC\u0648\u0633\u062A\u0647\u200C\u0627\u06CC.");
    const count = await db().prepare("SELECT COUNT(*) AS n FROM members WHERE event_id=?").bind(id).first();
    if (count && count.n >= 100) throw new ApiError("\u0638\u0631\u0641\u06CC\u062A \u0627\u06CC\u0646 \u062F\u0648\u0631\u0647\u0645\u06CC \u062A\u06A9\u0645\u06CC\u0644 \u0634\u062F\u0647.");
    const mid = uid(), token = secret();
    await db().prepare("INSERT INTO members (id,event_id,name,role,token_hash,created_at) VALUES (?,?,?,'guest',?,?)").bind(mid, id, txt(b.name, 40), await hash(token), now).run();
    return { token, memberId: mid };
  }
  const m = await member(req, id);
  if (b.action === "vote") {
    await option(txt(b.optionId, 32), id);
    if (!["yes", "maybe", "no"].includes(b.value)) throw new ApiError("\u0631\u0623\u06CC \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A.");
    await db().prepare("INSERT INTO votes (option_id,member_id,value) VALUES (?,?,?) ON CONFLICT(option_id,member_id) DO UPDATE SET value=excluded.value").bind(b.optionId, m.id, b.value).run();
  } else if (b.action === "addOption") {
    host(m);
    const n = await db().prepare("SELECT COUNT(*) AS n FROM options WHERE event_id=?").bind(id).first();
    if (n && n.n >= 30) throw new ApiError("\u062D\u062F\u0627\u06A9\u062B\u0631 \u06F3\u06F0 \u06AF\u0632\u06CC\u0646\u0647 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646 \u0627\u0636\u0627\u0641\u0647 \u06A9\u0631\u062F.");
    if (b.kind === "time") {
      const v = dateTime(b.date, b.time);
      await db().prepare("INSERT INTO options (id,event_id,kind,date,time,created_at) VALUES (?,?,'time',?,?,?)").bind(uid(), id, v.date, v.time, now).run();
    } else if (b.kind === "place") await db().prepare("INSERT INTO options (id,event_id,kind,label,address,url,created_at) VALUES (?,?,'place',?,?,?,?)").bind(uid(), id, txt(b.label, 100), txt(b.address || "", 400, false), url(b.url), now).run();
    else throw new ApiError("\u06AF\u0632\u06CC\u0646\u0647 \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A.");
  } else if (b.action === "finalize") {
    host(m);
    const o = await option(txt(b.optionId, 32), id);
    const column = o.kind === "time" ? "final_time_id" : "final_place_id";
    await db().prepare(`UPDATE gatherings SET ${column}=? WHERE id=?`).bind(b.clear ? null : o.id, id).run();
  } else if (b.action === "removeOption") {
    host(m);
    const o = await option(txt(b.optionId, 32), id);
    await db().batch([db().prepare("UPDATE gatherings SET final_time_id=CASE WHEN final_time_id=? THEN NULL ELSE final_time_id END,final_place_id=CASE WHEN final_place_id=? THEN NULL ELSE final_place_id END WHERE id=?").bind(o.id, o.id, id), db().prepare("DELETE FROM options WHERE id=? AND event_id=?").bind(o.id, id)]);
  } else if (b.action === "addTask") {
    const n = await db().prepare("SELECT COUNT(*) AS n FROM tasks WHERE event_id=?").bind(id).first();
    if (n && n.n >= 200) throw new ApiError("\u062D\u062F\u0627\u06A9\u062B\u0631 \u06F2\u06F0\u06F0 \u062E\u0631\u06CC\u062F \u0645\u06CC\u200C\u062A\u0648\u0627\u0646 \u062B\u0628\u062A \u06A9\u0631\u062F.");
    await db().prepare("INSERT INTO tasks (id,event_id,title,quantity,assignee_id,done,author_id,created_at) VALUES (?,?,?,?,?,0,?,?)").bind(uid(), id, txt(b.title, 120), txt(b.quantity || "", 60, false), b.claim ? m.id : null, m.id, now).run();
  } else if (["claimTask", "toggleTask", "deleteTask"].includes(b.action)) {
    const t = await db().prepare("SELECT * FROM tasks WHERE id=? AND event_id=?").bind(txt(b.taskId, 32), id).first();
    if (!t) throw new ApiError("\u0627\u06CC\u0646 \u062E\u0631\u06CC\u062F \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F.", 404);
    if (b.action === "claimTask") {
      if (t.assignee_id && t.assignee_id !== m.id) throw new ApiError("\u0627\u06CC\u0646 \u062E\u0631\u06CC\u062F \u0631\u0627 \u06CC\u06A9\u06CC \u062F\u06CC\u06AF\u0631 \u0642\u0628\u0648\u0644 \u06A9\u0631\u062F\u0647\u061B \u0635\u0641\u062D\u0647 \u0631\u0627 \u062A\u0627\u0632\u0647 \u06A9\u0646.", 409);
      if (t.done) throw new ApiError("\u0627\u06CC\u0646 \u062E\u0631\u06CC\u062F \u0627\u0646\u062C\u0627\u0645 \u0634\u062F\u0647.");
      await db().prepare("UPDATE tasks SET assignee_id=? WHERE id=? AND (assignee_id IS NULL OR assignee_id=?)").bind(t.assignee_id === m.id ? null : m.id, t.id, m.id).run();
    } else if (b.action === "toggleTask") {
      if (m.role !== "host" && t.assignee_id && t.assignee_id !== m.id) throw new ApiError("\u0641\u0642\u0637 \u0645\u0633\u0626\u0648\u0644 \u0627\u06CC\u0646 \u062E\u0631\u06CC\u062F \u06CC\u0627 \u0645\u06CC\u0632\u0628\u0627\u0646 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0622\u0646 \u0631\u0627 \u062A\u063A\u06CC\u06CC\u0631 \u062F\u0647\u062F.", 403);
      await db().prepare("UPDATE tasks SET done=?,assignee_id=COALESCE(assignee_id,?) WHERE id=?").bind(t.done ? 0 : 1, m.id, t.id).run();
    } else {
      if (m.role !== "host" && t.author_id !== m.id) throw new ApiError("\u0641\u0642\u0637 \u062B\u0628\u062A\u200C\u06A9\u0646\u0646\u062F\u0647 \u06CC\u0627 \u0645\u06CC\u0632\u0628\u0627\u0646 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u062E\u0631\u06CC\u062F \u0631\u0627 \u062D\u0630\u0641 \u06A9\u0646\u062F.", 403);
      await db().prepare("DELETE FROM tasks WHERE id=?").bind(t.id).run();
    }
  } else if (b.action === "addExpense") {
    const amount = money(b.amount);
    if (!amount) throw new ApiError("\u0645\u0628\u0644\u063A \u0628\u0627\u06CC\u062F \u0628\u06CC\u0634\u062A\u0631 \u0627\u0632 \u0635\u0641\u0631 \u0628\u0627\u0634\u062F.");
    const ids = (await db().prepare("SELECT id FROM members WHERE event_id=?").bind(id).all()).results.map((x) => x.id), participants = Array.isArray(b.participantIds) ? Array.from(new Set(b.participantIds)) : [];
    if (!participants.length || participants.some((x) => !ids.includes(x)) || !ids.includes(b.payerId)) throw new ApiError("\u067E\u0631\u062F\u0627\u062E\u062A\u200C\u06A9\u0646\u0646\u062F\u0647 \u0648 \u0627\u0641\u0631\u0627\u062F \u0634\u0631\u06CC\u06A9 \u0647\u0632\u06CC\u0646\u0647 \u0631\u0627 \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646.");
    const n = await db().prepare("SELECT COUNT(*) AS n FROM expenses WHERE event_id=?").bind(id).first();
    if (n && n.n >= 500) throw new ApiError("\u062D\u062F\u0627\u06A9\u062B\u0631 \u06F5\u06F0\u06F0 \u0647\u0632\u06CC\u0646\u0647 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646 \u062B\u0628\u062A \u06A9\u0631\u062F.");
    await db().prepare("INSERT INTO expenses (id,event_id,title,amount,payer_id,participant_ids,author_id,created_at) VALUES (?,?,?,?,?,?,?,?)").bind(uid(), id, txt(b.title, 120), amount, b.payerId, JSON.stringify(participants.sort()), m.id, now).run();
  } else if (b.action === "deleteExpense") {
    const x = await db().prepare("SELECT author_id FROM expenses WHERE id=? AND event_id=?").bind(txt(b.expenseId, 32), id).first();
    if (!x) throw new ApiError("\u0647\u0632\u06CC\u0646\u0647 \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F.", 404);
    if (m.role !== "host" && x.author_id !== m.id) throw new ApiError("\u0641\u0642\u0637 \u062B\u0628\u062A\u200C\u06A9\u0646\u0646\u062F\u0647 \u06CC\u0627 \u0645\u06CC\u0632\u0628\u0627\u0646 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0647\u0632\u06CC\u0646\u0647 \u0631\u0627 \u062D\u0630\u0641 \u06A9\u0646\u062F.", 403);
    await db().prepare("DELETE FROM expenses WHERE id=? AND event_id=?").bind(b.expenseId, id).run();
  } else if (b.action === "rsvp") {
    if (!["yes", "maybe", "no"].includes(b.status)) throw new ApiError("\u0648\u0636\u0639\u06CC\u062A \u062D\u0636\u0648\u0631\u062A \u0631\u0627 \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646.");
    await db().prepare("UPDATE members SET name=?,attendance=? WHERE id=? AND event_id=?").bind(txt(b.name, 40), b.status, m.id, id).run();
  } else if (b.action === "addComment") {
    await rate(req, "comment", 100);
    const text = txt(b.text, 1200), topic = txt(b.topic || "general", 10);
    if (!["general", "time", "place"].includes(topic)) throw new ApiError("\u0645\u0648\u0636\u0648\u0639 \u0646\u0638\u0631 \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A.");
    const count = await db().prepare("SELECT COUNT(*) AS n FROM comments WHERE event_id=?").bind(id).first();
    if (count && count.n >= 500) throw new ApiError("\u062A\u0639\u062F\u0627\u062F \u0646\u0638\u0631\u0647\u0627\u06CC \u0627\u06CC\u0646 \u062F\u0648\u0631\u0647\u0645\u06CC \u0628\u0647 \u0633\u0642\u0641 \u0645\u062C\u0627\u0632 \u0631\u0633\u06CC\u062F\u0647.");
    await db().prepare("INSERT INTO comments (id,event_id,author_id,topic,body,created_at) VALUES (?,?,?,?,?,?)").bind(uid(), id, m.id, topic, text, now).run();
  } else if (b.action === "deleteComment") {
    const c = await db().prepare("SELECT author_id FROM comments WHERE id=? AND event_id=?").bind(txt(b.commentId, 32), id).first();
    if (!c) throw new ApiError("\u0646\u0638\u0631 \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F.", 404);
    if (m.role !== "host" && c.author_id !== m.id) throw new ApiError("\u0641\u0642\u0637 \u0646\u0648\u06CC\u0633\u0646\u062F\u0647 \u06CC\u0627 \u0645\u06CC\u0632\u0628\u0627\u0646 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0646\u0638\u0631 \u0631\u0627 \u062D\u0630\u0641 \u06A9\u0646\u062F.", 403);
    await db().prepare("DELETE FROM comments WHERE id=? AND event_id=?").bind(b.commentId, id).run();
  } else if (b.action === "edit") {
    host(m);
    await db().prepare("UPDATE gatherings SET title=?,description=?,budget=? WHERE id=?").bind(txt(b.title, 100), txt(b.description || "", 1200, false), money(b.budget || 0), id).run();
  } else if (b.action === "rename") {
    await db().prepare("UPDATE members SET name=? WHERE id=?").bind(txt(b.name, 40), m.id).run();
  } else if (b.action === "delete") {
    host(m);
    await db().prepare("DELETE FROM gatherings WHERE id=?").bind(id).run();
  } else throw new ApiError("\u0627\u06CC\u0646 \u0639\u0645\u0644\u06CC\u0627\u062A \u067E\u0634\u062A\u06CC\u0628\u0627\u0646\u06CC \u0646\u0645\u06CC\u200C\u0634\u0648\u062F.");
  return { ok: true };
}

// api/index.ts
var siteOrigin = "https://mohammadtardasti9211-boop.github.io";
var index_default = { async fetch(request) {
  const url2 = new URL(request.url), origin = request.headers.get("Origin");
  const local = ["localhost", "127.0.0.1"].includes(url2.hostname);
  const allowed = origin === siteOrigin || local && origin !== null && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (origin && !allowed) return Response.json({ error: "\u0627\u06CC\u0646 \u0645\u0628\u062F\u0623 \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A." }, { status: 403 });
  if (request.method === "POST" && !allowed) return Response.json({ error: "\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A." }, { status: 403 });
  const cors = { ...allowed ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Max-Age": "600" } : {}, "Vary": "Origin", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };
  if (request.method === "OPTIONS") return new Response(null, { status: allowed ? 204 : 403, headers: cors });
  let response2;
  if (url2.pathname === "/api/health" && request.method === "GET") response2 = await handle(async () => {
    await env2.DB.prepare("SELECT attendance FROM members LIMIT 1").all();
    await env2.DB.prepare("SELECT id FROM comments LIMIT 1").all();
    return { ok: true };
  });
  else if (url2.pathname === "/api/events" && request.method === "POST") response2 = await handle(() => createEvent(request));
  else {
    const match = url2.pathname.match(/^\/api\/events\/([a-f0-9]{32})(\/actions)?$/);
    if (match && request.method === "GET" && !match[2]) response2 = await handle(() => readEvent(request, match[1]));
    else if (match && request.method === "POST" && match[2]) response2 = await handle(() => act(request, match[1]));
    else response2 = Response.json({ error: "\u067E\u06CC\u062F\u0627 \u0646\u0634\u062F." }, { status: 404 });
  }
  const headers = new Headers(response2.headers);
  for (const [k, v] of Object.entries(cors)) headers.set(k, v);
  return new Response(response2.body, { status: response2.status, headers });
} };
export {
  index_default as default
};
