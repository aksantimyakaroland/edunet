/**
 * @fileoverview Page des notifications — Edunet / UOB.
 *
 * Affiche toutes les notifications de l'étudiant connecté.
 * Les marque comme lues automatiquement à l'ouverture.
 *
 * @author Roland Myaka
 */

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../App';
import { Notification } from '../types';
import Spinner from './Spinner';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Avatar from './Avatar';
import {
  Heart, MessageCircle, MessageSquare, Users,
  Search, Bell, UserCheck, UserX, Crown,
} from 'lucide-react';

const NotificationsPage: React.FC = () => {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading,       setLoading       ] = useState(true);
  const [searchQuery,   setSearchQuery   ] = useState('');

  const fetchNotifications = async (showLoading = true) => {
    if (!session?.user) return;
    if (showLoading) setLoading(true);

    const { data } = await supabase
      .from('notifications')
      .select('*, profiles:actor_id(*)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setNotifications(data as any);
      const unread = data.filter(n => !n.is_read).map(n => n.id);
      if (unread.length > 0)
        await supabase.from('notifications').update({ is_read: true }).in('id', unread);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
    if (!session?.user) return;
    const channel = supabase.channel(`notif-page-${session.user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${session.user.id}`,
      }, () => fetchNotifications(false))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session]);

  const getLink = (n: Notification): string => {
    switch (n.type) {
      case 'new_like': case 'new_comment': case 'new_comment_reply':
        return n.post_id ? `/post/${n.post_id}?openModal=true` : '#';
      case 'new_message':
        return n.conversation_id ? `/chat/${n.conversation_id}` : '/chat';
      case 'new_group_post': case 'new_group_comment': case 'new_group_comment_reply': case 'new_group_like':
        const base = n.group_id ? `/group/${n.group_id}` : '/groups';
        return n.group_post_id ? `${base}?postId=${n.group_post_id}&openModal=true` : base;
      case 'group_join_request': case 'group_member_joined':
      case 'group_request_accepted': case 'group_member_left': case 'group_admin_promotion':
        return n.group_id ? `/group/${n.group_id}` : '/groups';
      case 'new_follower':
        return `/profile/${n.actor_id}`;
      default: return '#';
    }
  };

  const getText = (n: Notification): string => {
    const name = n.profiles?.full_name || 'Quelqu\'un';
    const map: Record<string, string> = {
      new_like:              `${name} a aimé votre publication.`,
      new_group_like:        `${name} a aimé votre publication dans un groupe.`,
      new_comment:           `${name} a commenté votre publication.`,
      new_comment_reply:     `${name} a répondu à votre commentaire.`,
      new_group_post:        `${name} a publié dans un de vos groupes.`,
      new_group_comment:     `${name} a commenté dans un groupe.`,
      new_group_comment_reply:`${name} a répondu à votre commentaire dans un groupe.`,
      new_message:           `${name} vous a envoyé un message.`,
      group_join_request:    `${name} souhaite rejoindre un de vos groupes.`,
      group_member_joined:   `${name} a rejoint un de vos groupes.`,
      group_request_accepted:`${name} a accepté votre demande d'adhésion.`,
      group_member_left:     `${name} a quitté un de vos groupes.`,
      group_admin_promotion: `${name} vous a promu administrateur d'un groupe.`,
      new_follower:          `${name} s'est abonné à votre profil.`,
    };
    return map[n.type] || 'Vous avez une nouvelle notification.';
  };

  const getIcon = (n: Notification): React.ReactNode => {
    const cls = 'absolute -bottom-1 -right-1 bg-white p-1 rounded-full ring-2 ring-white';
    const m: Record<string, React.ReactNode> = {
      new_like:             <div className={cls}><Heart className="h-5 w-5 text-uob-red" fill="#CE1126"/></div>,
      new_group_like:       <div className={cls}><Heart className="h-5 w-5 text-uob-red" fill="#CE1126"/></div>,
      new_comment:          <div className={cls}><MessageCircle className="h-5 w-5 text-uob-blue" fill="#0047AB"/></div>,
      new_group_comment:    <div className={cls}><MessageCircle className="h-5 w-5 text-uob-blue" fill="#0047AB"/></div>,
      new_comment_reply:    <div className={cls}><MessageCircle className="h-5 w-5 text-uob-blue" fill="#0047AB"/></div>,
      new_group_comment_reply:<div className={cls}><MessageCircle className="h-5 w-5 text-uob-blue" fill="#0047AB"/></div>,
      new_message:          <div className={cls}><MessageSquare className="h-5 w-5 text-green-500" fill="#22c55e"/></div>,
      group_join_request:   <div className={cls}><Users className="h-5 w-5 text-uob-blue"/></div>,
      group_member_joined:  <div className={cls}><Users className="h-5 w-5 text-uob-blue"/></div>,
      new_follower:         <div className={cls}><Users className="h-5 w-5 text-uob-blue"/></div>,
      group_request_accepted:<div className={cls}><UserCheck className="h-5 w-5 text-green-500"/></div>,
      group_member_left:    <div className={cls}><UserX className="h-5 w-5 text-uob-red"/></div>,
      group_admin_promotion:<div className={cls}><Crown className="h-5 w-5 text-amber-500"/></div>,
    };
    return m[n.type] || null;
  };

  const filtered = useMemo(() => {
    if (!searchQuery) return notifications;
    return notifications.filter(n => getText(n).toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, notifications]);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-black text-slate-800 mb-6 italic uppercase tracking-tight">
        Notifications
      </h1>

      <div className="relative mb-6">
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Rechercher dans les notifications…"
          className="w-full bg-white border border-slate-100 rounded-2xl pl-10 pr-4 py-4
                     focus:outline-none focus:ring-2 focus:ring-uob-blue shadow-soft font-bold text-sm" />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-soft border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12"><Spinner /></div>
        ) : filtered.length > 0 ? (
          <ul className="divide-y divide-slate-50">
            {filtered.map(n => (
              <li key={n.id}>
                <Link to={getLink(n)}
                  className={`flex items-start p-6 hover:bg-slate-50 transition-all duration-300
                              ${!n.is_read
                                ? 'bg-uob-blue/5 border-l-4 border-uob-blue'
                                : 'border-l-4 border-transparent'}`}>
                  <div className="relative mr-4 flex-shrink-0">
                    <Avatar avatarUrl={n.profiles?.avatar_url} name={n.profiles?.full_name || ''} size="lg"/>
                    {getIcon(n)}
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">{getText(n)}</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-widest">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                  {!n.is_read && (
                    <div className="w-2.5 h-2.5 bg-uob-blue rounded-full self-center ml-4 flex-shrink-0 animate-pulse"/>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-slate-500 p-16">
            <Bell size={48} className="mx-auto text-slate-200 mb-6" />
            <h3 className="text-xl font-black text-slate-700 uppercase italic">
              {searchQuery ? 'Aucun résultat' : 'Le calme plat'}
            </h3>
            <p className="text-sm font-medium mt-2 text-slate-400">
              {searchQuery ? 'Essayez un autre mot-clé.' : 'Vos futures interactions apparaîtront ici.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
