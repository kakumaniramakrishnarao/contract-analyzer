import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChatWindow from "../components/ChatWindow";
import { sendChatMessage, errorMessage } from "../services/api";
import { severity } from "../lib/severity";
import { SCHEMA_LABELS } from "../lib/schema";

const GREETING = {
  id: 0,
  role: "assistant",
  content: "Hi! I've read through this contract. Ask me anything — about payment terms, IP clauses, termination rights, or any specific section you want to understand better.",
  sources: [],
};

const SNAPSHOT_FIELDS = ["contract_type", "parties", "governing_law", "start_date", "end_date"];

export default function ChatPage() {
  const { state }               = useLocation();
  const navigate                = useNavigate();
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput]       = useState("");
  const [typing, setTyping]     = useState(false);
  const inputRef                = useRef();

  const doc_id   = state?.doc_id;
  const filename = state?.filename || "contract";
  const analysis = state?.analysis;

  useEffect(() => {
    if (!doc_id) navigate("/");
  }, [doc_id, navigate]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || typing) return;

    // Context for follow-ups: real exchanges only, last 10 turns
    const history = messages
      .filter((m) => m.id !== GREETING.id && !m.error)
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { id: Date.now(), role: "user", content: text }]);
    setInput("");
    setTyping(true);

    try {
      const result = await sendChatMessage(doc_id, text, history);
      setMessages((prev) => [
        ...prev,
        {
          id:         Date.now() + 1,
          role:       "assistant",
          content:    result.answer,
          sources:    result.sources,
          off_topic:  result.off_topic,
          unverified: result.unverified,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: errorMessage(err), error: true },
      ]);
    } finally {
      setTyping(false);
      inputRef.current?.focus();
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="h-screen bg-[#0F1629] text-slate-200 flex flex-col">

      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-[#1E2A45] shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/analysis", { state })}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to analysis
          </button>
          <span className="text-slate-600">|</span>
          <span className="text-lg font-bold">
            Contract<span className="text-indigo-400">AI</span>
          </span>
        </div>
        <span className="font-mono text-xs text-slate-500 bg-[#1E2A45] border border-[#2D3F63] px-3 py-1.5 rounded-full truncate max-w-[200px]">
          {filename}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Chat thread */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <ChatWindow messages={messages} typing={typing} />

          {/* Input */}
          <div className="px-5 py-4 border-t border-[#1E2A45] shrink-0">
            <div className="flex gap-2 items-end">
              <div className="flex-1 flex items-center gap-2 bg-[#1E2A45] border border-[#2D3F63] rounded-xl px-4 py-3 focus-within:border-indigo-500 transition-colors">
                <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  maxLength={2000}
                  placeholder="Ask about any clause, term, or obligation…"
                  className="flex-1 bg-transparent outline-none text-sm text-slate-200 placeholder-slate-600"
                  autoFocus
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || typing}
                aria-label="Send"
                className="w-10 h-10 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-[#2D3F63] disabled:text-slate-500 text-white flex items-center justify-center transition-all shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
            <p className="text-[11px] text-slate-600 mt-2 text-center">
              Press Enter to send · quotes are checked against the contract text
            </p>
          </div>
        </div>

        {/* Right sidebar */}
        {analysis && (
          <div className="w-72 border-l border-[#1E2A45] overflow-y-auto px-4 py-5 hidden lg:block shrink-0">

            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              Top risks
            </p>
            <div className="flex flex-col gap-2 mb-5">
              {analysis.risks.map((r, i) => (
                <div key={i} className="bg-[#1E2A45] border border-[#2D3F63] rounded-xl px-3 py-2.5">
                  <p className="text-xs font-semibold text-slate-300 mb-1.5 leading-snug">{r.title}</p>
                  <div className="bg-[#152035] rounded-full h-1 overflow-hidden">
                    <div className={`h-full rounded-full ${severity(r.score).bar}`} style={{ width: `${(r.score / 5) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              Contract snapshot
            </p>
            <div className="bg-[#1E2A45] border border-[#2D3F63] rounded-xl overflow-hidden">
              {SNAPSHOT_FIELDS.map((key) => (
                <div key={key} className="flex justify-between items-center gap-2 px-3 py-2 border-b border-[#152035] last:border-b-0">
                  <span className="text-[11px] text-slate-500">{SCHEMA_LABELS[key]}</span>
                  <span className="text-[11px] font-medium text-slate-300 text-right max-w-[60%] truncate" title={analysis.schema[key] || ""}>
                    {analysis.schema[key] || "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
