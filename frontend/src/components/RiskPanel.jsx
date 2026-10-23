import Skeleton from "./Skeleton";
import { severity, severityCounts } from "../lib/severity";

export default function RiskPanel({ risks, loading }) {
  return (
    <div className="bg-[#1E2A45] border border-[#2D3F63] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
          Risk assessment
        </span>
      </div>

      {/* Chip row */}
      <div className="flex flex-wrap gap-2 mb-4">
        {loading
          ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-6 w-20 rounded-full" />)
          : severityCounts(risks).map(({ label, pill, count }) => (
              <span key={label} className={`text-xs font-semibold px-3 py-1 rounded-full ${pill}`}>
                {count} {label.toLowerCase()}
              </span>
            ))
        }
      </div>

      {/* Risk list */}
      <div className="flex flex-col gap-4">
        {loading && Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-16" />)}

        {!loading && risks.length === 0 && (
          <p className="text-sm text-slate-500">No notable risks found.</p>
        )}

        {!loading && risks.map((risk, i) => {
          const { label, pill, bar } = severity(risk.score);
          return (
            <div key={i} className={`pb-4 ${i < risks.length - 1 ? "border-b border-[#1a2540]" : ""}`}>
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <span className="text-sm font-semibold text-slate-300 leading-snug">
                  {risk.title}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${pill}`}>
                  {label} · {risk.score}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-2">
                {risk.description}
              </p>
              <div className="bg-[#152035] rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${bar}`}
                  style={{ width: `${(risk.score / 5) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
