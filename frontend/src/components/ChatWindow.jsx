import { useState, useRef, useEffect } from "react";

function TypingIndicator() {
  return (
    <div className="flex gap-2 items-center px-4 py-3 bg-[#1E2A45] border border-[#2D3F63] rounded-2xl rounded-tl-sm w-fit">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function CitationCard({ source }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left bg-[#152035] border border-[#243255] border-l-2 border-l-indigo-500 rounded-r-lg px-3 py-2 transition-all hover:bg-[#1a2845]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-indigo-400">{source.section}</span>
        <div className="flex items-center gap-2 shrink-0">
          {source.page && <span className="text-[10px] text-slate-500">Page {source.page}</span>}
          <svg
            className={`w-3 h-3 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
      {open && (
        <p className="text-[11px] text-slate-400 mt-2 leading-relaxed border-t border-[#243255] pt-2">
          “{source.text}”
        </p>
      )}
    </button>
  );
}

function Note({ title, children }) {
  return (
    <div className="bg-[#1a2035] border border-[#2D3F63] border-l-2 border-l-amber-500 rounded-r-lg px-3 py-2 w-full">
      <div className="text-[11px] font-semibold text-amber-400 mb-1">⚠ {title}</div>
      <div className="text-[11px] text-slate-500 leading-relaxed">{children}</div>
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center font-bold
        ${isUser ? "bg-[#1E3A5F] text-blue-400 text-[10px]" : "bg-indigo-500 text-white text-xs"}`}
      >
        {isUser ? "You" : "AI"}
      </div>

      {/* Bubble + citations */}
      <div className={`flex flex-col gap-2 max-w-[82%] ${isUser ? "items-end" : "items-start"}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line
          ${isUser
            ? "bg-[#1a2050] border border-[#2D3A6B] text-blue-200 rounded-tr-sm"
            : msg.error
              ? "bg-rose-950 border border-rose-800 text-rose-300 rounded-tl-sm"
              : "bg-[#1E2A45] border border-[#2D3F63] text-slate-300 rounded-tl-sm"
          }`}
        >
          {msg.content}
        </div>

        {msg.off_topic && (
          <Note title="Not found in contract">
            This topic falls outside the contract's scope. Try asking about clauses, payment terms, obligations, or rights defined in the document.
          </Note>
        )}

        {msg.unverified && (
          <Note title="No supporting quote">
            Couldn't match this answer to any text in the contract. Double-check it before relying on it.
          </Note>
        )}

        {msg.sources?.length > 0 && (
          <div className="flex flex-col gap-1.5 w-full">
            {msg.sources.map((s, i) => (
              <CitationCard key={i} source={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatWindow({ messages, typing }) {
  const bottomRef = useRef();

  // Auto scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  return (
    <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
      {messages.map((msg) => (
        <Message key={msg.id} msg={msg} />
      ))}
      {typing && (
        <div className="flex gap-2.5">
          <div className="w-7 h-7 rounded-full bg-indigo-500 shrink-0 flex items-center justify-center text-xs font-bold text-white">
            AI
          </div>
          <TypingIndicator />
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
