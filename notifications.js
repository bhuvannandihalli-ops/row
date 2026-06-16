/* Shared push-notification helper — include on any page that needs it */

const VAPID_PUBLIC_KEY = 'BJNVr2KToaZWxAjBD290jm_meihY5HAEgrIFZEWTv5w5SgNzde5GR0KP61NMn9dSeGJE2mM-MYKpNXe5ZMA2YB0';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

async function getRegistration() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch {
    return null;
  }
}

async function getSubscription(reg) {
  try { return await reg.pushManager.getSubscription(); } catch { return null; }
}

async function subscribe(reg) {
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
}

async function saveSubscription(sub) {
  try {
    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub.toJSON() }),
    });
  } catch {}
}

/* Returns 'granted' | 'denied' | 'unsupported' | 'default' */
window.notifStatus = async function() {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

/* Request permission and subscribe — call on user gesture */
window.enableNotifications = async function() {
  const reg = await getRegistration();
  if (!reg) return 'unsupported';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission;

  let sub = await getSubscription(reg);
  if (!sub) sub = await subscribe(reg);
  await saveSubscription(sub);
  return 'granted';
};

/* Schedule a reminder. remindAt = ISO string or Date */
window.scheduleReminder = async function({ text, remindAt, url = '/void.html' }) {
  try {
    await fetch('/api/remind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, remindAt: new Date(remindAt).toISOString(), url }),
    });
    return true;
  } catch {
    return false;
  }
};

/* Auto-register SW silently on every page load */
document.addEventListener('DOMContentLoaded', async () => {
  const reg = await getRegistration();
  if (!reg) return;
  if (Notification.permission === 'granted') {
    const sub = await getSubscription(reg);
    if (!sub) { const s = await subscribe(reg); await saveSubscription(s); }
  }
});
