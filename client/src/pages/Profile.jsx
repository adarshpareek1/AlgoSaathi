import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfileStats } from '../services/userService';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { Mail, Calendar, Code2, Flame, Clock, CheckCircle, XCircle, Trophy, ArrowRight, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({ 
    totalSolved: 0, 
    currentStreak: 0,
    longestStreak: 0,
    bestStreakRange: 'N/A',
    recentActivity: [], 
    heatmapData: {},
    joinedAt: null
  });
  const [loading, setLoading] = useState(true);

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

  const generateHeatmapDays = () => {
    const days = [];
    const today = new Date();
    // 52 weeks * 7 days = 364 days
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const count = stats.heatmapData?.[dateString] || 0;
      
      let colorClass = 'bg-slate-800';
      if (count >= 1) colorClass = 'bg-green-900';
      if (count >= 3) colorClass = 'bg-green-700';
      if (count >= 6) colorClass = 'bg-green-500';

      days.push({ date: dateString, count, colorClass, dateObj: date });
    }
    return days;
  };

  const heatmapDays = generateHeatmapDays();

  const getMonthLabels = () => {
    const months = [];
    let currentMonth = -1;
    
    for (let i = 0; i < heatmapDays.length; i += 7) {
      const date = heatmapDays[i].dateObj;
      const month = date.getMonth();
      
      if (month !== currentMonth) {
        const colIndex = Math.floor(i / 7);
        const name = date.toLocaleString('default', { month: 'short', year: 'numeric' }); 
        
        months.push({ name, index: colIndex });
        currentMonth = month;
      }
    }

    const filteredMonths = [];
    let lastIndex = -10; 

    months.forEach((m) => {
      if (m.index - lastIndex >= 3) {
        filteredMonths.push(m);
        lastIndex = m.index;
      }
    });

    return filteredMonths;
  };
  
  const monthLabels = getMonthLabels();

  const handleLoadCode = (code, language) => {
    navigate('/workspace', { state: { code, language } });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar isLoggedIn={true} />

      <div className="max-w-5xl mx-auto px-6 pt-32 pb-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-12 border-b border-slate-800 pb-12">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full border-4 border-slate-800 overflow-hidden shadow-2xl">
              <img 
                src={user?.avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.username}`} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">{user?.name || "User"}</h1>
            <div className="flex flex-col md:flex-row gap-4 text-slate-400 text-sm justify-center md:justify-start">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" /> {user?.email}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" /> 
                Joined {stats.joinedAt ? new Date(stats.joinedAt).toLocaleDateString() : "recently"}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10">
              <Code2 className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Problems Solved</p>
              <p className="text-2xl font-bold text-white">{stats.totalSolved}</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-500/10">
              <Flame className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Current Streak</p>
              <p className="text-2xl font-bold text-white">{stats.currentStreak} Days</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-yellow-500/10">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Best Streak</p>
              <div className="flex flex-col">
                 <span className="text-2xl font-bold text-white">{stats.longestStreak} Days</span>
                 <span className="text-[10px] text-slate-500">{stats.bestStreakRange}</span>
              </div>
            </div>
          </div>
        </div>

        {/* HEATMAP SECTION */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-500" /> Activity Map
            </h2>
            
            {/* LEGEND: Less -> More Green */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Less</span>
              <div title="0 Submissions" className="w-3 h-3 bg-slate-800 rounded-sm border border-slate-700"></div>
              <div title="1-2 Submissions" className="w-3 h-3 bg-green-900 rounded-sm border border-green-800"></div>
              <div title="3-5 Submissions" className="w-3 h-3 bg-green-700 rounded-sm border border-green-600"></div>
              <div title="6+ Submissions" className="w-3 h-3 bg-green-500 rounded-sm border border-green-400"></div>
              <span>More</span>
            </div>
          </div>
          
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[850px]"> 
               
               {/* Month Labels */}
               <div className="relative h-6 mb-1 w-full">
                 {monthLabels.map((m, i) => (
                    <span 
                      key={i} 
                      className="absolute text-[10px] text-slate-500 font-medium whitespace-nowrap"
                      style={{ left: `${m.index * 16}px` }} 
                    >
                      {m.name}
                    </span>
                 ))}
               </div>

               {/* Grid */}
               <div className="flex gap-1">
                  <div className="grid grid-rows-7 grid-flow-col gap-1">
                    {heatmapDays.map((day, i) => (
                      <div 
                        key={i}
                        title={`${day.date}: ${day.count} submissions`}
                        className={`w-3 h-3 rounded-sm ${day.colorClass} hover:ring-1 ring-white/50 transition-all`}
                      />
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" /> Recent History
          </h2>
          
          {loading ? (
             <p className="text-slate-500 animate-pulse">Loading history...</p>
          ) : stats.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
                <div key={activity._id} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-slate-800/50 hover:border-slate-700 transition group">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${activity.status === 'Success' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      {activity.status === 'Success' ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">
                        Ran <span className="uppercase text-blue-400 font-bold">{activity.language}</span> Code
                      </p>
                      <p className="text-xs text-slate-500">{new Date(activity.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${activity.status === 'Success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                      {activity.status}
                    </span>
                    <button 
                      onClick={() => handleLoadCode(activity.code, activity.language)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg text-xs flex items-center gap-1"
                    >
                      Solve Again <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p>No recent submissions.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Profile;