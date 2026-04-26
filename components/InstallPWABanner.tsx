/**
 * @fileoverview Banner d'installation PWA — Edunet / UOB
 *
 * Supporte les deux plateformes :
 *
 * ANDROID :
 *   - Écoute l'événement `beforeinstallprompt` natif du navigateur
 *   - Affiche un bouton "Installer" → déclenche le prompt natif Android
 *   - Si le prompt n'est pas disponible (app déjà installée ou navigateur
 *     non compatible), n'affiche rien
 *
 * iOS (Safari) :
 *   - `beforeinstallprompt` n'existe pas sur iOS/Safari
 *   - Affiche des instructions manuelles (partager → écran d'accueil)
 *   - Affiché après 3 secondes si l'app n'est pas déjà installée
 *
 * Les deux cas :
 *   - Ne s'affiche jamais si l'app est déjà en mode standalone (installée)
 *   - Mémorise le refus dans sessionStorage pour ne pas re-afficher
 *
 * @author Roland Myaka
 */
import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Share, PlusSquare } from 'lucide-react';

interface Props {
  onComplete: () => void;
}

const InstallPWABanner: React.FC<Props> = ({ onComplete }) => {
  // Prompt natif Android (BeforeInstallPromptEvent)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible]               = useState(false);
  const [platform, setPlatform]             = useState<'android' | 'ios' | 'none'>('none');
  const [installing, setInstalling]         = useState(false);

  useEffect(() => {
    // ── Détecter si déjà installé en mode standalone ────────────────────
    const isStandalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;

    if (isStandalone) {
      // L'app est déjà installée → ne rien afficher
      onComplete();
      return;
    }

    // ── Détecter si l'utilisateur a déjà refusé (session en cours) ──────
    const dismissed = sessionStorage.getItem('pwa-dismissed');
    if (dismissed) {
      onComplete();
      return;
    }

    // ── Détecter la plateforme ───────────────────────────────────────────
    const ua        = window.navigator.userAgent.toLowerCase();
    const isIos     = /iphone|ipad|ipod/.test(ua);
    const isSafari  = /safari/.test(ua) && !/chrome/.test(ua);
    const isAndroid = /android/.test(ua);

    if (isIos && isSafari) {
      // iOS Safari → instructions manuelles après 3s
      setPlatform('ios');
      const t = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(t);

    } else if (!isIos) {
      // Android (Chrome, Samsung, Edge…) ou Desktop
      // → écouter l'événement beforeinstallprompt
      const handlePrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setPlatform('android');
        setVisible(true);
      };

      window.addEventListener('beforeinstallprompt', handlePrompt);

      // Si l'app est installée depuis l'extérieur
      window.addEventListener('appinstalled', () => {
        setVisible(false);
        setDeferredPrompt(null);
        onComplete();
      });

      return () => {
        window.removeEventListener('beforeinstallprompt', handlePrompt);
      };
    }
  }, [onComplete]);

  // ── Gérer le clic sur "Installer" (Android) ──────────────────────────
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setVisible(false);
        onComplete();
      }
    } catch (err) {
      console.error('[Edunet PWA] Erreur install:', err);
    } finally {
      setInstalling(false);
    }
  };

  // ── Fermer le banner ─────────────────────────────────────────────────
  const handleClose = () => {
    sessionStorage.setItem('pwa-dismissed', '1');
    setVisible(false);
    onComplete();
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-24 left-3 right-3 md:left-auto md:right-6 md:w-96 z-[100] animate-fade-in-up"
      role="dialog"
      aria-label="Installer l'application Edunet"
    >
      <div className="glass bg-white/95 rounded-[2rem] shadow-premium border border-slate-100 overflow-hidden">
        <div className="p-5">
          {/* En-tête */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-uob-blue/10 p-2.5 rounded-2xl text-uob-blue flex-shrink-0">
                <Smartphone size={22} />
              </div>
              <div>
                <p className="font-black text-slate-800 text-sm leading-tight">
                  Installer Edunet
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Accès rapide depuis votre écran d'accueil
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 text-slate-300 hover:text-slate-500 transition-colors rounded-xl hover:bg-slate-100 flex-shrink-0 ml-2"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Contenu selon la plateforme */}
          {platform === 'android' && (
            <>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
                Installez l'application Edunet pour un accès hors ligne et des notifications instantanées.
              </p>
              <button
                onClick={handleInstallClick}
                disabled={installing}
                className="w-full py-3.5 bg-uob-blue text-white font-black rounded-2xl shadow-lg shadow-uob-blue/25 flex items-center justify-center space-x-2 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-60 uppercase tracking-widest text-xs"
              >
                <Download size={17} />
                <span>{installing ? 'Installation…' : 'Installer maintenant'}</span>
              </button>
              <button
                onClick={handleClose}
                className="mt-2.5 w-full py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                Peut-être plus tard
              </button>
            </>
          )}

          {platform === 'ios' && (
            <>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-3">
                Ajoutez Edunet à votre écran d'accueil pour un accès rapide :
              </p>
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="bg-white p-2 rounded-xl shadow-sm flex-shrink-0">
                    <Share size={16} className="text-uob-blue" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    1. Appuyer sur <span className="text-uob-blue">"Partager"</span> en bas de Safari
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-white p-2 rounded-xl shadow-sm flex-shrink-0">
                    <PlusSquare size={16} className="text-uob-blue" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    2. Choisir <span className="text-uob-blue">"Sur l'écran d'accueil"</span>
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="mt-3 w-full py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                Fermer
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallPWABanner;