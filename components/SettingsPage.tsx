/**
 * @fileoverview Page des paramètres — Edunet / UOB.
 *
 * Sections :
 *   - Compte & Sécurité : éditer le profil, changer le mot de passe, feedback
 *   - Panel Admin       : visible uniquement si role === 'admin'
 *   - À propos & Charte : informations UOB, règles de bonne conduite, confidentialité
 *   - Déconnexion
 *
 * @author Roland Myaka
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import {
  User, Shield, Bell, Info, ExternalLink, ChevronRight,
  LogOut, CheckCircle, AlertCircle, MessageSquareText,
  LayoutDashboard, ChevronDown, ChevronUp, Scale,
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import Spinner from './Spinner';

/* ══════════════════════════════════════════════════════════════
   COMPOSANT INTERNE — Élément de liste paramètre
══════════════════════════════════════════════════════════════ */

interface SettingItemProps {
  icon:      React.ReactNode;
  title:     string;
  subtitle?: string;
  to?:       string;
  onClick?:  () => void;
  danger?:   boolean;
}

/**
 * Ligne de paramètre réutilisable.
 * Rendu comme <Link> si `to` est fourni, sinon comme <button>.
 */
const SettingItem: React.FC<SettingItemProps> = ({
  icon, title, subtitle, to, onClick, danger,
}) => {
  const content = (
    <div className={`flex items-center justify-between p-5 hover:bg-slate-50
                     transition-all ${danger ? 'text-uob-red' : 'text-slate-700'}`}>
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-2xl ${danger
          ? 'bg-red-50 text-uob-red'
          : 'bg-slate-100 text-slate-500'}`}>
          {icon}
        </div>
        <div>
          <p className="font-black text-sm uppercase tracking-tight">{title}</p>
          {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
        </div>
      </div>
      <ChevronRight size={18} className="text-slate-300" />
    </div>
  );

  if (to) return <Link to={to} className="block">{content}</Link>;
  return <button onClick={onClick} className="w-full text-left">{content}</button>;
};

/* ══════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════════════ */

const SettingsPage: React.FC = () => {
  const { session } = useAuth();
  const navigate    = useNavigate();
  const [searchParams] = useSearchParams();

  /* ── État local ── */
  const [profile,          setProfile         ] = useState<any>(null);
  const [isPassExpanded,   setIsPassExpanded  ] = useState(false);
  const [isPrivacyExpanded,setIsPrivacyExpanded] = useState(false);
  const [isRulesExpanded,  setIsRulesExpanded ] = useState(false);
  const [newPassword,      setNewPassword     ] = useState('');
  const [confirmPassword,  setConfirmPassword ] = useState('');
  const [loading,          setLoading         ] = useState(false);
  const [passwordError,    setPasswordError   ] = useState<string | null>(null);
  const [passwordSuccess,  setPasswordSuccess ] = useState(false);

  /* Charge le profil pour savoir si l'utilisateur est admin */
  useEffect(() => {
    if (session?.user) {
      supabase.from('profiles').select('*').eq('id', session.user.id).single()
        .then(({ data }) => setProfile(data));
    }
  }, [session]);

  /**
   * Ouvre automatiquement la section mot de passe si l'URL contient
   * `?view=password` — redirection depuis "Mot de passe oublié".
   */
  useEffect(() => {
    if (searchParams.get('view') === 'password') {
      setIsPassExpanded(true);
      document.getElementById('password-section')
        ?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [searchParams]);

  /** Déconnecte l'étudiant et redirige vers /auth */
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  /**
   * Met à jour le mot de passe via Supabase Auth.
   * Valide la correspondance et la longueur minimale.
   */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    setPasswordError(null);

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => { setPasswordSuccess(false); setIsPassExpanded(false); }, 3000);
    }
  };

  /* ══════════════════════════════════════════
     RENDU
  ══════════════════════════════════════════ */
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">

      {/* ── En-tête ── */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-slate-800 tracking-tight italic uppercase">
          Paramètres
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          Gérez votre compte Edunet et vos préférences.
        </p>
      </div>

      {/* ════════════════════════════════════════
          Section : Compte & Sécurité
      ════════════════════════════════════════ */}
      <div className="bg-white rounded-[2.5rem] shadow-soft border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Compte &amp; Sécurité
          </h2>
        </div>

        <div className="divide-y divide-slate-50">

          {/* Éditer le profil */}
          <SettingItem
            icon={<User size={20} />}
            title="Éditer le profil"
            subtitle="Changer nom, filière, photo…"
            to={`/profile/${session?.user.id}`}
          />

          {/* Mot de passe — section dépliable */}
          <div className="bg-white border-b border-slate-50" id="password-section">
            <button
              onClick={() => setIsPassExpanded(!isPassExpanded)}
              className="w-full flex items-center justify-between p-5
                         hover:bg-slate-50 transition-all text-slate-700"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-2xl bg-slate-100 text-slate-500">
                  <Shield size={20} />
                </div>
                <div className="text-left">
                  <p className="font-black text-sm uppercase tracking-tight">Sécurité</p>
                  <p className="text-xs text-slate-400 font-medium">Changer de mot de passe</p>
                </div>
              </div>
              {isPassExpanded
                ? <ChevronUp size={18} className="text-uob-blue" />
                : <ChevronDown size={18} className="text-slate-300" />}
            </button>

            {isPassExpanded && (
              <div className="px-5 pb-8 animate-fade-in">
                <form onSubmit={handleChangePassword}
                  className="space-y-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">

                  {passwordError && (
                    <p className="text-uob-red text-xs font-bold flex items-center">
                      <AlertCircle size={14} className="mr-2" />{passwordError}
                    </p>
                  )}
                  {passwordSuccess && (
                    <p className="text-emerald-500 text-xs font-bold flex items-center">
                      <CheckCircle size={14} className="mr-2" />Mot de passe mis à jour !
                    </p>
                  )}

                  <input type="password" placeholder="Nouveau mot de passe"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    className="w-full p-4 bg-white border border-slate-100 rounded-2xl
                               outline-none focus:ring-2 focus:ring-uob-blue font-bold text-sm" />

                  <input type="password" placeholder="Confirmer le mot de passe"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full p-4 bg-white border border-slate-100 rounded-2xl
                               outline-none focus:ring-2 focus:ring-uob-blue font-bold text-sm" />

                  <button type="submit" disabled={loading}
                    className="w-full py-4 bg-uob-blue text-white font-black rounded-2xl
                               shadow-lg transition-all active:scale-95 text-xs uppercase tracking-widest">
                    {loading ? <Spinner /> : 'Mettre à jour'}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Feedback */}
          <SettingItem
            icon={<MessageSquareText size={20} />}
            title="Feedback"
            subtitle="Signaler un bug ou proposer une amélioration"
            to="/feedback"
          />

          {/* Panel Admin — visible uniquement pour les admins UOB */}
          {profile?.role === 'admin' && (
            <SettingItem
              icon={<LayoutDashboard size={20} />}
              title="Panel Admin"
              subtitle="Gérer les feedbacks et la plateforme"
              to="/admin/feedbacks"
            />
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════
          Section : À propos & Charte UOB
      ════════════════════════════════════════ */}
      <div className="bg-white rounded-[2.5rem] shadow-soft border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            À propos &amp; Charte
          </h2>
        </div>

        <div className="divide-y divide-slate-50">

          {/* Bloc À propos */}
          <div className="p-8">
            <div className="flex items-center space-x-4 mb-6">
              {/* Logo UOB placeholder */}
              <div className="w-16 h-16 bg-uob-blue rounded-[1rem]
                              flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-white font-black text-xl">UOB</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase italic">Edunet</h3>
                <p className="text-sm text-slate-500 font-medium">
                  Université Officielle de Bukavu
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Edunet est le réseau social académique exclusif des étudiants de
              l'Université Officielle de Bukavu (UOB), Bukavu, RDC.
            </p>

            {/* Développeur */}
            <div className="mt-8 pt-8 border-t border-slate-50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                Développeur
              </p>
              <div className="flex items-center justify-between p-4 bg-slate-50
                              rounded-2xl border border-slate-100">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-uob-blue rounded-2xl
                                  flex items-center justify-center shadow-sm flex-shrink-0">
                    <span className="text-white font-black text-sm">RM</span>
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-sm">Roland Myaka</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Software Engineer · UOB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charte de bonne conduite — dépliable */}
          <div className="bg-white">
            <button onClick={() => setIsRulesExpanded(!isRulesExpanded)}
              className="w-full flex items-center justify-between p-5
                         hover:bg-slate-50 transition-all text-slate-700">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-2xl bg-slate-100 text-uob-red">
                  <Scale size={20} />
                </div>
                <div className="text-left">
                  <p className="font-black text-sm uppercase tracking-tight">
                    Charte de bonne conduite
                  </p>
                  <p className="text-xs text-slate-400 font-medium">Règles &amp; Courtoisie</p>
                </div>
              </div>
              {isRulesExpanded
                ? <ChevronUp size={18} className="text-uob-blue" />
                : <ChevronDown size={18} className="text-slate-300" />}
            </button>

            {isRulesExpanded && (
              <div className="px-8 pb-8 animate-fade-in">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                  {[
                    {
                      titre: 'Respect mutuel',
                      texte: 'Soyez courtois et bienveillants envers tous les membres. Les insultes, le harcèlement et les discours haineux sont strictement interdits.',
                    },
                    {
                      titre: 'Contenu académique',
                      texte: 'Privilégiez le partage de connaissances, de projets et de ressources pédagogiques. Le contenu inapproprié sera supprimé.',
                    },
                    {
                      titre: 'Propriété intellectuelle',
                      texte: 'Respectez le travail de vos pairs et des enseignants. Citez toujours vos sources lors du partage de ressources.',
                    },
                  ].map(rule => (
                    <div key={rule.titre} className="flex items-start space-x-3">
                      <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700 font-medium leading-relaxed">
                        <strong className="text-slate-900">{rule.titre} :</strong>{' '}
                        {rule.texte}
                      </p>
                    </div>
                  ))}

                  <p className="text-[10px] font-black text-slate-400 uppercase text-center mt-4">
                    Tout manquement peut entraîner une suspension de compte.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Politique de confidentialité — dépliable */}
          <div className="bg-white">
            <button onClick={() => setIsPrivacyExpanded(!isPrivacyExpanded)}
              className="w-full flex items-center justify-between p-5
                         hover:bg-slate-50 transition-all text-slate-700">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-2xl bg-slate-100 text-slate-500">
                  <Info size={20} />
                </div>
                <div className="text-left">
                  <p className="font-black text-sm uppercase tracking-tight">
                    Politique de confidentialité
                  </p>
                  <p className="text-xs text-slate-400 font-medium">Vos données sont protégées</p>
                </div>
              </div>
              {isPrivacyExpanded
                ? <ChevronUp size={18} className="text-uob-blue" />
                : <ChevronDown size={18} className="text-slate-300" />}
            </button>

            {isPrivacyExpanded && (
              <div className="px-5 pb-6 animate-fade-in">
                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100
                                flex items-center space-x-4">
                  <div className="bg-emerald-500 text-white p-2 rounded-xl flex-shrink-0">
                    <CheckCircle size={20} />
                  </div>
                  <p className="text-emerald-800 font-bold text-sm leading-relaxed">
                    Vos données personnelles sont hébergées de manière sécurisée et ne sont
                    jamais partagées avec des tiers. Seuls les administrateurs UOB
                    autorisés y ont accès.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          Déconnexion
      ════════════════════════════════════════ */}
      <div className="bg-white rounded-[2.5rem] shadow-soft border border-slate-100 overflow-hidden mb-12">
        <SettingItem
          icon={<LogOut size={20} />}
          title="Déconnexion"
          subtitle="Quitter votre session Edunet"
          onClick={handleSignOut}
          danger
        />
      </div>

    </div>
  );
};

export default SettingsPage;
