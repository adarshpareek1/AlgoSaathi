import { useState, useMemo, useRef } from 'react';
import { Calendar, Flame, Trophy, CheckCircle2, XCircle, Code2, Sparkles, Filter } from 'lucide-react';

/**
 * ActivityHeatmap Component
 * Implements GitHub/LeetCode-style week-aligned activity matrix with:
 * - Proper Sunday-Saturday row alignment (7 rows)
 * - Accurate month label positioning
 * - Instant rich interactive tooltips
 * - Interactive cell click with day inspector
 * - Smooth color grades and streaks telemetry
 */
const ActivityHeatmap = ({ 
  heatmapData = {}, 
  heatmapMeta = {}, 
  onSelectDate, 
  selectedDate,
  totalSolved = 0,
  currentStreak = 0,
  longestStreak = 0,
  bestStreakRange = ''
}) => {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Generate 53 weeks (columns) x 7 days (rows), aligned cleanly to Sunday
  const { weeks, monthLabels, totalSubmissions, activeDays, maxInDay } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayDayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday
    const totalWeeks = 53;

    // Start from Sunday of 52 weeks ago
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - todayDayOfWeek - ((totalWeeks - 1) * 7));
    startDate.setHours(0, 0, 0, 0);

    const generatedWeeks = [];
    const months = [];
    let lastMonth = -1;
    let totalSubs = 0;
    let activeDaysCount = 0;
    let maxSubInDay = 0;

    const currDate = new Date(startDate);

    for (let w = 0; w < totalWeeks; w++) {
      const daysInWeek = [];

      for (let d = 0; d < 7; d++) {
        const dateObj = new Date(currDate);
        const dateStr = dateObj.toISOString().split('T')[0];
        const isFuture = dateObj > today;

        const count = isFuture ? 0 : (heatmapData[dateStr] || 0);
        const meta = (!isFuture && heatmapMeta[dateStr]) || {
          count,
          successCount: count,
          errorCount: 0,
          languages: []
        };

        if (count > 0 && !isFuture) {
          totalSubs += count;
          activeDaysCount++;
          if (count > maxSubInDay) maxSubInDay = count;
        }

        // Determine Level for color grading
        let level = 0;
        if (!isFuture) {
          if (count === 0) level = 0;
          else if (count <= 2) level = 1;
          else if (count <= 4) level = 2;
          else if (count <= 7) level = 3;
          else level = 4;
        }

        daysInWeek.push({
          date: dateStr,
          dateObj,
          count,
          meta,
          level,
          isFuture,
          isToday: dateStr === today.toISOString().split('T')[0]
        });

        // Track Month Label (trigger on 1st of month or first week of month)
        if (d === 0) {
          const m = dateObj.getMonth();
          if (m !== lastMonth && w < totalWeeks - 1) {
            months.push({
              name: dateObj.toLocaleString('en-US', { month: 'short' }),
              weekIndex: w
            });
            lastMonth = m;
          }
        }

        currDate.setDate(currDate.getDate() + 1);
      }

      generatedWeeks.push(daysInWeek);
    }

    // Clean up month labels to prevent crowded collisions (min 3 weeks apart)
    const filteredMonthLabels = [];
    let lastWeekIdx = -4;
    months.forEach((m) => {
      if (m.weekIndex - lastWeekIdx >= 3) {
        filteredMonthLabels.push(m);
        lastWeekIdx = m.weekIndex;
      }
    });

    return {
      weeks: generatedWeeks,
      monthLabels: filteredMonthLabels,
      totalSubmissions: totalSubs,
      activeDays: activeDaysCount,
      maxInDay: maxSubInDay
    };
  }, [heatmapData, heatmapMeta]);

  // Color classes for levels
  const getCellClasses = (day) => {
    if (day.isFuture) {
      return 'bg-transparent border-transparent opacity-0 pointer-events-none';
    }

    const isSelected = selectedDate === day.date;
    const baseClasses = 'w-[13px] h-[13px] rounded-sm transition-all duration-150 cursor-pointer ';

    let colorClass = '';
    switch (day.level) {
      case 1:
        colorClass = 'bg-emerald-950 border border-emerald-800/80 hover:bg-emerald-900';
        break;
      case 2:
        colorClass = 'bg-emerald-700 border border-emerald-600 hover:bg-emerald-600';
        break;
      case 3:
        colorClass = 'bg-emerald-500 border border-emerald-400 shadow-xs shadow-emerald-500/30 hover:bg-emerald-400';
        break;
      case 4:
        colorClass = 'bg-emerald-400 border border-emerald-300 shadow-sm shadow-emerald-400/50 hover:bg-emerald-300';
        break;
      default:
        colorClass = 'bg-slate-900/90 border border-slate-800/80 hover:border-slate-600 hover:bg-slate-800';
        break;
    }

    const selectedClass = isSelected 
      ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-950 scale-125 z-10' 
      : 'hover:scale-125 hover:z-10';

    return `${baseClasses} ${colorClass} ${selectedClass}`;
  };

  const handleCellHover = (e, day) => {
    if (day.isFuture) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };

    setTooltipPos({
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top
    });
    setHoveredCell(day);
  };

  const handleCellLeave = () => {
    setHoveredCell(null);
  };

  const handleCellClick = (day) => {
    if (day.isFuture) return;
    if (onSelectDate) {
      // Toggle if already selected
      onSelectDate(selectedDate === day.date ? null : day.date);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 mb-8 backdrop-blur-sm relative shadow-xl shadow-slate-950/40">
      
      {/* Top Header & Telemetry Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Calendar className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">Activity Heatmap</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {totalSubmissions} submissions in the past 12 months • {activeDays} active days
          </p>
        </div>

        {/* Quick telemetry badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-slate-400">Current:</span>
            <span className="font-semibold text-white">{currentStreak}d</span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-slate-400">Max in Day:</span>
            <span className="font-semibold text-emerald-400">{maxInDay}</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid Container */}
      <div ref={containerRef} className="relative overflow-x-auto pb-3 pt-1">
        <div className="min-w-[820px] select-none">
          
          {/* Month Labels Aligned by Week Index */}
          <div className="relative h-5 mb-2 ml-8 text-[11px] text-slate-400 font-medium">
            {monthLabels.map((m, idx) => (
              <span
                key={idx}
                className="absolute whitespace-nowrap"
                style={{ left: `${m.weekIndex * 15.5}px` }}
              >
                {m.name}
              </span>
            ))}
          </div>

          <div className="flex items-start gap-2">
            {/* Day of Week Labels (Y-Axis) */}
            <div className="flex flex-col justify-between h-[115px] text-[10px] text-slate-500 font-mono pr-1 select-none">
              <span className="h-[13px] leading-[13px]">Sun</span>
              <span className="h-[13px] leading-[13px]">Tue</span>
              <span className="h-[13px] leading-[13px]">Thu</span>
              <span className="h-[13px] leading-[13px]">Sat</span>
            </div>

            {/* Weeks Columns Grid */}
            <div className="flex gap-[2.5px]">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-[2.5px]">
                  {week.map((day) => (
                    <button
                      key={day.date}
                      type="button"
                      aria-label={`${day.date}: ${day.count} submissions`}
                      onClick={() => handleCellClick(day)}
                      onMouseEnter={(e) => handleCellHover(e, day)}
                      onMouseLeave={handleCellLeave}
                      className={getCellClasses(day)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rich Floating Tooltip (Instant, Custom Styled) */}
        {hoveredCell && (
          <div
            className="absolute z-50 pointer-events-none -translate-x-1/2 -translate-y-full mb-2 transition-all duration-75 ease-out"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y - 6}px`
            }}
          >
            <div className="bg-slate-950/95 text-white border border-slate-700/80 rounded-xl px-3 py-2 shadow-2xl backdrop-blur-md text-xs min-w-[170px] space-y-1">
              <div className="font-semibold text-slate-200 border-b border-slate-800/80 pb-1 flex items-center justify-between">
                <span>
                  {hoveredCell.dateObj.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                {hoveredCell.isToday && (
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">Today</span>
                )}
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <span className="text-slate-400">Activity:</span>
                <span className="font-bold text-white">
                  {hoveredCell.count} {hoveredCell.count === 1 ? 'submission' : 'submissions'}
                </span>
              </div>

              {hoveredCell.count > 0 && (
                <>
                  <div className="flex items-center gap-3 text-[11px] text-slate-300">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> {hoveredCell.meta.successCount || hoveredCell.count}
                    </span>
                    {(hoveredCell.meta.errorCount || 0) > 0 && (
                      <span className="flex items-center gap-1 text-red-400">
                        <XCircle className="w-3 h-3" /> {hoveredCell.meta.errorCount}
                      </span>
                    )}
                  </div>

                  {hoveredCell.meta.languages?.length > 0 && (
                    <div className="flex items-center gap-1 pt-1 flex-wrap">
                      {hoveredCell.meta.languages.map((lang) => (
                        <span
                          key={lang}
                          className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}

              <p className="text-[10px] text-slate-500 italic pt-0.5">Click cell to inspect submissions</p>
            </div>
            
            {/* Tooltip caret */}
            <div className="w-2 h-2 bg-slate-950 border-r border-b border-slate-700/80 rotate-45 mx-auto -mt-1" />
          </div>
        )}
      </div>

      {/* Footer: Legend & Helper Text */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800/70 text-xs text-slate-400">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Click any square to inspect that day's code executions</span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Less</span>
          <div title="0 submissions" className="w-[12px] h-[12px] rounded-sm bg-slate-900 border border-slate-800" />
          <div title="1-2 submissions" className="w-[12px] h-[12px] rounded-sm bg-emerald-950 border border-emerald-800/80" />
          <div title="3-4 submissions" className="w-[12px] h-[12px] rounded-sm bg-emerald-700 border border-emerald-600" />
          <div title="5-7 submissions" className="w-[12px] h-[12px] rounded-sm bg-emerald-500 border border-emerald-400" />
          <div title="8+ submissions" className="w-[12px] h-[12px] rounded-sm bg-emerald-400 border border-emerald-300 shadow-xs shadow-emerald-400/50" />
          <span className="text-slate-500">More</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
