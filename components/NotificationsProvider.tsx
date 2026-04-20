/**
 * @fileoverview Provider de notifications Push Web — Edunet / UOB
 *
 * CORRECTIFS appliqués :
 * 1. VAPID key lue depuis import.meta.env.VITE_VAPID_PUBLIC_KEY (plus hardcodée)
 * 2. Abonnement sauvegardé avec upsert (conflict sur user_id)
 * 3. Gestion d'erreur robuste : si VAPID key manquante → pas de crash
 * 4. Réabonnement propre si les clés ont changé
 *
 * Architecture Push complète :
 *   1. Ce composant → demande permission + sauvegarde abonnement dans push_subscriptions
 *   2. Trigger DB (trg_push_notification) → appelle l'Edge Function à chaque notification
 *   3. Edge Function (send-push-notification) → envoie la notification Push au navigateur
 *   4. Service Worker (service-worker.js) → affiche la notification à l'utilisateur
 *
 * @author Roland Myaka
 */
import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { supabase } from '../services/supabase';
import NotificationPermissionBanner from './NotificationPermissionBanner';

// ── Lire la VAPID Public Key depuis les variables d'environnement ──────────
// VITE_ préfixe = exposé côté client (safe, c'est la clé publique)
const getVapidPublicKey = (): string => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_VAPID_PUBLIC_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_VAPID_PUBLIC_KEY as string;
  }
  if (typeof process !== 'undefined' && process.env?.VITE_VAPID_PUBLIC_KEY) {
    return process.env.VITE_VAPID_PUBLIC_KEY as string;
  }
  return '';
};

const VAPID_PUBLIC_KEY = getVapidPublicKey();

// ── Convertir base64url → Uint8Array (requis par pushManager.subscribe) ───
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output  = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

const NotificationsProvider: React.FC = () => {
  const { session } = useAuth();
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');

  // Lire la permission au montage
  useEffect(() => {
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  // ── Sauvegarder l'abonnement Push dans Supabase ─────────────────────────
  const saveSubscription = async (subscription: PushSubscription): Promise<void> => {
    if (!session?.user) return;

    const subJson = subscription.toJSON();

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id:      session.user.id,
          subscription: subJson,
          updated_at:   new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('[Edunet Push] Erreur sauvegarde abonnement:', error.message);
    } else {
      console.log('[Edunet Push] ✅ Abonnement Push sauvegardé en base.');
    }
  };

  // ── S'abonner aux notifications Push ────────────────────────────────────
  const subscribeUserToPush = async (): Promise<void> => {
    if (!VAPID_PUBLIC_KEY) {
      console.warn('[Edunet Push] VITE_VAPID_PUBLIC_KEY manquante dans .env.local — notifications Push désactivées.');
      return;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[Edunet Push] Push non supporté par ce navigateur.');
      return;
    }

    try {
      const serviceWorker = await navigator.serviceWorker.ready;

      // Supprimer l'ancien abonnement s'il existe
      // (pour éviter les conflits si la VAPID key a changé)
      const existing = await serviceWorker.pushManager.getSubscription();
      if (existing) {
        try { await existing.unsubscribe(); } catch {}
      }

      // Créer un nouvel abonnement
      const subscription = await serviceWorker.pushManager.subscribe({
        userVisibleOnly:       true,
        applicationServerKey:  urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      console.log('[Edunet Push] Abonnement Push créé:', subscription.endpoint.substring(0, 60) + '...');

      await saveSubscription(subscription);

    } catch (error: any) {
      console.error('[Edunet Push] Erreur abonnement Push:', error.message || error);
    }
  };

  // Se (ré)abonner quand la session est active et la permission accordée
  useEffect(() => {
    if (session?.user && notifPermission === 'granted') {
      subscribeUserToPush();
    }
  }, [session?.user?.id, notifPermission]);

  // ── Demander la permission ───────────────────────────────────────────────
  const handleRequestPermission = async (): Promise<void> => {
    if (!('Notification' in window)) {
      alert('Ce navigateur ne supporte pas les notifications.');
      return;
    }

    const permission = await Notification.requestPermission();
    setNotifPermission(permission);

    if (permission === 'granted') {
      await subscribeUserToPush();
    }
  };

  // Afficher le banner uniquement si la permission n'a pas encore été donnée
  if (notifPermission !== 'default') return null;

  return (
    <NotificationPermissionBanner onRequestPermission={handleRequestPermission}/>
  );
};

export default NotificationsProvider;