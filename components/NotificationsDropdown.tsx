/**
 * @fileoverview Dropdown notifications (Navbar) — Edunet / UOB
 * @author Roland Myaka
 */
import React, { useEffect } from 'react';
import { Notification } from '../types';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Avatar from './Avatar';
import { Heart, MessageCircle, MessageSquare, Users, UserCheck, UserX, Crown } from 'lucide-react';

interface Props { notifications: Notification[]; onClose: () => void; setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>; }

const NotificationsDropdown: React.FC<Props> = ({ notifications, onClose, setNotifications }) => {
  useEffect(() => {
    const unread = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unread.length > 0) {
      const t = setTimeout(async () => {
        await supabase.from('notifications').update({ is_read: true }).in('id', unread);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: unread.includes(n.id) ? true : n.is_read })));
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [notifications, setNotifications]);

  const getLink = (n: Notification): string => {
    switch (n.type) {
      case 'new_like': case 'new_comment': case 'new_comment_reply': return n.post_id ? `/post/${n.post_id}?openModal=true` : '#';
      case 'new_message': return n.conversation_id ? `/chat/${n.conversation_id}` : '/chat';
      case 'new_group_post': case 'new_group_comment': case 'new_group_like': case 'new_group_comment_reply':
        const base = n.group_id ? `/group/${n.group_id}` : '/groups';
        return n.group_post_id ? `${base}?postId=${n.group_post_id}&openModal=true` : base;
      case 'new_follower': return `/profile/${n.actor_id}`;
      default: return n.group_id ? `/group/${n.group_id}` : '#';
    }
  };

  const getText = (n: Notification): React.ReactNode => {
    const name = <strong className="font-semibold">{n.profiles?.full_name || 'Quelqu\'un'}</strong>;
    const map: Record<string, React.ReactNode> = {
      new_like:             <>{name} a aimé votre publication.</>,
      new_group_like:       <>{name} a aimé votre publication dans un groupe.</>,
      new_comment:          <>{name} a commenté votre publication.</>,
      new_comment_reply:    <>{name} a répondu à votre commentaire.</>,
      new_group_post:       <>{name} a publié dans un de vos groupes.</>,
      new_group_comment:    <>{name} a commenté dans un groupe.</>,
      new_group_comment_reply:<>{name} a répondu à votre commentaire dans un groupe.</>,
      new_message:          <>{name} vous a envoyé un message.</>,
      group_join_request:   <>{name} souhaite rejoindre un de vos groupes.</>,
      group_member_joined:  <>{name} a rejoint un de vos groupes.</>,
      group_request_accepted:<>{name} a accepté votre demande d'adhésion.</>,
      group_member_left:    <>{name} a quitté un de vos groupes.</>,
      group_admin_promotion:<>{name} vous a promu administrateur.</>,
      new_follower:         <>{name} s'est abonné à votre profil.</>,
    };
    return map[n.type] || <>Vous avez une nouvelle notification.</>;
  };

  const getIcon = (n: Notification): React.ReactNode => {
    const cls = 'absolute bottom-0 right-0 bg-white p-0.5 rounded-full ring-2 ring-white';
    const m: Record<string, React.ReactNode> = {
      new_like: <div className={cls}><Heart className="h-4 w-4 text-uob-red" fill="#CE1126"/></div>,
      new_group_like: <div className={cls}><Heart className="h-4 w-4 text-uob-red" fill="#CE1126"/></div>,
      new_comment: <div className={cls}><MessageCircle className="h-4 w-4 text-uob-blue" fill="#0047AB"/></div>,
      new_group_comment: <div className={cls}><MessageCircle className="h-4 w-4 text-uob-blue" fill="#0047AB"/></div>,
      new_comment_reply: <div className={cls}><MessageCircle className="h-4 w-4 text-uob-blue" fill="#0047AB"/></div>,
      new_group_comment_reply: <div className={cls}><MessageCircle className="h-4 w-4 text-uob-blue" fill="#0047AB"/></div>,
      new_message: <div className={cls}><MessageSquare className="h-4 w-4 text-green-500" fill="#22c55e"/></div>,
      new_follower: <div className={cls}><Users className="h-4 w-4 text-uob-blue"/></div>,
      group_join_request: <div className={cls}><Users className="h-4 w-4 text-uob-blue"/></div>,
      group_member_joined: <div className={cls}><Users className="h-4 w-4 text-uob-blue"/></div>,
      group_request_accepted: <div className={cls}><UserCheck className="h-4 w-4 text-green-500"/></div>,
      group_member_left: <div className={cls}><UserX className="h-4 w-4 text-uob-red"/></div>,
      group_admin_promotion: <div className={cls}><Crown className="h-4 w-4 text-amber-500"/></div>,
    };
    return m[n.type] || null;
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-md shadow-lg z-20 border border-slate-100 max-h-[70vh] flex flex-col">
      <div className="p-4 border-b"><h3 className="font-bold text-lg text-slate-800">Notifications</h3></div>
      <div className="flex-grow overflow-y-auto">
        {notifications.length > 0 ? notifications.map(n => (
          <Link to={getLink(n)} key={n.id} onClick={onClose}
            className={`flex items-start p-4 hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-uob-blue/5' : ''}`}>
            <div className="relative mr-4 flex-shrink-0">
              <Avatar avatarUrl={n.profiles?.avatar_url} name={n.profiles?.full_name || ''}/>
              {getIcon(n)}
            </div>
            <div className="flex-grow">
              <p className="text-sm text-slate-700">{getText(n)}</p>
              <p className="text-xs text-slate-500 mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}</p>
            </div>
          </Link>
        )) : <p className="text-center text-slate-500 p-8">Aucune notification.</p>}
      </div>
      <div className="p-2 border-t text-center">
        <Link to="/notifications" onClick={onClose} className="text-sm font-semibold text-uob-blue hover:underline">Voir toutes</Link>
      </div>
    </div>
  );
};
export default NotificationsDropdown;
