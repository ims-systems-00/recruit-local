// in localStorage so other tabs, which next-auth signs out too, see it as well
const KEY = 'rl-signing-out';
const FRESH_MS = 30_000;

// call before signOut so the session watcher knows this logout was on purpose
export const markSignOut = () => {
  localStorage.setItem(KEY, String(Date.now()));
};

export const isSigningOut = () =>
  Date.now() - Number(localStorage.getItem(KEY) ?? 0) < FRESH_MS;

export const resetSignOut = () => {
  localStorage.removeItem(KEY);
};
