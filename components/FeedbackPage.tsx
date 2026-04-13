/**
 * @fileoverview Page de feedback étudiant — Edunet / UOB.
 *
 * Permet à un étudiant connecté de soumettre un retour
 * (bug, suggestion, amélioration) à l'équipe Roland Myaka / UOB.
 * Après envoi, redirige automatiquement vers les paramètres.
 *
 * @author Roland Myaka
 */

import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../App';
import { Send, CheckCircle, MessageSquareText, ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Spinner from './Spinner';

const FeedbackPage: React.FC = () => {
  const { session } = useAuth();
  const navigate    = useNavigate();

  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  /**
   * Soumet le feedback dans la table `feedbacks` de Supabase.
   * Redirige vers /settings après 3 secondes si succès.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !session?.user) return;

    setLoading(true);
    const { error } = await supabase.from('feedbacks').insert({
      user_id: session.user.id,
      content: content.trim(),
    });
    setLoading(false);

    if (!error) {
      setSuccess(true);
      setTimeout(() => navigate('/settings'), 3000);
    } else {
      alert("Erreur lors de l'envoi : " + error.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-fade-in-up">

      {/* Lien retour */}
      <Link to="/settings"
        className="inline-flex items-center text-slate-400 hover:text-uob-blue
                   font-bold text-xs uppercase tracking-widest mb-8
                   transition-colors group">
        <ChevronLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" />
        Retour aux paramètres
      </Link>

      <div className="bg-white rounded-[2.5rem] shadow-soft border border-slate-100 overflow-hidden">
        <div className="p-8 sm:p-12">

          {/* En-tête */}
          <div className="flex items-center space-x-4 mb-8 text-uob-red">
            <div className="p-4 bg-uob-red/10 rounded-2xl">
              <MessageSquareText size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight italic">
                Feedback
              </h1>
              <p className="text-slate-500 font-medium">
                Aidez-nous à améliorer Edunet.
              </p>
            </div>
          </div>

          {/* État succès */}
          {success ? (
            <div className="text-center py-12 animate-fade-in">
              <div className="w-24 h-24 bg-emerald-50 rounded-full
                              flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={48} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-800">Message envoyé !</h2>
              <p className="text-slate-500 font-medium mt-2">
                Merci pour votre contribution. Redirection en cours…
              </p>
            </div>

          ) : (
            /* Formulaire de feedback */
            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Votre avis est précieux. Signalez un dysfonctionnement,
                proposez une nouvelle fonctionnalité ou partagez une idée
                pour améliorer la plateforme Edunet de l'UOB.
              </p>

              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Décrivez votre retour en détail…"
                className="w-full p-6 bg-slate-50 border border-slate-100
                           rounded-[2rem] focus:ring-4 focus:ring-uob-red/10
                           outline-none font-medium text-slate-700 h-64
                           resize-none transition-all"
                required
                autoFocus
              />

              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="w-full py-5 bg-uob-red text-white font-black rounded-2xl
                           shadow-xl shadow-uob-red/20 transition-all active:scale-95
                           disabled:opacity-50 uppercase tracking-widest text-sm
                           flex items-center justify-center"
              >
                {loading
                  ? <Spinner />
                  : <><Send size={20} className="mr-2" /> Envoyer le feedback</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
