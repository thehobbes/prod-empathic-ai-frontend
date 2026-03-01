"use client";

const GREEN_SCALE = [
  "#d8f3dc",
  "#b7e4c7",
  "#95d5b2",
  "#74c69d",
  "#52b788",
  "#2d6a4f",
];

export function buildLatestProsodyBars(signals, limit = 6) {
  if (!Array.isArray(signals) || signals.length === 0) {
    return [];
  }

  const topSignals = [...signals]
    .filter((signal) => signal && typeof signal.label === "string" && Number.isFinite(signal.score))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .sort((left, right) => left.score - right.score);

  return topSignals.map((signal, index) => ({
    ...signal,
    percentage: Math.round(signal.score * 100),
    color: GREEN_SCALE[index] ?? GREEN_SCALE[GREEN_SCALE.length - 1],
  }));
}

export default function LatestProsodyBarChart({ signals }) {
  const bars = buildLatestProsodyBars(signals, 6);

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm flex shrink-0 flex-col min-h-[250px] max-h-[320px]">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-gray-800">Vocal Expression Scores</h2>
        <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-medium">
          Latest EVI Prosody Payload
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {bars.length > 0 ? (
          <ul className="space-y-3.5 text-sm text-zinc-700">
            {bars.map((bar) => (
              <li key={bar.label} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-gray-700">{bar.label}</span>
                  <span className="text-zinc-500">{bar.percentage}%</span>
                </div>
                <div className="w-full rounded-full bg-[#eef7f0] h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-300 ease-out"
                    style={{
                      width: `${bar.percentage}%`,
                      backgroundColor: bar.color,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-zinc-400 italic">
            Waiting for vocal input...
          </div>
        )}
      </div>
    </section>
  );
}
