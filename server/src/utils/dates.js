// "YYYY-MM-DD" for the given date in UTC — the key used by wellnessHistory entries.
export const utcDateKey = (date = new Date()) => date.toISOString().slice(0, 10);

export const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
