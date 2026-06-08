import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { renderMarkdown } from "../markdown";
import type { Announcement, AnnouncementPayload, AnnouncementStatus } from "../types";

const defaultTags = ["New Feature", "Fix", "Improvement", "Announcement"];

function todayIso() {
  return new Date().toISOString();
}

function dateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : new Date().toISOString().slice(0, 10);
}

export function AnnouncementEditor({ mode }: { mode: "new" | "edit" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState<string | null>("Announcement");
  const [customTag, setCustomTag] = useState("");
  const [date, setDate] = useState(dateInputValue(null));
  const [status, setStatus] = useState<AnnouncementStatus>("draft");
  const [loading, setLoading] = useState(mode === "edit");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);

  const preview = useMemo(() => renderMarkdown(body), [body]);

  useEffect(() => {
    if (mode !== "edit" || !id) return;
    api.listAnnouncements()
      .then((res) => {
        const announcement = res.announcements.find((item) => item.id === id);
        if (!announcement) throw new Error("Announcement not found");
        loadAnnouncement(announcement);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load announcement"))
      .finally(() => setLoading(false));
  }, [mode, id]);

  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  function loadAnnouncement(announcement: Announcement) {
    setTitle(announcement.title);
    setBody(announcement.body);
    setTag(announcement.tag);
    setStatus(announcement.status);
    setDate(dateInputValue(announcement.published_at));
    setDirty(false);
  }

  function payload(nextStatus: AnnouncementStatus): AnnouncementPayload {
    const publicationDate = new Date(`${date}T12:00:00.000Z`).toISOString();
    return {
      title,
      body,
      tag: customTag.trim() || tag,
      status: nextStatus,
      published_at: nextStatus === "published" ? publicationDate || todayIso() : null
    };
  }

  async function save(nextStatus: AnnouncementStatus) {
    setError("");
    try {
      if (mode === "edit" && id) await api.updateAnnouncement(id, payload(nextStatus));
      else await api.createAnnouncement(payload(nextStatus));
      setDirty(false);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save announcement");
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    save(status);
  }

  function cancel() {
    if (dirty && !confirm("Discard unsaved changes?")) return;
    navigate("/");
  }

  if (loading) return <div className="empty">Loading...</div>;

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>{mode === "new" ? "New announcement" : "Edit announcement"}</h1>
          <p>Keep it useful, specific, and short enough to read inside the app.</p>
        </div>
        <Link className="ghost link-button" to="/">Back</Link>
      </div>

      {error ? <div className="error">{error}</div> : null}

      <form className="editor-grid" onSubmit={submit} onChange={() => setDirty(true)}>
        <div className="form-panel">
          <div className="panel-heading">
            <h2>Content</h2>
            <span>{status === "published" ? "Ready to publish" : "Draft mode"}</span>
          </div>
          <label>
            Title <span className="counter">{title.length}/100</span>
            <input value={title} maxLength={100} onChange={(event) => setTitle(event.target.value)} required placeholder="Dark mode is here" />
          </label>

          <label>
            Body
            <textarea value={body} maxLength={5000} onChange={(event) => setBody(event.target.value)} required rows={15} placeholder="Describe what changed, why it matters, and where users can find it." />
          </label>

          <div className="field-row">
            <label>
              Tag
              <select value={tag ?? ""} onChange={(event) => setTag(event.target.value || null)}>
                <option value="">No tag</option>
                {defaultTags.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              Add custom tag
              <input value={customTag} maxLength={50} onChange={(event) => setCustomTag(event.target.value)} placeholder="Optional" />
            </label>
          </div>

          <div className="field-row">
            <label>
              Publication date
              <input type="date" max={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
            <label>
              Status
              <select value={status} onChange={(event) => setStatus(event.target.value as AnnouncementStatus)}>
                <option value="draft">Draft</option>
                <option value="published">Publish now</option>
              </select>
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="ghost" onClick={() => save("draft")}>Save draft</button>
            <button type="button" className="primary" onClick={() => save("published")}>Publish</button>
            <button type="button" className="ghost" onClick={cancel}>Cancel</button>
          </div>
        </div>

        <aside className="preview-panel">
          <div className="panel-heading">
            <h2>Preview</h2>
            <span>Widget view</span>
          </div>
          <div className="preview-meta">
            {customTag || tag ? <span className="status published">{customTag || tag}</span> : null}
            <span>{new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00.000Z`))}</span>
          </div>
          <h2>{title || "Announcement title"}</h2>
          <div className="markdown-preview" dangerouslySetInnerHTML={{ __html: preview || "<p>Your announcement preview appears here.</p>" }} />
        </aside>
      </form>
    </section>
  );
}
