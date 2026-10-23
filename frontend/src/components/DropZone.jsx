import { useState, useRef } from "react";

export default function DropZone({ file, disabled, maxMb, onPick }) {
  const [dragging, setDragging] = useState(false);
  const inputRef                = useRef();

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onPick(f);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current.click()}
      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
        ${dragging
          ? "border-indigo-500 bg-[#1a1f3a]"
          : "border-[#3D4F73] bg-[#152035] hover:border-indigo-600"
        }
        ${disabled ? "pointer-events-none opacity-60" : ""}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={(e) => {
          if (e.target.files[0]) onPick(e.target.files[0]);
          e.target.value = "";  // so picking the same file again still fires
        }}
      />
      <div className="w-14 h-14 bg-[#243255] rounded-full flex items-center justify-center mx-auto mb-3">
        <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </div>
      {file ? (
        <>
          <p className="text-sm font-semibold text-slate-300 break-all">{file.name}</p>
          <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-slate-300">Drop your contract here</p>
          <p className="text-xs text-slate-500 mt-1">
            or <span className="text-indigo-400 font-medium">browse files</span>
          </p>
        </>
      )}
      <div className="flex gap-2 justify-center mt-4">
        {["PDF", "DOCX", `Max ${maxMb}MB`].map((t) => (
          <span key={t} className="text-[11px] font-semibold px-3 py-1 rounded-full bg-[#243255] text-slate-400 border border-[#2D3F63]">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
