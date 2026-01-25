// Custom Service Worker for Routine Notifications
// Handles background push notifications and scheduled alerts

const CACHE_NAME = 'inovafinance-routines-v1';
const ROUTINE_ALERTS_KEY = 'routine-alerts';

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW Routines] Installing...');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW Routines] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW Routines] Push received:', event);
  
  let data = {
    title: '🔔 INOVA Finance',
    body: 'Você tem uma nova notificação',
    icon: '/apple-touch-icon.png',
    badge: '/apple-touch-icon.png',
    tag: 'routine-notification',
    data: {}
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/apple-touch-icon.png',
    badge: data.badge || '/apple-touch-icon.png',
    tag: data.tag,
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 300],
    actions: data.actions || [
      { action: 'start', title: '▶️ Iniciar' },
      { action: 'dismiss', title: '❌ Dispensar' }
    ],
    data: data.data
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW Routines] Notification clicked:', event.action);
  
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to find an existing window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          // Send message to the client about the action
          client.postMessage({
            type: 'NOTIFICATION_ACTION',
            action: action,
            routineId: data.routineId,
            executionId: data.executionId
          });
          return;
        }
      }
      
      // If no window found, open a new one
      if (clients.openWindow) {
        const url = action === 'start' && data.routineId 
          ? `/rotinas?start=${data.routineId}`
          : '/rotinas';
        return clients.openWindow(url);
      }
    })
  );
});

// Message handler for scheduling and canceling notifications
self.addEventListener('message', (event) => {
  console.log('[SW Routines] Message received:', event.data);
  
  const { type, payload } = event.data;

  switch (type) {
    case 'SCHEDULE_NOTIFICATION':
      scheduleNotification(payload);
      break;
    case 'CANCEL_NOTIFICATION':
      cancelNotification(payload.id);
      break;
    case 'GET_SCHEDULED':
      getScheduledNotifications().then((notifications) => {
        event.ports[0].postMessage({ notifications });
      });
      break;
    case 'SHOW_IMMEDIATE':
      showImmediateNotification(payload);
      break;
  }
});

// Periodic sync for checking scheduled notifications
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-routines') {
    event.waitUntil(checkScheduledRoutines());
  }
});

// Background sync for offline routine updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-routines') {
    event.waitUntil(syncRoutineData());
  }
});

// Store scheduled notifications in IndexedDB
async function scheduleNotification(notification) {
  try {
    const db = await openDB();
    const tx = db.transaction('scheduled-notifications', 'readwrite');
    const store = tx.objectStore('scheduled-notifications');
    
    await store.put({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      scheduledTime: notification.scheduledTime,
      routineId: notification.routineId,
      executionId: notification.executionId,
      type: notification.type || 'routine'
    });
    
    console.log('[SW Routines] Notification scheduled:', notification.id);
    
    // Set up alarm if supported
    if ('alarms' in navigator) {
      const delay = notification.scheduledTime - Date.now();
      if (delay > 0) {
        navigator.alarms.set('routine-' + notification.id, { delayInMinutes: delay / 60000 });
      }
    }
  } catch (error) {
    console.error('[SW Routines] Error scheduling notification:', error);
  }
}

async function cancelNotification(id) {
  try {
    const db = await openDB();
    const tx = db.transaction('scheduled-notifications', 'readwrite');
    const store = tx.objectStore('scheduled-notifications');
    await store.delete(id);
    console.log('[SW Routines] Notification canceled:', id);
  } catch (error) {
    console.error('[SW Routines] Error canceling notification:', error);
  }
}

async function getScheduledNotifications() {
  try {
    const db = await openDB();
    const tx = db.transaction('scheduled-notifications', 'readonly');
    const store = tx.objectStore('scheduled-notifications');
    return await store.getAll();
  } catch (error) {
    console.error('[SW Routines] Error getting notifications:', error);
    return [];
  }
}

async function checkScheduledRoutines() {
  try {
    const notifications = await getScheduledNotifications();
    const now = Date.now();
    
    for (const notification of notifications) {
      if (notification.scheduledTime <= now) {
        // Show the notification
        await self.registration.showNotification(notification.title, {
          body: notification.body,
          icon: '/apple-touch-icon.png',
          badge: '/apple-touch-icon.png',
          tag: 'routine-' + notification.id,
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 300],
          actions: [
            { action: 'start', title: '▶️ Iniciar' },
            { action: 'dismiss', title: '❌ Dispensar' }
          ],
          data: {
            routineId: notification.routineId,
            executionId: notification.executionId
          }
        });
        
        // Remove from scheduled
        await cancelNotification(notification.id);
      }
    }
  } catch (error) {
    console.error('[SW Routines] Error checking routines:', error);
  }
}

async function showImmediateNotification(payload) {
  try {
    await self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/apple-touch-icon.png',
      badge: '/apple-touch-icon.png',
      tag: payload.tag || 'routine-immediate',
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 300],
      actions: payload.actions || [
        { action: 'start', title: '▶️ Iniciar' },
        { action: 'dismiss', title: '❌ Dispensar' }
      ],
      data: payload.data || {}
    });
  } catch (error) {
    console.error('[SW Routines] Error showing notification:', error);
  }
}

async function syncRoutineData() {
  // Placeholder for syncing offline routine completions
  console.log('[SW Routines] Syncing routine data...');
}

// IndexedDB helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('inovafinance-routines', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('scheduled-notifications')) {
        db.createObjectStore('scheduled-notifications', { keyPath: 'id' });
      }
    };
  });
}

console.log('[SW Routines] Service Worker loaded');
