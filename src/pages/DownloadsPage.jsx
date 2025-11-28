import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DownloadCloud, Filter, Search } from "lucide-react";
import { useAuth } from "../renderer/context/AuthContext";
import api from "../renderer/services/api";

const GAMES = [
  { key: "ALL", label: "All Games" },
  { key: "ETS2", label: "Euro Truck Simulator 2" },
  { key: "ATS", label: "American Truck Simulator" },
];

const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "size_desc", label: "Size (Large→Small)" },
  { key: "size_asc", label: "Size (Small→Large)" },
  { key: "title", label: "Title (A→Z)" },
];

const prettySize = (bytes = 0) => {
  const b = Number(bytes) || 0;
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`;
  return `${(b / 1024 ** 3).toFixed(2)} GB`;
};

const isImageUrl = (url = "") =>
  /\.(png|jpe?g|webp|gif)$/i.test(url.split("?")[0] || "");

export default function DownloadsPage() {
  const { isAdmin, isStaff } = useAuth();
  const canUpload = isAdmin() || isStaff();

  const [items, setItems] = useState([]);
  const [game, setGame] = useState("ALL");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [succ, setSucc] = useState("");

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

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  const filtered = useMemo(() => {
    let list = [...items];
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (d) =>
          (d.title || "").toLowerCase().includes(q) ||
          (d.game || "").toLowerCase().includes(q)
      );
    }
    switch (sort) {
      case "oldest":
        list.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        break;
      case "size_desc":
        list.sort((a, b) => (b.size_bytes || 0) - (a.size_bytes || 0));
        break;
      case "size_asc":
        list.sort((a, b) => (a.size_bytes || 0) - (b.size_bytes || 0));
        break;
      case "title":
        list.sort((a, b) =>
          (a.title || "").localeCompare(b.title || "")
        );
        break;
      default: // newest
        list.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
    }
    return list;
  }, [items, query, sort]);

  // ---------- Upload handlers (admin/staff) ----------
  const handleFiles = async (file, thumb, title, gameVal) => {
    if (!file || !title || !gameVal) {
      setErr("Title, game and file are required.");
      return;
    }
    setBusy(true);
    setErr("");
    setSucc("");
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
    const title =
      prompt("Title for this file (e.g., ENIGMA Skin v2):") || "";
    const gameVal = (prompt("Game: ETS2 or ATS") || "").toUpperCase();
    if (!["ETS2", "ATS"].includes(gameVal))
      return alert("Invalid game. Use ETS2 or ATS.");
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
    <div className="p-6 bg-gradient-to-b from-[#12051a] via-[#1b1024] to-[#12051a] min-h-full text-slate-100 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-2xl bg-[#1b1024] border border-[#2c1e3a] flex items-center justify-center shadow-lg shadow-black/80"
          >
            <DownloadCloud
              className="w-6 h-6"
              style={{ color: "#6A0DAD" }} // Enigma purple icon
            />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Downloads
            </h1>
            <p className="text-sm text-slate-400">
              Skins, tools and packs for ETS2 &amp; ATS.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Game pills (desktop) */}
          <div className="hidden md:flex gap-2">
            {GAMES.map((g) => {
              const active = game === g.key;
              return (
                <button
                  key={g.key}
                  onClick={() => setGame(g.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    active
                      ? "text-white shadow-sm"
                      : "border-[#2c1e3a] bg-[#1b1024] text-slate-300 hover:text-slate-50"
                  }`}
                  style={
                    active
                      ? {
                          borderColor: "#2c1e3a",
                          backgroundImage:
                            "linear-gradient(135deg, #6A0DAD, #f8cc00)",
                          boxShadow: "0 0 14px rgba(106,13,173,0.45)",
                        }
                      : {}
                  }
                >
                  {g.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title or game…"
                className="bg-[#12051a]/90 border border-[#2c1e3a] rounded-xl pl-9 pr-4 py-2.5 w-56 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#6A0DAD] focus:ring-1 focus:ring-[#6A0DAD]/60"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#12051a]/80 border border-[#2c1e3a] text-slate-200 text-xs">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-transparent text-xs focus:outline-none"
              >
                {SORTS.map((s) => (
                  <option
                    key={s.key}
                    value={s.key}
                    className="bg-[#1b1024] text-slate-100"
                  >
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile game filter */}
      <div className="md:hidden">
        <select
          value={game}
          onChange={(e) => setGame(e.target.value)}
          className="w-full bg-[#12051a]/90 border border-[#2c1e3a] rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-[#6A0DAD] focus:ring-1 focus:ring-[#6A0DAD]/60"
        >
          {GAMES.map((g) => (
            <option key={g.key} value={g.key}>
              {g.label}
            </option>
          ))}
        </select>
      </div>

      {/* Drag & drop + upload form */}
      {canUpload && (
        <div
          ref={dropRef}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className="border-2 border-dashed rounded-2xl p-5 transition-colors shadow-lg shadow-black/70"
          style={
            dragOver
              ? {
                  borderColor: "#6A0DAD",
                  background: "rgba(106,13,173,0.12)",
                }
              : {
                  borderColor: "#2c1e3a",
                  background: "rgba(27,16,36,0.85)",
                }
          }
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-100">
                Drag &amp; drop to upload
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Or use the form on the right. Supports <code>.scs</code>,{" "}
                <code>.zip</code>, and images. Optional thumbnail.
              </p>
            </div>

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
      {err && (
        <div className="text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-xl px-4 py-2">
          {err}
        </div>
      )}
      {succ && (
        <div className="text-sm text-emerald-400 bg-emerald-950/30 border border-emerald-800 rounded-xl px-4 py-2">
          {succ}
        </div>
      )}

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
                className="relative group rounded-2xl overflow-hidden border border-[#2c1e3a] bg-[#1b1024] shadow-lg shadow-black/70"
                style={{}}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background:
                      "radial-gradient(600px circle at var(--x,50%) var(--y,50%), rgba(106,13,173,0.22), transparent 40%)",
                  }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty(
                      "--x",
                      `${((e.clientX - rect.left) / rect.width) * 100}%`
                    );
                    e.currentTarget.style.setProperty(
                      "--y",
                      `${((e.clientX - rect.top) / rect.height) * 100}%`
                    );
                  }}
                />

                {/* Thumbnail / fallback */}
                <div className="h-40 w-full bg-[#12051a] relative">
                  {d.thumbnail_url ||
                  (d.file_url && isImageUrl(d.file_url)) ? (
                    <img
                      src={d.thumbnail_url || d.file_url}
                      alt={d.title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-6xl">
                      🎨
                    </div>
                  )}
                  <span className="absolute top-3 left-3 text-[11px] px-2 py-0.5 rounded-full bg-[#12051a]/80 border border-[#2c1e3a] text-slate-100">
                    {d.game}
                  </span>
                </div>

                {/* Body */}
                <div className="p-4 relative z-10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-semibold text-sm text-slate-50 line-clamp-2">
                      {d.title}
                    </div>
                    <div className="text-[11px] text-slate-400 whitespace-nowrap">
                      {prettySize(d.size_bytes)}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {new Date(d.created_at).toLocaleDateString()}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <a
                      href={d.file_url}
                      target="_blank"
                      rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md text-white"
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, #6A0DAD, #f8cc00)",
                      boxShadow: "0 0 14px rgba(106,13,173,0.55)",
                    }}
                  >
                    ⬇️ Download
                  </a>
                    {canUpload && (
                      <button
                        onClick={() => onDelete(d.id)}
                        className="px-3 py-1.5 rounded-lg border text-[11px] text-red-300 hover:bg-red-500/10"
                        style={{
                          borderColor: "rgba(248,113,113,0.6)",
                        }}
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
    setTitle("");
    setFile(null);
    setThumb(null);
    setThumbPreview("");
    e.currentTarget.reset();
  };

  return (
    <form
      onSubmit={submit}
      className="flex items-center gap-3 flex-wrap justify-end"
    >
      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="bg-[#12051a]/90 border border-[#2c1e3a] rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#6A0DAD] focus:ring-1 focus:ring-[#6A0DAD]/60"
      />
      <select
        value={game}
        onChange={(e) => setGame(e.target.value)}
        className="bg-[#12051a]/90 border border-[#2c1e3a] rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-[#6A0DAD] focus:ring-1 focus:ring-[#6A0DAD]/60"
      >
        <option value="ETS2">ETS2</option>
        <option value="ATS">ATS</option>
      </select>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="bg-[#12051a]/90 border border-[#2c1e3a] rounded-xl px-3 py-2 text-xs text-slate-200 file:text-xs file:text-slate-100 file:bg-[#1b1024] file:border-0 file:mr-2"
      />
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-slate-400">Thumbnail</span>
        <input
          type="file"
          accept="image/*"
          onChange={onThumb}
          className="bg-[#12051a]/90 border border-[#2c1e3a] rounded-xl px-3 py-2 text-xs text-slate-200 file:text-xs file:text-slate-100 file:bg-[#1b1024] file:border-0 file:mr-2"
        />
        {thumbPreview && (
          <img
            alt="thumb"
            src={thumbPreview}
            className="h-10 w-16 object-cover rounded-md border border-[#2c1e3a]"
          />
        )}
      </div>
      <button
        type="submit"
        disabled={busy}
        className="text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          backgroundImage: "linear-gradient(135deg, #6A0DAD, #f8cc00)",
          boxShadow: "0 0 14px rgba(106,13,173,0.55)",
        }}
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
        <div
          key={i}
          className="rounded-2xl overflow-hidden border border-[#2c1e3a] bg-[#1b1024]"
        >
          <div className="h-40 w-full bg-[#12051a] animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-[#12051a] rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-[#12051a] rounded w-1/3 animate-pulse" />
            <div className="h-8 bg-[#12051a] rounded w-1/2 animate-pulse mt-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20 text-slate-400">
      <div className="text-6xl mb-3">📦</div>
      <div className="text-lg font-medium text-slate-100">
        No downloads yet.
      </div>
      <div className="text-sm text-slate-500">
        Check back soon for skins, packs and tools.
      </div>
    </div>
  );
}
