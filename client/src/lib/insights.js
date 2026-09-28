import { Brain, Calendar, Heart, Moon, Sparkles, Sun, Trophy } from "lucide-react";
import { format, isToday, subDays } from "date-fns";

const MINDFUL_TYPES = ["game", "meditation", "breathing"];

/**
 * Merge activities and mood check-ins into one timeline:
 * [{ type, name, timestamp: Date, completed, moodScore }]
 */
export function buildTimeline(activities = [], moods = []) {
  return [
    ...activities.map((a) => ({
      type: a.type,
      name: a.name,
      timestamp: new Date(a.timestamp),
      completed: a.completed !== false,
      moodScore: null,
    })),
    ...moods.map((m) => ({
      type: "mood",
      name: "Mood check-in",
      timestamp: new Date(m.timestamp),
      completed: true,
      moodScore: m.score,
    })),
  ].sort((a, b) => a.timestamp - b.timestamp);
}

export function dailyStats(timeline) {
  const lastWeek = subDays(new Date(), 7);
  const activeDays = new Set(
    timeline.filter((e) => e.timestamp >= lastWeek).map((e) => format(e.timestamp, "yyyy-MM-dd")),
  );
  return {
    activitiesToday: timeline.filter((e) => e.type !== "mood" && isToday(e.timestamp)).length,
    activeDaysThisWeek: Math.min(7, activeDays.size),
  };
}

/** Up to three personalised insights based on the last 7 days. `key` → dashboard:insights.<key>. */
export function generateInsights(timeline) {
  const insights = [];
  const lastWeek = subDays(new Date(), 7);
  const recent = timeline.filter((e) => e.timestamp >= lastWeek);

  const moods = recent.filter((e) => e.type === "mood" && e.moodScore !== null);
  if (moods.length >= 2) {
    const average = moods.reduce((sum, e) => sum + e.moodScore, 0) / moods.length;
    const latest = moods[moods.length - 1].moodScore;
    if (latest > average) {
      insights.push({
        key: "moodUp",
        icon: Brain,
        priority: "high",
      });
    } else if (latest < average - 20) {
      insights.push({
        key: "moodDown",
        icon: Heart,
        priority: "high",
      });
    }
  }

  const mindful = recent.filter((e) => MINDFUL_TYPES.includes(e.type));
  if (mindful.length > 0) {
    insights.push(
      mindful.length / 7 >= 1
        ? {
            key: "consistent",
            icon: Trophy,
            priority: "medium",
          }
        : {
            key: "mindful",
            icon: Sparkles,
            priority: "low",
          },
    );
  }

  const activities = recent.filter((e) => e.type !== "mood");
  if (activities.length === 0 && moods.length === 0) {
    insights.push({
      key: "start",
      icon: Calendar,
      priority: "medium",
    });
  }

  const morning = recent.filter((e) => e.timestamp.getHours() < 12).length;
  const evening = recent.filter((e) => e.timestamp.getHours() >= 18).length;
  if (recent.length >= 3 && morning > evening) {
    insights.push({
      key: "morning",
      icon: Sun,
      priority: "medium",
    });
  } else if (recent.length >= 3 && evening > morning) {
    insights.push({
      key: "evening",
      icon: Moon,
      priority: "medium",
    });
  }

  const order = { high: 0, medium: 1, low: 2 };
  return insights.sort((a, b) => order[a.priority] - order[b.priority]).slice(0, 3);
}
