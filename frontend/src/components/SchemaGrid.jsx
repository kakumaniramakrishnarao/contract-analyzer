import Skeleton from "./Skeleton";
import { SCHEMA_LABELS } from "../lib/schema";

const VALUE_COLORS = {
  contract_type:  "text-indigo-400",
  contract_value: "text-emerald-400",
  end_date:       "text-amber-400",
  termination:    "text-amber-400",
};

export default function SchemaGrid({ schema, loading }) {
  return (
    <div className="bg-[#1E2A45] border border-[#2D3F63] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="9" y="9" width="13" height="13" rx="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
          Key terms
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {loading
          ? Array(9).fill(0).map((_, i) => <Skeleton key={i} className="h-14" />)
          : Object.entries(SCHEMA_LABELS).map(([key, label]) => (
              <div key={key} className="bg-[#152035] rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">
                  {label}
                </div>
                <div className={`text-xs font-semibold leading-snug ${VALUE_COLORS[key] || "text-slate-300"}`}>
                  {schema[key] || "—"}
                </div>
              </div>
            ))
        }
      </div>
    </div>
  );
}
