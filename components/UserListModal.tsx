/**
 * @fileoverview Modal liste abonnés/abonnements — Edunet / UOB
 * @author Roland Myaka
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../services/supabase';
import { Profile } from '../types';
import { useAuth } from '../App';
import { X, UserPlus, UserCheck, Users } from 'lucide-react';
import Spinner from './Spinner';
import Avatar from './Avatar';
import { Link } from 'react-router-dom';

interface Props { userId: string; type: 'followers' | 'following'; title: string; onClose: () => void; }

const UserListModal: React.FC<Props> = ({ userId, type, title, onClose }) => {
  const { session } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState<Map<string, boolean>>(new Map());
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const modalRoot = document.getElementById('modal-root');

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = 'auto'; }; }, []);
  const handleClose = () => { setIsAnimatingOut(true); setTimeout(onClose, 300); };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let data: Profile[] = [];
      if (type === 'followers') {
        const { data: d } = await supabase.from('followers').select('profiles:follower_id(*)').eq('following_id', userId);
        data = d?.map((i: any) => i.profiles).filter(Boolean) || [];
      } else {
        const { data: d } = await supabase.from('followers').select('profiles:following_id(*)').eq('follower_id', userId);
        data = d?.map((i: any) => i.profiles).filter(Boolean) || [];
      }
      setUsers(data);
      if (session?.user) {
        const { data: fData } = await supabase.from('followers').select('following_id').eq('follower_id', session.user.id);
        const m = new Map<string, boolean>();
        fData?.forEach(d => m.set(d.following_id, true));
        setFollowingMap(m);
      }
    } catch (e: any) { console.error(e.message); } finally { setLoading(false); }
  }, [userId, type, session?.user]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggleFollow = async (targetId: string) => {
    if (!session?.user || session.user.id === targetId) return;
    const isF = followingMap.get(targetId);
    setFollowingMap(prev => { const n = new Map(prev); n.set(targetId, !isF); return n; });
    if (isF) await supabase.from('followers').delete().match({ follower_id: session.user.id, following_id: targetId });
    else await supabase.from('followers').insert({ follower_id: session.user.id, following_id: targetId });
  };

  if (!modalRoot) return null;
  return createPortal(
    <div className={`fixed inset-0 bg-brand-dark/80 backdrop-blur-md z-[100] flex justify-center items-center p-4 transition-opacity duration-300 ${isAnimatingOut ? 'opacity-0' : 'opacity-100'}`} onClick={handleClose}>
      <div onClick={e => e.stopPropagation()} className={`bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md flex flex-col h-[70vh] overflow-hidden transition-all duration-300 ${isAnimatingOut ? 'scale-95' : 'scale-100'}`}>
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h2 className="font-black text-xl text-slate-800 tracking-tight uppercase italic">{title}</h2>
          <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600"><X size={24}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? <div className="flex justify-center py-20"><Spinner/></div>
          : users.length > 0 ? (
            <div className="space-y-3">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100">
                  <Link to={`/profile/${user.id}`} onClick={handleClose} className="flex items-center space-x-3 flex-1 min-w-0">
                    <Avatar avatarUrl={user.avatar_url} name={user.full_name} size="md"/>
                    <div className="min-w-0">
                      <p className="font-black text-slate-800 text-sm truncate">{user.full_name}</p>
                      <p className="text-[10px] text-uob-blue font-black uppercase tracking-widest truncate">{user.major || 'Étudiant UOB'}</p>
                    </div>
                  </Link>
                  {session?.user && session.user.id !== user.id && (
                    <button onClick={() => handleToggleFollow(user.id)}
                      className={`flex items-center space-x-1.5 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${followingMap.get(user.id) ? 'bg-uob-blue text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                      {followingMap.get(user.id) ? <UserCheck size={14}/> : <UserPlus size={14}/>}
                      <span>{followingMap.get(user.id) ? 'Abonné' : 'Suivre'}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Users size={48} className="mx-auto text-slate-200 mb-4"/>
              <p className="text-slate-400 font-bold italic">Aucun utilisateur trouvé.</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    modalRoot
  );
};
export default UserListModal;
