import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DropZone from "../components/DropZone";
import { uploadFile, analyseContract, errorMessage } from "../services/api";

const STEPS  = ["Uploading", "Reading", "Analysing"];
const MAX_MB = Number(import.meta.env.VITE_MAX_FILE_SIZE_MB) || 20;

export default function UploadPage() {
  const [file, setFile]           = useState(null);
  const [progress, setProgress]   = useState(0);
  const [step, setStep]           = useState(0);
  const [error, setError]         = useState("");
  const [uploading, setUploading] = useState(false);
  const navigate                  = useNavigate();

  // ── Validation ────────────────────────────────────────────────
  function validate(f) {
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["pdf", "docx"].includes(ext))
      return "Invalid file type. Please upload a PDF or DOCX.";
    if (f.size > MAX_MB * 1024 * 1024)
      return `File too large. Maximum size is ${MAX_MB}MB.`;
    if (f.size === 0)
      return "File is empty.";
    return null;
  }

  function pickFile(f) {
    setError("");
    const msg = validate(f);
    if (msg) { setError(msg); return; }
    setFile(f);
    setProgress(0);
    setStep(0);
  }

  // ── Upload ────────────────────────────────────────────────────
  async function handleUpload() {
    if (!file || uploading) return;
    setUploading(true);
    setError("");

    try {
      // Steps 1 & 2 — upload, then the server reads the text before replying
      setStep(1);
      const result = await uploadFile(file, (pct) => {
        setProgress(pct);
        if (pct === 100) setStep(2);
      });

      // Step 3 — analyse
      setStep(3);
      const analysis = await analyseContract(result.doc_id);

      navigate("/analysis", { state: { doc_id: result.doc_id, filename: file.name, analysis } });

    } catch (err) {
      setError(errorMessage(err, "Upload failed. Please try again."));
      setUploading(false);
      setStep(0);
      setProgress(0);
    }
  }

  // ── UI ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0F1629] flex flex-col items-center justify-center p-6">

      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 bg-indigo-500 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <span className="text-xl font-bold text-slate-100">
          Contract<span className="text-indigo-400">AI</span>
        </span>
      </div>

      {/* Card */}
      <div className="bg-[#1E2A45] border border-[#2D3F63] rounded-2xl p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-slate-100 mb-1">Analyse your contract</h1>
        <p className="text-sm text-slate-400 mb-6">
          Upload a PDF or DOCX to get the key terms, a risk breakdown, and a chat you can ask questions in.
        </p>

        <DropZone file={file} disabled={uploading} maxMb={MAX_MB} onPick={pickFile} />

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-center gap-2 bg-rose-950 border border-rose-800 text-rose-400 text-sm rounded-xl px-4 py-3">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* Progress */}
        {uploading && (
          <div className="mt-6">
            <div className="bg-[#152035] rounded-full h-1.5 overflow-hidden mb-1">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 text-right mb-4">{progress}%</p>

            {/* Steps */}
            <div className="flex items-center">
              {STEPS.map((label, i) => {
                const idx    = i + 1;
                const done   = step > idx;
                const active = step === idx;
                return (
                  <div key={label} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all
                        ${done   ? "border-emerald-500 bg-emerald-500 text-white"     : ""}
                        ${active ? "border-indigo-500 text-indigo-400 bg-[#1a1f3a]"  : ""}
                        ${!done && !active ? "border-[#2D3F63] text-slate-600"        : ""}
                      `}>
                        {done ? "✓" : idx}
                      </div>
                      <span className={`text-[10px] whitespace-nowrap
                        ${done   ? "text-emerald-500" : ""}
                        ${active ? "text-indigo-400"  : ""}
                        ${!done && !active ? "text-slate-600" : ""}
                      `}>{label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`h-px flex-1 mx-1 mb-4 transition-all ${done ? "bg-emerald-500" : "bg-[#2D3F63]"}`} />
                    )}
                  </div>
                );
              })}
            </div>
            {step === 3 && (
              <p className="text-xs text-slate-500 text-center mt-4">
                Reading the whole contract, this usually takes 10–30 seconds.
              </p>
            )}
          </div>
        )}

        {/* Button */}
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`w-full mt-6 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all
            ${file && !uploading
              ? "bg-indigo-500 hover:bg-indigo-600 text-white hover:-translate-y-0.5"
              : "bg-[#2D3F63] text-slate-500 cursor-not-allowed"
            }
          `}
        >
          {uploading ? (
            <>{STEPS[step - 1] || "Processing"}…</>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              {file ? "Analyse contract" : "Select a file to begin"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
