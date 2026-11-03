import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfileStats } from '../services/userService';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import ActivityHeatmap from '../components/profile/ActivityHeatmap';
import DayActivityInspector from '../components/profile/DayActivityInspector';
import { Mail, Calendar, Code2, Flame, Clock, CheckCircle2, XCircle, Trophy, ArrowRight, BarChart3, Percent } from 'lucide-react';
import Button from '../components/ui/Button';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({ 
    totalSolved: 0, 
    totalSubmissions: 0,
    acceptanceRate: 0,
    languageStats: [],
    currentStreak: 0,
    longestStreak: 0,
    bestStreakRange: 'N/A',
    recentActivity: [], 
    heatmapData: {},
    heatmapMeta: {},
    joinedAt: null
  });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getProfileStats();
        setStats(data);
      } catch (error) {
        console.error("Profile Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLoadCode = (code, language) => {
    navigate('/workspace', { state: { code, language } });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30 selection:text-white">
      <Navbar isLoggedIn={true} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        
        {/* Header Profile Section */}
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 mb-10 border-b border-slate-800/80 pb-10">
          <div className="relative group">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-2 border-emerald-500/40 p-1 bg-slate-900 shadow-2xl shadow-emerald-500/10">
              <img 
                src={user?.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.username}`} 
                alt="Profile" 
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 p-1 rounded-lg border-2 border-slate-950 shadow">
              <CheckCircle2 className="w-4 h-4 stroke-[3]" />
            </div>
          </div>

          <div className="text-center md:text-left flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 justify-center md:justify-start">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{user?.name || user?.username || "Algo Programmer"}</h1>
              <span className="text-xs font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold inline-block self-center">
                Candidate
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 text-slate-400 text-xs sm:text-sm justify-center md:justify-start">
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-500" /> {user?.email}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" /> 
                Joined {stats.joinedAt ? new Date(stats.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "recently"}
              </div>
            </div>
          </div>

          <Button 
            variant="secondary"
            onClick={() => navigate('/workspace')}
            className="text-xs gap-2 hidden md:inline-flex"
          >
            Go to Workspace <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
          
          {/* 1. Solved & Acceptance */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden group hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Solved</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-white">{stats.totalSolved}</p>
                <span className="text-xs text-slate-500">/ {stats.totalSubmissions || stats.totalSolved}</span>
              </div>
              <p className="text-[11px] text-blue-400/80 font-medium mt-0.5">
                {stats.acceptanceRate}% Acceptance
              </p>
            </div>
          </div>

          {/* 2. Current Streak */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden group hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Current Streak</p>
              <p className="text-2xl font-bold text-white">{stats.currentStreak} Days</p>
              <p className="text-[11px] text-orange-400/80 font-medium mt-0.5">
                {stats.currentStreak > 0 ? "Keep the flame burning!" : "Solve today to start!"}
              </p>
            </div>
          </div>

          {/* 3. Best Streak */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden group hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Best Streak</p>
              <p className="text-2xl font-bold text-white">{stats.longestStreak} Days</p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5" title={stats.bestStreakRange}>
                {stats.bestStreakRange}
              </p>
            </div>
          </div>

          {/* 4. Total Active Days */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden group hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Active Days</p>
              <p className="text-2xl font-bold text-emerald-400">{stats.activeDaysCount || Object.keys(stats.heatmapData || {}).length}</p>
              <p className="text-[11px] text-emerald-500/80 font-medium mt-0.5">
                Past 12 Months
              </p>
            </div>
          </div>
        </div>

        {/* Language Breakdown Bar */}
        {stats.languageStats && stats.languageStats.length > 0 && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Languages Used:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.languageStats.map((item) => (
                <div
                  key={item.language}
                  className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center gap-2"
                >
                  <span className="font-mono uppercase font-bold text-blue-400">{item.language}</span>
                  <span className="text-slate-400 text-[11px]">{item.solved} solved ({item.count} runs)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Polished Week-Aligned Activity Heatmap */}
        <ActivityHeatmap 
          heatmapData={stats.heatmapData}
          heatmapMeta={stats.heatmapMeta}
          onSelectDate={setSelectedDate}
          selectedDate={selectedDate}
          totalSolved={stats.totalSolved}
          currentStreak={stats.currentStreak}
          longestStreak={stats.longestStreak}
          bestStreakRange={stats.bestStreakRange}
        />

        {/* Interactive Day Inspector (Appears when day cell is clicked) */}
        {selectedDate && (
          <DayActivityInspector 
            date={selectedDate}
            onClose={() => setSelectedDate(null)}
          />
        )}

        {/* Recent Submissions History */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2 text-white">
              <Clock className="w-5 h-5 text-blue-400" /> Recent Submissions
            </h2>
            <span className="text-xs text-slate-500">Latest 6 executions</span>
          </div>
          
          {loading ? (
             <div className="space-y-3 animate-pulse">
               {[1, 2, 3].map(n => (
                 <div key={n} className="h-16 bg-slate-950/60 rounded-xl" />
               ))}
             </div>
          ) : stats.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((activity) => (
                <div 
                  key={activity._id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-slate-800/60 hover:border-slate-700 transition group gap-3"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2 rounded-lg ${activity.status === 'Success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {activity.status === 'Success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">
                          Ran <span className="uppercase text-blue-400 font-bold font-mono">{activity.language}</span> Code
                        </span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${activity.status === 'Success' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/20' : 'bg-red-900/30 text-red-400 border border-red-500/20'}`}>
                          {activity.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(activity.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {activity.output && ` • ${activity.output.substring(0, 40)}...`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end">
                    <button 
                      onClick={() => handleLoadCode(activity.code, activity.language)}
                      className="opacity-90 group-hover:opacity-100 transition-opacity bg-blue-600/90 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 font-medium shadow-xs shadow-blue-500/20"
                    >
                      Solve Again <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 text-sm">
              No code runs recorded yet. Head over to the Workspace to run your first program!
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Profile;