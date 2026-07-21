import React from "react";

export function SkeletonCard() {
  return (
    <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl animate-pulse flex flex-col gap-3">
      <div className="w-10 h-10 bg-slate-800 rounded-lg"></div>
      <div className="h-4 bg-slate-800 rounded w-1/2"></div>
      <div className="h-8 bg-slate-800 rounded w-3/4"></div>
      <div className="h-3 bg-slate-800/60 rounded w-1/3 mt-2"></div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-pulse">
      <div className="h-12 bg-slate-800/70 border-b border-slate-800"></div>
      <div className="divide-y divide-slate-800/50">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="p-4 flex items-center justify-between gap-4">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div
                key={cIdx}
                className="h-4 bg-slate-800 rounded"
                style={{ width: `${100 / cols - 5}%` }}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl animate-pulse space-y-6">
      <div className="flex justify-between items-center">
        <div className="h-8 bg-slate-800 rounded w-1/3"></div>
        <div className="h-6 bg-slate-800 rounded w-24"></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="h-20 bg-slate-800/60 rounded"></div>
        <div className="h-20 bg-slate-800/60 rounded"></div>
        <div className="h-20 bg-slate-800/60 rounded"></div>
      </div>
      <div className="h-40 bg-slate-800/40 rounded"></div>
    </div>
  );
}

export default SkeletonCard;
