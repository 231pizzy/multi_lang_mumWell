import { api } from "./client";

export { api, getErrorMessage, tokenStorage, UNAUTHORIZED_EVENT } from "./client";

const data = (promise) => promise.then((res) => res.data);

// Program generation writes 90 days of content, so allow it more time.
const LONG_REQUEST = { timeout: 5 * 60_000 };

export const authApi = {
  login: (email, password) => data(api.post("/auth/login", { email, password })),
  register: (details) => data(api.post("/auth/register", details)),
  me: () => data(api.get("/auth/me")),
  logout: () => data(api.post("/auth/logout")),
  forgotPassword: (email) => data(api.post("/auth/forgot-password", { email })),
  resetPassword: (token, password) => data(api.post("/auth/reset-password", { token, password })),
};

export const accountApi = {
  update: (changes) => data(api.patch("/account", changes)).then((d) => d.user),
  acceptConsents: (consents) => data(api.post("/account/consents", consents)).then((d) => d.user),
  changePassword: (currentPassword, newPassword) =>
    data(api.put("/account/password", { currentPassword, newPassword })),
  exportData: () => data(api.get("/account/export", { timeout: 60_000 })),
  deleteAccount: (password) => data(api.delete("/account", { data: { password } })),
};

export const chatApi = {
  createSession: () => data(api.post("/chat/sessions")).then((d) => d.sessionId),
  listSessions: () => data(api.get("/chat/sessions")),
  getHistory: (sessionId) => data(api.get(`/chat/sessions/${sessionId}/history`)),
  sendMessage: (sessionId, message) =>
    data(api.post(`/chat/sessions/${sessionId}/messages`, { message }, { timeout: 90_000 })),
};

export const trackingApi = {
  saveMood: (score, note) => data(api.post("/mood", { score, note })),
  latestMood: () => data(api.get("/mood")).then((d) => d.data),
  moodHistory: (days = 30) => data(api.get("/mood/history", { params: { days } })).then((d) => d.data),
  saveTest: (result) => data(api.post("/test", result)),
  latestTest: () => data(api.get("/test")).then((d) => d.data),
  logActivity: (activity) => data(api.post("/activity", activity)),
  activities: (days = 28) => data(api.get("/activity", { params: { days } })).then((d) => d.data),
};

export const programApi = {
  get: () => data(api.get("/program")).then((d) => d.user),
  create: (profile) => data(api.post("/program", profile, LONG_REQUEST)).then((d) => d.user),
  completeDay: (day, thoughts) => data(api.put("/program/day", { day, thoughts })),
  wellness: () => data(api.get("/wellness")).then((d) => d.wellnessHistory),
  saveWellness: (entry) => data(api.post("/wellness", entry)),
};

export const consultationApi = {
  doctors: () => data(api.get("/consultations/doctors")),
  suggest: (notes) =>
    data(api.post("/consultations/suggest", { notes }, { timeout: 60_000 })).then(
      (d) => d.suggestedDoctors,
    ),
  create: (notes, selectedDoctor) => data(api.post("/consultations", { notes, selectedDoctor })),
  list: () => data(api.get("/consultations")),
  get: (sessionId) => data(api.get(`/consultations/${sessionId}`)),
  /** Live check of one finished sentence she spoke; returns { crisis, newCrisis }. */
  utterance: (sessionId, text, previous) =>
    data(api.post(`/consultations/${sessionId}/utterances`, { text, previous })),
  report: (sessionId, messages) =>
    data(api.post(`/consultations/${sessionId}/report`, { messages }, { timeout: 90_000 })),
};

export const notificationApi = {
  get: () => data(api.get("/notifications")),
  update: (settings) => data(api.put("/notifications", settings)),
};
