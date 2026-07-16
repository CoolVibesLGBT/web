import { useEffect, useRef } from "react";
import { urlBase64ToUint8Array } from "../helpers/helpers";
import { canUseBrowserNotifications, canUsePushNotifications, resolvePublicAssetUrl } from "../platform/runtime";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";

export function PushNotificationSetupContext() {
  const { isAuthenticated } = useAuth();
  const fallbackInterval = useRef<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (fallbackInterval.current) {
        clearInterval(fallbackInterval.current);
        fallbackInterval.current = null;
      }
      return;
    }

    const ua = navigator.userAgent.toLowerCase();
    const isOpera = ua.includes("opr") || ua.includes("opera");
    const isSafari =
      /^((?!chrome|android|opr).)*safari/i.test(navigator.userAgent);

    if (!canUsePushNotifications()) {
      return;
    }

    if (isOpera || isSafari) {
      console.debug("Opera/Safari detected → Using fallback notifications");
      enableFallback();
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.debug("Browser does not support Push → fallback enabled");
      enableFallback();
      return;
    }

    setupPush();

    return () => {
      if (fallbackInterval.current) {
        clearInterval(fallbackInterval.current);
        fallbackInterval.current = null;
      }
    };
  }, [isAuthenticated]);

  async function setupPush() {
    try {
      const reg = await navigator.serviceWorker.register(resolvePublicAssetUrl("/service-worker.js"));
      console.debug("SW registered:", reg.scope);





      let permission = Notification.permission;
      if (permission === "default") permission = await Notification.requestPermission();

      if (permission !== "granted") {
        console.debug("Push notifications disabled by browser permission");
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
          console.debug("subscribe() failed → fallback", err);
          enableFallback();
          return;
        }
      }

      const json = sub?.toJSON ? sub.toJSON() : sub;

      await api.handleSetVapidSubscriptions({
        subscriptions: JSON.stringify(json),
      });

      console.debug("Push subscription stored");

    } catch (err) {
      console.error("Push setup error → fallback", err);
      enableFallback();
    }
  }


  function enableFallback() {
    if (fallbackInterval.current) return;

    if (!canUseBrowserNotifications()) {
      return;
    }

    if (!("Notification" in window)) {
      console.debug("This browser does not support desktop notifications");
      return;
    }

    if (Notification.permission === "denied") {
      console.debug("Notification fallback skipped because permission is denied");
      return;
    }

    fallbackInterval.current = window.setInterval(async () => {
      try {
        const res = await api.checkNewNotifications(1, null);

        if (res?.success && res.notifications && res.notifications.length > 0) {
          const unread = res.notifications.some((n: any) => n.is_read === false);

          if (unread) {
            const firstUnread = res.notifications.find((n: any) => n.is_read === false);

            // İzin kontrolü ve isteği
            if (Notification.permission !== "granted") {
              const permission = await Notification.requestPermission();
              if (permission !== "granted") {
                console.debug("Notification permission not granted");
                return;
              }
            }

            const notif = new Notification(firstUnread.title || "New Notification", {
              body: firstUnread.payload?.body || firstUnread.message || "You have new notifications",
              icon: "https://coolvibes.lgbt/icons/icon_128x128.png"
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

    console.debug("Fallback polling enabled");
  }

  return null;
}
