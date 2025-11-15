import { useEffect, useRef } from "react";
import { urlBase64ToUint8Array } from "../helpers/helpers";
import { api } from "../services/api";

export function PushNotificationSetupContext() {
  const fallbackInterval = useRef<number | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isOpera = ua.includes("opr") || ua.includes("opera");
    const isSafari =
      /^((?!chrome|android|opr).)*safari/i.test(navigator.userAgent);

    if (isOpera || isSafari) {
      console.warn("Opera/Safari detected → Using fallback notifications");
      enableFallback();
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Browser does not support Push → fallback enabled");
      enableFallback();
      return;
    }

    setupPush();

    return () => {
      if (fallbackInterval.current) {
        clearInterval(fallbackInterval.current);
      }
    };
  }, []);

  async function setupPush() {
    try {
      const reg = await navigator.serviceWorker.register("/service-worker.js");
      console.log("SW registered:", reg.scope);





      let permission = Notification.permission;
      if (permission === "default") permission = await Notification.requestPermission();

      if (permission !== "granted") {
        console.warn("Permission denied → fallback enabled");
        enableFallback();
        return;
      }


      const existing = await reg.pushManager.getSubscription();
      const vapidKey = await api.handleGetVapidKey();

      let sub = existing;

      if (!sub) {
        try {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey.key),
          });
        } catch (err) {
          console.warn("subscribe() failed → fallback", err);
          enableFallback();
          return;
        }
      }

      const json = sub?.toJSON ? sub.toJSON() : sub;

      await api.handleSetVapidSubscriptions({
        subscriptions: JSON.stringify(json),
      });

      console.log("Push subscription stored");

    } catch (err) {
      console.error("Push setup error → fallback", err);
      enableFallback();
    }
  }


  function enableFallback() {
    if (fallbackInterval.current) return;

    if (!("Notification" in window)) {
      console.warn("This browser does not support desktop notifications");
      return;
    }

    fallbackInterval.current = window.setInterval(async () => {
      try {
        const res = await api.checkNewNotifications();

        if (res?.success && res.notifications && res.notifications.length > 0) {
          const unread = res.notifications.some(n => n.is_read === false);

          if (unread) {
            const firstUnread = res.notifications.find(n => n.is_read === false);

            // İzin kontrolü ve isteği
            if (Notification.permission !== "granted") {
              const permission = await Notification.requestPermission();
              if (permission !== "granted") {
                console.warn("Notification permission not granted");
                return;
              }
            }

            const notif = new Notification(firstUnread.title || "New Notification", {
              body: firstUnread.payload?.body || firstUnread.message || "You have new notifications",
              icon: "https://coolvibes.io/icons/icon_128x128.png"
            });

            notif.onclick = function (event) {
              event.preventDefault();
              window.open(firstUnread.payload?.url || "https://coolvibes.lgbt", "_blank");
              notif.close();
            };
          }
        }
      } catch (err) {
        console.error("Fallback polling failed", err);
      }
    }, 15000);

    console.warn("Fallback polling enabled");
  }

  return null;
}