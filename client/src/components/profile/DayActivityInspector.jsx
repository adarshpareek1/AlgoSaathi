import { useState, useEffect } from 'react';
import { getSubmissionsForDate } from '../../services/userService';
import { CheckCircle2, XCircle, Code2, ArrowRight, X, Clock, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DayActivityInspector = ({ date, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [dayData, setDayData] = useState({ count: 0, submissions: [] });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!date) return;
    let isMounted = true;

    const fetchDaySubmissions = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getSubmissionsForDate(date);
        if (isMounted) {
          setDayData(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load submissions for this day');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDaySubmissions();
    return () => { isMounted = false; };
  }, [date]);

  const handleLoadCode = (code, language) => {
    navigate('/workspace', { state: { code, language } });
  };

  const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 mb-8 shadow-2xl relative animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Clock className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Activity Inspector <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">{date}</span>
            </h3>
            <p className="text-xs text-slate-400">{formattedDate}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Close activity inspector"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="py-8 text-center text-slate-400 text-sm animate-pulse flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 animate-spin" /> Fetching day's submissions...
          </div>
        ) : error ? (
          <div className="py-6 text-center text-red-400 text-sm">
            {error}
          </div>
        ) : dayData.submissions.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            No code submissions recorded on this date.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-slate-400 font-medium">
              Found {dayData.submissions.length} submission{dayData.submissions.length > 1 ? 's' : ''}:
            </div>

            <div className="grid grid-cols-1 gap-3 max-h-72 overflow-y-auto pr-1">
              {dayData.submissions.map((sub) => (
                <div
                  key={sub._id}
                  className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center justify-between gap-4 hover:border-slate-700 transition group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-lg ${sub.status === 'Success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {sub.status === 'Success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>
                    
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-xs uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                          {sub.language}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${sub.status === 'Success' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
                          {sub.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 truncate">
                        {new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        {sub.output && ` • ${sub.output.substring(0, 50)}...`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleLoadCode(sub.code, sub.language)}
                    className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                  >
                    Open in Editor <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DayActivityInspector;
