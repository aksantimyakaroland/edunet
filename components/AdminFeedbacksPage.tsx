/**
 * @fileoverview Page d'administration des feedbacks — Edunet / UOB.
 *
 * Accessible uniquement aux utilisateurs avec role === 'admin'.
 * Affiche tous les feedbacks soumis par les étudiants.
 *
 * @author Roland Myaka
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Feedback } from '../types';
import Spinner from './Spinner';
import Avatar from './Avatar';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MessageSquareText, ChevronLeft } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../App';

const AdminFeedbacksPage: React.FC = () => {
  const { session } = useAuth();

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading,   setLoading  ] = useState(true);
  const [isAdmin,   setIsAdmin  ] = useState<boolean | null>(null);

  /* Vérifie le rôle admin avant d'afficher les données */
  useEffect(() => {
    if (!session?.user) return;
    supabase.from('profiles').select('role').eq('id', session.user.id).single()
      .then(({ data }) => setIsAdmin(data?.role === 'admin'))
      .catch(() => setIsAdmin(false));
  }, [session]);

  /* Charge les feedbacks une fois l'accès admin confirmé */
  useEffect(() => {
    if (!isAdmin) return;

    const fetchFeedbacks = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('feedbacks')
        .select('id, content, created_at, user_id')
        .order('created_at', { ascending: false });

      if (!error && data) {
        /* Enrichit les feedbacks avec les profils des auteurs */
        const userIds = [...new Set(data.map(f => f.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);

        setFeedbacks(data.map(f => ({
          ...f,
          profiles: profiles?.find(p => p.id === f.user_id),
        })) as Feedback[]);
      }

      setLoading(false);
    };

    fetchFeedbacks();
  }, [isAdmin]);

  /* Redirige si l'accès est refusé */
  if (isAdmin === false) return <Navigate to="/" />;
  if (isAdmin === null || loading) return (
    <div className="flex justify-center py-20"><Spinner /></div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">

      {/* En-tête */}
      <div className="flex items-center justify-between mb-8">
        <Link to="/settings"
          className="p-3 bg-white rounded-2xl shadow-sm hover:bg-slate-50
                     transition-all text-slate-400">
          <ChevronLeft size={24} />
        </Link>
        <div className="text-right">
          <h1 className="text-3xl font-black text-slate-800 italic uppercase tracking-tight">
            Panel Admin
          </h1>
          <p className="text-slate-500 font-medium">
            Feedbacks étudiants — Edunet / UOB
          </p>
        </div>
      </div>

      {/* Liste des feedbacks */}
      <div className="space-y-6">
        {feedbacks.length > 0 ? feedbacks.map((f, index) => (
          <div key={f.id}
            className="bg-white p-6 rounded-[2.5rem] shadow-soft border border-slate-100
                       animate-fade-in-up"
            style={{ animationDelay: `${index * 0.07}s` }}>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Avatar
                  avatarUrl={f.profiles?.avatar_url}
                  name={f.profiles?.full_name || 'Étudiant'}
                  size="md"
                />
                <div>
                  <p className="font-extrabold text-slate-800 text-sm">
                    {f.profiles?.full_name || 'Utilisateur inconnu'}
                  </p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {formatDistanceToNow(new Date(f.created_at), { addSuffix: true, locale: fr })}
                    {f.profiles?.promotion && ` · ${f.profiles.promotion}`}
                    {f.profiles?.major && ` · ${f.profiles.major}`}
                  </p>
                </div>
              </div>
              <div className="p-2 bg-uob-red/10 text-uob-red rounded-xl">
                <MessageSquareText size={18} />
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <p className="text-slate-700 font-medium leading-relaxed italic">
                "{f.content}"
              </p>
            </div>
          </div>
        )) : (
          <div className="text-center py-24 bg-white rounded-[3rem]
                          border border-slate-100 shadow-soft">
            <div className="w-20 h-20 bg-slate-50 rounded-full
                            flex items-center justify-center mx-auto mb-4">
              <MessageSquareText size={32} className="text-slate-200" />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
              Aucun feedback pour le moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFeedbacksPage;
