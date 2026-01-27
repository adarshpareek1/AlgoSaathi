import Submission from '../models/Submission.js';
import User from '../models/User.js'; 

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('createdAt');

    const allSubmissions = await Submission.find({ user: userId, status: 'Success' })
      .sort({ createdAt: -1 });

    const uniqueDates = [...new Set(allSubmissions.map(sub => 
      sub.createdAt.toISOString().split('T')[0]
    ))].sort((a, b) => new Date(b) - new Date(a)); 

    let currentStreak = 0;
    let longestStreak = 0;
    let bestStreakEndDate = null; 

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (uniqueDates.length > 0) {
      if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
        currentStreak = 1;
        for (let i = 0; i < uniqueDates.length - 1; i++) {
          const curr = new Date(uniqueDates[i]);
          const next = new Date(uniqueDates[i+1]);
          const diffDays = (curr - next) / (1000 * 60 * 60 * 24);
          
          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    let tempStreak = 0;
    let tempEndDate = null;

    if (uniqueDates.length > 0) {
        tempStreak = 1;
        tempEndDate = uniqueDates[0];
        
        for (let i = 0; i < uniqueDates.length - 1; i++) {
            const curr = new Date(uniqueDates[i]);
            const next = new Date(uniqueDates[i+1]);
            const diffDays = (curr - next) / (1000 * 60 * 60 * 24);

            if (diffDays === 1) {
                tempStreak++;
            } else {
                if (tempStreak > longestStreak) {
                    longestStreak = tempStreak;
                    bestStreakEndDate = tempEndDate;
                }
                tempStreak = 1;
                tempEndDate = uniqueDates[i+1];
            }
        }
        if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
            bestStreakEndDate = tempEndDate;
        }
    }
    
    let bestStreakRange = "No streak yet";
    if (longestStreak > 0 && bestStreakEndDate) {
        const end = new Date(bestStreakEndDate);
        const start = new Date(end);
        start.setDate(start.getDate() - (longestStreak - 1));
        
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        bestStreakRange = `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
    }

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const heatmapSubmissions = await Submission.find({
        user: userId,
        createdAt: { $gte: oneYearAgo }
    });

    const heatmapData = {};
    heatmapSubmissions.forEach(sub => {
      const date = sub.createdAt.toISOString().split('T')[0];
      heatmapData[date] = (heatmapData[date] || 0) + 1;
    });

    const recentActivity = await Submission.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      joinedAt: user.createdAt, 
      totalSolved: allSubmissions.length, 
      currentStreak,
      longestStreak,
      bestStreakRange,
      recentActivity,
      heatmapData
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching profile" });
  }
};