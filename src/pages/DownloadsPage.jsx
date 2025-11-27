import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../renderer/context/AuthContext";
import api from "../renderer/services/api";

const GAMES = [
  { key: "ALL", label: "All Games" },
  { key: "ETS2", label: "Euro Truck Simulator 2" },
  { key: "ATS",  label: "American Truck Simulator" },
];

const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "size_desc", label: "Size (Large→Small)" },
  { key: "size_asc",  label: "Size (Small→Large)" },
  { key: "title",     label: "Title (A→Z)" },
];

const prettySize = (bytes = 0) => {
  const b = Number(bytes) || 0;
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b/1024).toFixed(1)} KB`;
  if (b < 1024 ** 3) return `${(b/1024**2).toFixed(1)} MB`;
  return `${(b/1024**3).toFixed(2)} GB`;
};

const isImageUrl = (url = "") =>
  /\.(png|jpe?g|webp|gif)$/i.test(url.split("?")[0] || "");

export default function DownloadsPage() {
  const { isAdmin, isStaff } = useAuth();
  const canUpload = isAdmin() || isStaff();

  const [items, setItems]   = useState([]);
  const [game, setGame]     = useState("ALL");
  const [query, setQuery]   = useState("");
  const [sort, setSort]     = useState("newest");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy]       = useState(false);
  const [err, setErr]         = useState("");
  const [succ, setSucc]       = useState("");

  const dropRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [thumbPreview, setThumbPreview] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get("/downloads", {
        params: { game: game === "ALL" ? undefined : game },
      });
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setErr("Failed to load downloads.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [game]);

  const filtered = useMemo(() => {
    let list = [...items];
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(d =>
        (d.title || "").toLowerCase().includes(q) ||
        (d.game || "").toLowerCase().includes(q)
      );
    }
    switch (sort) {
      case "oldest":
        list.sort((a,b)=> new Date(a.created_at) - new Date(b.created_at)); break;
      case "size_desc":
        list.sort((a,b)=> (b.size_bytes||0) - (a.size_bytes||0)); break;
      case "size_asc":
        list.sort((a,b)=> (a.size_bytes||0) - (b.size_bytes||0)); break;
      case "title":
        list.sort((a,b)=> (a.title||"").localeCompare(b.title||"")); break;
      default: // newest
        list.sort((a,b)=> new Date(b.created_at) - new Date(a.created_at));
    }
    return list;
  }, [items, query, sort]);

  // ---------- Upload handlers (admin/staff) ----------
  const handleFiles = async (file, thumb, title, gameVal) => {
    if (!file || !title || !gameVal) {
      setErr("Title, game and file are required.");
      return;
    }
    setBusy(true); setErr(""); setSucc("");
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("game", gameVal);
      fd.append("file", file);
      if (thumb) fd.append("thumbnail", thumb);
      await api.post("/downloads", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSucc("Upload complete.");
      setThumbPreview("");
      await fetchData();
    } catch {
      setErr("Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const onDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    if (!canUpload) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    // quick prompt for title/game
    const title = prompt("Title for this file (e.g., ENIGMA Skin v2):") || "";
    const gameVal = (prompt("Game: ETS2 or ATS") || "").toUpperCase();
    if (!["ETS2","ATS"].includes(gameVal)) return alert("Invalid game. Use ETS2 or ATS.");
    await handleFiles(file, null, title, gameVal);
  };

  const onDelete = async (id) => {
    if (!canUpload) return;
    if (!window.confirm("Delete this file?")) return;
    try {
      await api.delete(`/downloads/${id}`);
      await fetchData();
    } catch {
      setErr("Delete failed.");
    }
  };

  // ---------- UI ----------
  return (
    <div className="p-6 text-gray-200">
      {/* Top bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-[#f8cc00]">Downloads</h1>
          <div className="hidden md:flex gap-2">
            {GAMES.map(g => (
              <button
                key={g.key}
                onClick={() => setGame(g.key)}
                className={`px-3 py-1.5 rounded-full border transition ${
                  game === g.key
                    ? "border-[#f8cc00] bg-[#f8cc00]/10 text-[#f8cc00]"
                    : "border-[#2d1b5c] text-gray-400 hover:border-[#6d28d9] hover:text-white"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e)=>setQuery(e.target.value)}
            placeholder="Search title or game…"
            className="bg-[#0b0c1a] border border-[#2d1b5c] rounded-md px-3 py-2 w-56"
          />
          <select
            value={sort}
            onChange={(e)=>setSort(e.target.value)}
            className="bg-[#0b0c1a] border border-[#2d1b5c] rounded-md px-3 py-2"
          >
            {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Mobile game filter */}
      <div className="md:hidden mb-4">
        <select
          value={game}
          onChange={(e)=>setGame(e.target.value)}
          className="bg-[#0b0c1a] border border-[#2d1b5c] rounded-md px-3 py-2 w-full"
        >
          {GAMES.map(g => <option key={g.key} value={g.key}>{g.label}</option>)}
        </select>
      </div>

      {/* Drag & drop upload */}
      {canUpload && (
        <div
          ref={dropRef}
          onDragOver={(e)=>{ e.preventDefault(); setDragOver(true); }}
          onDragLeave={()=> setDragOver(false)}
          onDrop={onDrop}
          className={`mb-6 border-2 border-dashed rounded-xl p-5 transition
            ${dragOver ? "border-[#f8cc00] bg-[#f8cc00]/5" : "border-[#2d1b5c] bg-[#18122b]/70"}`}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="font-medium">Drag & Drop to Upload</div>
              <div className="text-sm text-gray-400">
                Or use the form → (supports .scs, .zip, images; optional thumbnail)
              </div>
            </div>

            {/* manual form */}
            <UploadForm
              busy={busy}
              thumbPreview={thumbPreview}
              setThumbPreview={setThumbPreview}
              onSubmit={handleFiles}
            />
          </div>
        </div>
      )}

      {/* Errors / success */}
      {err && <div className="mb-3 text-red-400">{err}</div>}
      {succ && <div className="mb-3 text-green-400">{succ}</div>}

      {/* Grid */}
      {loading ? (
        <SkeletonGrid />
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence>
            {filtered.map((d) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                whileHover={{ y: -4 }}
                className="relative group rounded-2xl overflow-hidden border border-[#2d1b5c] bg-[#111018]"
                style={{ boxShadow: "0 10px 30px rgba(109,40,217,0.10)" }}
              >
                {/* Glow */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition opacity duration-300"
                     style={{ background: "radial-gradient(600px circle at var(--x,50%) var(--y,50%), rgba(248,204,0,0.12), transparent 35%)" }}
                     onMouseMove={(e)=>{
                       const rect = e.currentTarget.getBoundingClientRect();
                       e.currentTarget.style.setProperty("--x", `${((e.clientX-rect.left)/rect.width)*100}%`);
                       e.currentTarget.style.setProperty("--y", `${((e.clientY-rect.top)/rect.height)*100}%`);
                     }}
                />
                {/* Thumbnail / fallback */}
                <div className="h-40 w-full bg-[#1a1330] relative">
                  {d.thumbnail_url || (d.file_url && isImageUrl(d.file_url)) ? (
                    <img
                      src={d.thumbnail_url || d.file_url}
                      alt={d.title}
                      className="h-full w-full object-cover"
                      onError={(e)=>{ e.currentTarget.style.display="none"; }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-6xl">🎨</div>
                  )}
                  <span className="absolute top-3 left-3 text-xs px-2 py-0.5 rounded-full bg-[#2d1b5c]">
                    {d.game}
                  </span>
                </div>

                {/* Body */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-semibold text-gray-100 line-clamp-2">{d.title}</div>
                    <div className="text-xs text-gray-400 whitespace-nowrap">{prettySize(d.size_bytes)}</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(d.created_at).toLocaleDateString()}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <a
                      href={d.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 bg-[#f8cc00] text-[#18122b] px-3 py-1.5 rounded-md font-semibold hover:brightness-110"
                    >
                      ⬇️ Download
                    </a>
                    {canUpload && (
                      <button
                        onClick={() => onDelete(d.id)}
                        className="px-3 py-1.5 rounded-md border border-red-500/40 text-red-300 hover:bg-red-500/10"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/* =============== sub-components =============== */

function UploadForm({ busy, thumbPreview, setThumbPreview, onSubmit }) {
  const [title, setTitle] = useState("");
  const [game, setGame] = useState("ETS2");
  const [file, setFile] = useState(null);
  const [thumb, setThumb] = useState(null);

  const onThumb = (e) => {
    const f = e.target.files?.[0];
    setThumb(f || null);
    if (f) {
      const url = URL.createObjectURL(f);
      setThumbPreview(url);
    } else {
      setThumbPreview("");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    await onSubmit(file, thumb, title, game);
    setTitle(""); setFile(null); setThumb(null); setThumbPreview("");
    e.currentTarget.reset();
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-3 flex-wrap">
      <input
        placeholder="Title"
        value={title}
        onChange={(e)=>setTitle(e.target.value)}
        className="bg-[#0b0c1a] border border-[#2d1b5c] rounded-md px-3 py-2"
      />
      <select
        value={game}
        onChange={(e)=>setGame(e.target.value)}
        className="bg-[#0b0c1a] border border-[#2d1b5c] rounded-md px-3 py-2"
      >
        <option value="ETS2">ETS2</option>
        <option value="ATS">ATS</option>
      </select>
      <input
        type="file"
        onChange={(e)=>setFile(e.target.files?.[0] || null)}
        className="bg-[#0b0c1a] border border-[#2d1b5c] rounded-md px-3 py-2"
      />
      <label className="text-xs text-gray-400">Thumbnail (optional)</label>
      <input
        type="file"
        accept="image/*"
        onChange={onThumb}
        className="bg-[#0b0c1a] border border-[#2d1b5c] rounded-md px-3 py-2"
      />
      {thumbPreview && (
        <img
          alt="thumb"
          src={thumbPreview}
          className="h-10 w-16 object-cover rounded-md border border-[#2d1b5c]"
        />
      )}
      <button
        type="submit"
        disabled={busy}
        className="bg-[#f8cc00] text-[#18122b] font-semibold px-4 py-2 rounded-md"
      >
        {busy ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden border border-[#2d1b5c] bg-[#111018]">
          <div className="h-40 w-full bg-[#1a1330] animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-[#1a1330] rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-[#1a1330] rounded w-1/3 animate-pulse" />
            <div className="h-8 bg-[#1a1330] rounded w-1/2 animate-pulse mt-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-24 text-gray-400">
      <div className="text-6xl mb-3">📦</div>
      <div className="text-lg">No downloads yet.</div>
      <div className="text-sm text-gray-500">Check back soon for skins, packs and tools.</div>
    </div>
  );
}
