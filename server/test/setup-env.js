// Imported first by every test so these values win over server/.env
// (dotenv never overrides variables that are already set).
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-that-is-long-enough-for-the-checks-000";
process.env.DATABASE_URL = "postgres://pglite-in-memory";
process.env.MONGODB_URI = "mongodb://unused-in-tests";
process.env.GEMINI_API_KEY = "";
process.env.OPENROUTER_API_KEY = "";
process.env.OPEN_ROUTER_API_KEY = "";
process.env.SMTP_HOST = "";
process.env.CRISIS_ALERT_EMAIL = "helpline@example.test";
process.env.CRISIS_ALERT_COOLDOWN_MINUTES = "30";
process.env.CHAT_SESSION_TTL_HOURS = "24";
process.env.CRON_SECRET = "test-cron-secret";
