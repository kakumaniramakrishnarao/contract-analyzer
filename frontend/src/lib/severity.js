// Risk score (1-5) → label and colours, shared by the analysis and chat pages

const LEVELS = [
  { min: 5, label: "Critical", pill: "bg-rose-950 text-rose-400 border border-rose-800",          bar: "bg-rose-500" },
  { min: 4, label: "High",     pill: "bg-orange-950 text-orange-400 border border-orange-800",    bar: "bg-orange-500" },
  { min: 3, label: "Medium",   pill: "bg-amber-950 text-amber-400 border border-amber-800",       bar: "bg-amber-500" },
  { min: 2, label: "Low",      pill: "bg-blue-950 text-blue-400 border border-blue-800",          bar: "bg-blue-500" },
  { min: 1, label: "Minor",    pill: "bg-emerald-950 text-emerald-400 border border-emerald-800", bar: "bg-emerald-500" },
];

export function severity(score) {
  return LEVELS.find((l) => score >= l.min) || LEVELS[LEVELS.length - 1];
}

// [{ label, pill, count }] in severity order, skipping levels with no risks
export function severityCounts(risks) {
  return LEVELS
    .map((l) => ({ ...l, count: risks.filter((r) => severity(r.score) === l).length }))
    .filter((l) => l.count > 0);
}
