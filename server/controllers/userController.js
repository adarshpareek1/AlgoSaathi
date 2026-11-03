import mongoose from 'mongoose';
import Submission from '../models/Submission.js';
import User from '../models/User.js';

/**
 * Calculates current streak and longest streak from an array of descending unique date strings (YYYY-MM-DD).
 */
const calculateStreaks = (uniqueDatesDesc) => {
  let currentStreak = 0;
  let longestStreak = 0;
  let bestStreakEndDate = null;

  if (!uniqueDatesDesc || uniqueDatesDesc.length === 0) {
    return { currentStreak: 0, longestStreak: 0, bestStreakRange: "No streak yet" };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  // 1. Current streak calculation
  if (uniqueDatesDesc[0] === todayStr || uniqueDatesDesc[0] === yesterdayStr) {
    currentStreak = 1;
    for (let i = 0; i < uniqueDatesDesc.length - 1; i++) {
      const curr = new Date(uniqueDatesDesc[i]);
      const next = new Date(uniqueDatesDesc[i + 1]);
      const diffDays = Math.round((curr - next) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // 2. Longest streak calculation
  let tempStreak = 1;
  let tempEndDate = uniqueDatesDesc[0];

  for (let i = 0; i < uniqueDatesDesc.length - 1; i++) {
    const curr = new Date(uniqueDatesDesc[i]);
    const next = new Date(uniqueDatesDesc[i + 1]);
    const diffDays = Math.round((curr - next) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      tempStreak++;
    } else {
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
        bestStreakEndDate = tempEndDate;
      }
      tempStreak = 1;
      tempEndDate = uniqueDatesDesc[i + 1];
    }
  }

  if (tempStreak > longestStreak) {
    longestStreak = tempStreak;
    bestStreakEndDate = tempEndDate;
  }

  let bestStreakRange = "No streak yet";
  if (longestStreak > 0 && bestStreakEndDate) {
    const end = new Date(bestStreakEndDate);
    const start = new Date(end);
    start.setDate(start.getDate() - (longestStreak - 1));

    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    bestStreakRange = `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  }

  return { currentStreak, longestStreak, bestStreakRange };
};

/**
 * Controller: Get Aggregated User Profile & Heatmap
 * Fully optimized with MongoDB Aggregation Pipelines
 */
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Fetch user basic profile
    const user = await User.findById(userId).select('username email createdAt avatar');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Heatmap date range: past 365 days or full past year
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    oneYearAgo.setHours(0, 0, 0, 0);

    // Run parallel MongoDB aggregations for maximum performance
    const [statsResult, heatmapAggResult, successDatesAggResult, recentActivity] = await Promise.all([
      // 1. Pipeline: Overall stats, total submissions, total solved, and language breakdown
      Submission.aggregate([
        { $match: { user: userObjectId } },
        {
          $facet: {
            overall: [
              {
                $group: {
                  _id: null,
                  totalSubmissions: { $sum: 1 },
                  totalSolved: {
                    $sum: { $cond: [{ $eq: ["$status", "Success"] }, 1, 0] }
                  },
                  totalErrors: {
                    $sum: { $cond: [{ $eq: ["$status", "Error"] }, 1, 0] }
                  }
                }
              }
            ],
            languages: [
              {
                $group: {
                  _id: "$language",
                  count: { $sum: 1 },
                  solved: {
                    $sum: { $cond: [{ $eq: ["$status", "Success"] }, 1, 0] }
                  }
                }
              },
              { $sort: { count: -1 } }
            ]
          }
        }
      ]),

      // 2. Pipeline: Daily Heatmap Aggregation (Past 365 days)
      Submission.aggregate([
        {
          $match: {
            user: userObjectId,
            createdAt: { $gte: oneYearAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt"
              }
            },
            count: { $sum: 1 },
            successCount: {
              $sum: { $cond: [{ $eq: ["$status", "Success"] }, 1, 0] }
            },
            errorCount: {
              $sum: { $cond: [{ $eq: ["$status", "Error"] }, 1, 0] }
            },
            languages: { $addToSet: "$language" }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // 3. Pipeline: Distinct dates with at least one successful submission for streak calculation
      Submission.aggregate([
        {
          $match: {
            user: userObjectId,
            status: "Success"
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt"
              }
            }
          }
        },
        { $sort: { _id: -1 } }
      ]),

      // 4. Lean query: 6 most recent submissions with projected fields
      Submission.find({ user: userId })
        .select('language status createdAt output code')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean()
    ]);

    // Format Overall Metrics
    const overallStats = statsResult[0]?.overall[0] || {
      totalSubmissions: 0,
      totalSolved: 0,
      totalErrors: 0
    };

    const languageStats = (statsResult[0]?.languages || []).map(item => ({
      language: item._id,
      count: item.count,
      solved: item.solved
    }));

    const acceptanceRate = overallStats.totalSubmissions > 0
      ? Math.round((overallStats.totalSolved / overallStats.totalSubmissions) * 100)
      : 0;

    // Transform Heatmap Aggregation Array into Key-Value Map
    // Provide both backward-compatible numeric counts and enriched metadata
    const heatmapData = {};
    const heatmapMeta = {};
    let totalHeatmapSubmissions = 0;
    let maxInSingleDay = 0;

    heatmapAggResult.forEach(item => {
      const dateKey = item._id;
      heatmapData[dateKey] = item.count;
      heatmapMeta[dateKey] = {
        count: item.count,
        successCount: item.successCount,
        errorCount: item.errorCount,
        languages: item.languages
      };
      totalHeatmapSubmissions += item.count;
      if (item.count > maxInSingleDay) {
        maxInSingleDay = item.count;
      }
    });

    // Compute Streaks from lean unique dates
    const uniqueSuccessDates = successDatesAggResult.map(item => item._id);
    const { currentStreak, longestStreak, bestStreakRange } = calculateStreaks(uniqueSuccessDates);

    res.json({
      success: true,
      joinedAt: user.createdAt,
      totalSolved: overallStats.totalSolved,
      totalSubmissions: overallStats.totalSubmissions,
      acceptanceRate,
      languageStats,
      currentStreak,
      longestStreak,
      bestStreakRange,
      totalHeatmapSubmissions,
      maxInSingleDay,
      activeDaysCount: heatmapAggResult.length,
      recentActivity,
      heatmapData,
      heatmapMeta
    });

  } catch (error) {
    console.error("Error fetching aggregated profile:", error);
    res.status(500).json({ message: "Error fetching user profile stats" });
  }
};

/**
 * Controller: Get submissions for a specific date (for Heatmap day click inspection)
 */
export const getSubmissionsByDate = async (req, res) => {
  try {
    const userId = req.user._id;
    const { date } = req.query; // format: YYYY-MM-DD

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "Valid date query parameter (YYYY-MM-DD) is required" });
    }

    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const submissions = await Submission.find({
      user: userId,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    })
      .select('language status createdAt output code')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      date,
      count: submissions.length,
      submissions
    });
  } catch (error) {
    console.error("Error fetching submissions by date:", error);
    res.status(500).json({ message: "Error fetching day activity" });
  }
};