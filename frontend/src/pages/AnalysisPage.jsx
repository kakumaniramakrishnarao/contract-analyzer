import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SchemaGrid from "../components/SchemaGrid";
import RiskPanel from "../components/RiskPanel";
import Skeleton from "../components/Skeleton";
import { analyseContract, errorMessage } from "../services/api";

export default function AnalysisPage() {
  const { state }       = useLocation();
  const navigate        = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const doc_id   = state?.doc_id;
  const filename = state?.filename || "contract";
  const passedIn = state?.analysis;

  useEffect(() => {
    if (!doc_id) { navigate("/"); return; }

    // Upload page already ran the analysis; the backend keeps it if we come back later
    Promise.resolve(passedIn || analyseContract(doc_id))
      .then(setData)
      .catch((err) => setError(errorMessage(err, "Analysis failed. Please try uploading again.")))
      .finally(() => setLoading(false));
  }, [doc_id, passedIn, navigate]);

  return (
    <div className="min-h-screen bg-[#0F1629] text-slate-200 p-5">

      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            New upload
          </button>
          <span className="text-slate-600">|</span>
          <span className="text-xl font-bold text-slate-100">
            Contract<span className="text-indigo-400">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono text-xs text-slate-500 bg-[#1E2A45] border border-[#2D3F63] px-3 py-1.5 rounded-full truncate max-w-[200px]">
            {filename}
          </span>
          <button
            onClick={() => navigate("/chat", { state: { doc_id, filename, analysis: data } })}
            disabled={!data}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-[#2D3F63] disabled:text-slate-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Chat with contract
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-rose-950 border border-rose-800 text-rose-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {data?.truncated && (
        <div className="mb-4 bg-amber-950 border border-amber-800 text-amber-400 text-sm rounded-xl px-4 py-3">
          This contract is very long, so only the first part was analysed. Clauses near the end may be missing.
        </div>
      )}

      {/* Two column layout */}
      {(loading || data) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Left column — key terms + summary */}
          <div className="flex flex-col gap-4">
            <SchemaGrid schema={data?.schema} loading={loading} />

            <div className="bg-[#1E2A45] border border-[#2D3F63] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  Summary
                </span>
              </div>
              {loading
                ? <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/6" />
                  </div>
                : <p className="text-sm text-slate-400 leading-relaxed">{data.summary}</p>
              }
            </div>
          </div>

          {/* Right column — risks */}
          <RiskPanel risks={data?.risks || []} loading={loading} />
        </div>
      )}
    </div>
  );
}
