import React from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarHUD() {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth(); // 0-indexed
  const currentYear = today.getFullYear();

  const monthNames = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];
  const daysOfWeek = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

  // Helper algorithms to build calendar grid
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  // Generate blank buffers for alignment, then numerical day elements
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  // Segment calendarCells raw buffer into rows of 7 items
  const rows: (number | null)[][] = [];
  let currentRow: (number | null)[] = [];
  calendarCells.forEach((cell, idx) => {
    currentRow.push(cell);
    if (currentRow.length === 7 || idx === calendarCells.length - 1) {
      while (currentRow.length < 7) {
        currentRow.push(null);
      }
      rows.push(currentRow);
      currentRow = [];
    }
  });

  return (
    <div
      id="hud-calendar-block"
      className="p-5 bg-slate-950/40 rounded-3xl border border-cyan-500/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-md select-none font-mono"
    >
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-cyan-500/10">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-cyan-400" />
          <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
            ASTRO CHRONOGRAPH
          </span>
        </div>
        <span className="text-xs font-bold text-cyan-400 tracking-wider">
          {monthNames[currentMonth]} {currentYear}
        </span>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-y-1 text-center mb-2">
        {daysOfWeek.map((day) => (
          <span key={day} className="text-[10px] font-bold text-cyan-400/60 uppercase">
            {day}
          </span>
        ))}
      </div>

      {/* Day items grid */}
      <div className="flex flex-col gap-1.5">
        {rows.map((row, rIdx) => (
          <div key={`row-${rIdx}`} className="grid grid-cols-7 text-center">
            {row.map((day, dIdx) => {
              if (day === null) {
                return <span key={`empty-${rIdx}-${dIdx}`} className="py-1"></span>;
              }

              const isToday = day === currentDay;

              return (
                <div key={`day-${day}`} className="relative flex justify-center py-1">
                  {isToday ? (
                    <span className="relative flex items-center justify-center w-7 h-7 bg-cyan-500/20 text-cyan-200 border border-cyan-400 rounded-full font-bold text-xs shadow-[0_0_10px_rgba(34,211,238,0.3)] animate-pulse">
                      {day}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center w-7 h-7 text-slate-400 hover:text-cyan-300 transition-colors text-xs">
                      {day}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Current local timestamp details */}
      <div className="mt-4 pt-3 border-t border-cyan-500/10 flex justify-between items-center text-[10px] text-slate-500">
        <span>TZ: UTC_ZONE</span>
        <span className="uppercase font-bold text-cyan-500/80">
          STABLE ORBIT
        </span>
      </div>
    </div>
  );
}
