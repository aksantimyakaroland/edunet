/**
 * @fileoverview Modal liste des likeurs — Edunet / UOB
 * @author Roland Myaka
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../services/supabase';
import { Profile } from '../types';
import { useAuth } from '../App';
import { X, UserPlus, UserCheck, Heart } from 'lucide-react';
import Spinner from './Spinner';
import Avatar from './Avatar';
import { Link } from 'react-router-dom';

interface Props { postId: string; postType: 'feed' | 'group'; onClose: () => void; }

const LikerListModal: React.FC<Props> = ({ postId, postType, onClose }) => {
  const { session } = useAuth();
  const [likers, setLikers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState<Map<string, boolean>>(new Map());
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const modalRoot = document.getElementById('modal-root');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handler = (e: MouseEvent) => { if (modalRef.current && !modalRef.current.contains(e.target as Node)) handleClose(); };
    document.addEventListener('mousedown', handler);
    return () => { document.body.style.overflow = 'auto'; document.removeEventListener('mousedown', handler); };
  }, []);

  const handleClose = () => { setIsAnimatingOut(true); setTimeout(onClose, 300); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const table = postType === 'feed' ? 'likes' : 'group_post_likes';
      const col   = postType === 'feed' ? 'post_id' : 'group_post_id';
      const { data: likerData } = await supabase.from(table).select('profiles(*)').eq(col, postId);
      const profiles = likerData?.map((d: any) => d.profiles).filter(Boolean) || [];
      setLikers(profiles);
      if (session?.user) {
        const { data: fData } = await supabase.from('followers').select('following_id').eq('follower_id', session.user.id);
        const m = new Map<string, boolean>();
        fData?.forEach(d => m.set(d.following_id, true));
        setFollowingMap(m);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [postId, postType, session?.user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggleFollow = async (targetId: string) => {
    if (!session?.user || session.user.id === targetId) return;
    const isF = followingMap.get(targetId);
    const nm = new Map(followingMap); nm.set(targetId, !isF); setFollowingMap(nm);
    if (isF) await supabase.from('followers').delete().match({ follower_id: session.user.id, following_id: targetId });
    else await supabase.from('followers').insert({ follower_id: session.user.id, following_id: targetId });
  };

  if (!modalRoot) return null;
  return createPortal(
    <div className={`fixed inset-0 bg-black z-50 flex justify-center items-center p-4 transition-opacity duration-300 ${isAnimatingOut ? 'opacity-0' : 'bg-opacity-50'}`}>
      <div ref={modalRef} className={`bg-white rounded-xl shadow-2xl max-w-sm w-full max-h-[70vh] flex flex-col transition-all duration-300 overflow-hidden ${isAnimatingOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        <div className="relative text-center p-4 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-800">J'aime</h2>
          <button onClick={handleClose} className="absolute top-2 right-2 text-slate-400 hover:bg-slate-100 rounded-full p-2"><X size={20}/></button>
        </div>
        <div className="flex-grow overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-full py-10"><Spinner/></div>
          ) : likers.length > 0 ? (
            <ul className="p-2">
              {likers.map(user => (
                <li key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                  <Link to={`/profile/${user.id}`} onClick={handleClose} className="flex items-center space-x-3 flex-grow min-w-0">
                    <Avatar avatarUrl={user.avatar_url} name={user.full_name}/>
                    <div className="min-w-0"><p className="font-semibold text-slate-800 truncate">{user.full_name}</p><p className="text-sm text-slate-500 truncate">{user.major || 'Étudiant UOB'}</p></div>
                  </Link>
                  {session?.user && session.user.id !== user.id && (
                    <button onClick={() => handleToggleFollow(user.id)}
                      className={`flex-shrink-0 flex items-center space-x-2 text-sm font-semibold py-1.5 px-3 rounded-lg transition-colors ${followingMap.get(user.id) ? 'bg-uob-blue/10 text-uob-blue hover:bg-uob-blue/20' : 'bg-uob-red/10 text-uob-red hover:bg-uob-red/20'}`}>
                      {followingMap.get(user.id) ? <UserCheck size={16}/> : <UserPlus size={16}/>}
                      <span>{followingMap.get(user.id) ? 'Abonné' : 'Suivre'}</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-8">
              <Heart size={40} className="text-slate-300 mb-4"/>
              <h3 className="font-semibold text-slate-700">Aucun "J'aime"</h3>
              <p className="text-sm">Personne n'a encore aimé cette publication.</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    modalRoot
  );
};
export default LikerListModal;
