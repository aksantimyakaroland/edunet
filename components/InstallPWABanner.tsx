/**
 * @fileoverview Banner d'installation PWA — Edunet / UOB
 *
 * ARCHITECTURE CORRECTE POUR ANDROID :
 *
 * Le problème précédent : `beforeinstallprompt` se déclenche AVANT que
 * React soit chargé. En écoutant l'événement dans useEffect(), on rate
 * systématiquement le prompt → le banner n'apparaissait jamais.
 *
 * La solution : index.html capture l'événement immédiatement dans un
 * <script> inline et le stocke dans window.__pwaPrompt. Ce composant
 * le récupère ensuite depuis window au montage.
 *
 * ANDROID (Chrome, Samsung Internet, Edge…) :
 *   - Lit window.__pwaPrompt (capturé avant React)
 *   - Affiche un bouton "Installer maintenant"
 *   - Déclenche le prompt natif Android au clic
 *
 * iOS (Safari) :
 *   - beforeinstallprompt n'existe pas sur iOS
 *   - Affiche des instructions manuelles après 2 secondes
 *
 * @author Roland Myaka
 */
import React, { useState, useEffect, useRef } from 'react';
import { Download, Smartphone, X, Share, PlusSquare } from 'lucide-react';

// Typage de window.__pwaPrompt (injecté par index.html)
declare global {
  interface Window {
    __pwaPrompt:    any;
    __pwaInstalled: boolean;
  }
}

interface Props {
  onComplete: () => void;
}

const InstallPWABanner: React.FC<Props> = ({ onComplete }) => {
  const [visible,    setVisible]    = useState(false);
  const [platform,   setPlatform]   = useState<'android' | 'ios' | 'none'>('none');
  const [installing, setInstalling] = useState(false);
  const promptRef = useRef<any>(null);

  useEffect(() => {
    // ── 1. App déjà installée en mode standalone → ne rien faire ─────────
    const isStandalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches ||
      window.__pwaInstalled === true;

    if (isStandalone) { onComplete(); return; }

    // ── 2. Utilisateur a déjà fermé le banner cette session ──────────────
    if (sessionStorage.getItem('pwa-dismissed')) { onComplete(); return; }

    // ── 3. Détecter la plateforme ─────────────────────────────────────────
    const ua      = window.navigator.userAgent.toLowerCase();
    const isIos   = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/chrome|chromium|crios|fxios/.test(ua);

    if (isIos && isSafari) {
      // iOS Safari : instructions manuelles
      setPlatform('ios');
      const t = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(t);
    }

    // ── 4. Android / Desktop : lire le prompt depuis window ──────────────
    // On vérifie d'abord si le prompt est déjà disponible (capturé avant React)
    const checkPrompt = () => {
      if (window.__pwaPrompt) {
        promptRef.current = window.__pwaPrompt;
        setPlatform('android');
        setVisible(true);
        return true;
      }
      return false;
    };

    // Vérification immédiate
    if (checkPrompt()) return;

    // Si pas encore disponible, écouter l'événement et aussi vérifier
    // périodiquement pendant 10 secondes (cas où l'événement arrive tard)
    const handlePrompt = (e: Event) => {
      e.preventDefault();
      window.__pwaPrompt = e;
      promptRef.current  = e;
      setPlatform('android');
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);

    // Polling de secours : vérifie toutes les 500ms pendant 10s
    let checks = 0;
    const poll = setInterval(() => {
      checks++;
      if (checkPrompt() || checks >= 20) clearInterval(poll);
    }, 500);

    // Écouter l'installation depuis l'extérieur (barre d'adresse Chrome)
    const handleInstalled = () => {
      setVisible(false);
      window.__pwaPrompt    = null;
      window.__pwaInstalled = true;
      promptRef.current     = null;
      onComplete();
    };
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      clearInterval(poll);
    };
  }, [onComplete]);

  // ── Déclencher l'installation Android ────────────────────────────────
  const handleInstallClick = async () => {
    const prompt = promptRef.current || window.__pwaPrompt;
    if (!prompt) {
      console.warn('[Edunet PWA] Prompt non disponible');
      return;
    }
    setInstalling(true);
    try {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        window.__pwaPrompt = null;
        promptRef.current  = null;
        setVisible(false);
        onComplete();
      }
    } catch (err) {
      console.error('[Edunet PWA] Erreur installation:', err);
    } finally {
      setInstalling(false);
    }
  };

  // ── Fermer le banner ──────────────────────────────────────────────────
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
      aria-label="Installer Edunet"
    >
      <div className="glass bg-white/95 rounded-[2rem] shadow-premium border border-slate-100 overflow-hidden">
        <div className="p-5">

          {/* En-tête commun */}
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
              className="p-1.5 text-slate-300 hover:text-slate-500 rounded-xl hover:bg-slate-100 flex-shrink-0 ml-2 transition-colors"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Android : bouton natif ────────────────────────────────── */}
          {platform === 'android' && (
            <>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
                Installez Edunet pour un accès hors ligne et des notifications instantanées.
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

          {/* ── iOS Safari : instructions manuelles ──────────────────── */}
          {platform === 'ios' && (
            <>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-3">
                Ajoutez Edunet à votre écran d'accueil :
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