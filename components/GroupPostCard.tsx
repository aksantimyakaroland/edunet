/**
 * @fileoverview Carte de publication de groupe — Edunet / UOB.
 * @author Roland Myaka
 */
import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { GroupPost, Profile, GroupPostLike } from '../types';
import { useAuth } from '../App';
import { supabase } from '../services/supabase';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Heart, MessageCircle, Share2, FileText, Trash2, Pencil, MoreHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Avatar from './Avatar';
import GroupImageModal from './GroupImageModal';
import GroupPostDetailModal from './GroupPostDetailModal';
import LikerListModal from './LikerListModal';
import EditGroupPostModal from './EditGroupPostModal';

interface GroupPostCardProps { post: GroupPost; startWithModalOpen?: boolean; }

const GroupPostCard: React.FC<GroupPostCardProps> = ({ post, startWithModalOpen = false }) => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [showImageModal, setShowImageModal] = useState(false);
  const [showPostDetailModal, setShowPostDetailModal] = useState(startWithModalOpen);
  const [showLikersModal, setShowLikersModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [likes, setLikes] = useState<GroupPostLike[]>(post.group_post_likes || []);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [commentCount, setCommentCount] = useState(post.group_post_comments?.length || 0);

  useEffect(() => {
    setLikes(post.group_post_likes || []);
    setLikesCount(Math.max(post.likes_count || 0, post.group_post_likes?.length || 0));
    setCommentCount(post.group_post_comments?.length || 0);
  }, [post.group_post_likes, post.likes_count, post.group_post_comments]);

  const isLiked = useMemo(() => likes.some(l => l.user_id === session?.user?.id), [likes, session]);

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!session?.user) { navigate('/auth?mode=signup'); return; }
    if (isLiked) {
      const like = likes.find(l => l.user_id === session.user.id);
      if (like) {
        setLikes(prev => prev.filter(l => l.id !== like.id));
        setLikesCount(prev => Math.max(0, prev - 1));
        await supabase.from('group_post_likes').delete().match({ group_post_id: post.id, user_id: session.user.id });
      }
    } else {
      const tempId = `temp-${Date.now()}`;
      setLikes(prev => [{ id: tempId, group_post_id: post.id, user_id: session.user.id } as any, ...prev]);
      setLikesCount(prev => prev + 1);
      const { data, error } = await supabase.from('group_post_likes').insert({ group_post_id: post.id, user_id: session.user.id }).select().single();
      if (!error && data) setLikes(prev => prev.map(l => l.id === tempId ? data : l));
    }
  }, [isLiked, likes, post.id, session?.user, navigate]);

  const CONTENT_LIMIT = 280;
  const isLongContent = post.content.length > CONTENT_LIMIT;
  const displayedContent = isExpanded ? post.content : post.content.substring(0, CONTENT_LIMIT);

  const renderLinks = useCallback((text: string) => {
    if (!text) return text;
    const urlRegex = /((?:https?:\/\/|www\.)[^\s]+)/gi;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        const href = part.match(/^https?:\/\//i) ? part : `https://${part}`;
        return <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-uob-blue hover:underline break-all" onClick={e => e.stopPropagation()}>{part}</a>;
      }
      return part;
    });
  }, []);

  return (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-soft border border-slate-100 transition-all hover:shadow-premium animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center min-w-0 flex-1">
          <Link to={`/profile/${post.profiles.id}`} className="active:scale-95 shrink-0">
            <Avatar avatarUrl={post.profiles.avatar_url} name={post.profiles.full_name} size="lg" className="mr-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <Link to={`/profile/${post.profiles.id}`} className="font-extrabold text-slate-800 hover:text-uob-blue truncate block">{post.profiles.full_name}</Link>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5 truncate">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr })}
            </p>
          </div>
        </div>
        {session?.user?.id === post.user_id && (
          <div className="relative shrink-0 ml-2">
            <button onClick={() => setShowOptions(!showOptions)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl active:scale-95">
              <MoreHorizontal size={20} />
            </button>
            {showOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-premium border border-slate-100 py-2 z-20 animate-fade-in overflow-hidden">
                <button onClick={() => { setShowEditModal(true); setShowOptions(false); }} className="w-full flex items-center px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                  <Pencil size={16} className="mr-3 text-uob-blue" /> Modifier
                </button>
                <button onClick={async () => { if (window.confirm('Supprimer ?')) await supabase.from('group_posts').delete().eq('id', post.id); setShowOptions(false); }} className="w-full flex items-center px-4 py-3 text-sm font-bold text-uob-red hover:bg-red-50">
                  <Trash2 size={16} className="mr-3" /> Supprimer
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="text-slate-700 whitespace-pre-wrap mb-4 font-medium leading-relaxed">
        {renderLinks(displayedContent)}
        {!isExpanded && isLongContent && <span>…</span>}
        {isLongContent && (
          <button onClick={() => setIsExpanded(!isExpanded)} className="mt-2 text-uob-blue font-black text-[10px] uppercase tracking-widest block active:scale-95">
            {isExpanded ? <><ChevronUp size={14} className="inline mr-1"/>Voir moins</> : <><ChevronDown size={14} className="inline mr-1"/>Voir plus</>}
          </button>
        )}
      </div>

      {post.media_url && (
        <div className="mb-4 social-image-container">
          {post.media_type === 'image' || post.media_type?.startsWith('image/') ? (
            <img src={post.media_url} alt="Média" className="w-full shadow-sm cursor-pointer" onClick={() => setShowImageModal(true)} loading="lazy" />
          ) : (
            <a href={post.media_url} target="_blank" rel="noopener noreferrer" className="flex items-center p-4 hover:bg-slate-100 bg-slate-50 border border-slate-100 rounded-[1.5rem]">
              <FileText size={20} className="text-uob-blue mr-3" />
              <span className="text-slate-800 font-bold text-sm uppercase">Fichier joint</span>
            </a>
          )}
        </div>
      )}

      <div className="flex justify-between items-center text-slate-500 border-t border-slate-50 pt-4">
        <div className="flex items-center space-x-2">
          <button onClick={handleLike} className={`flex items-center space-x-2 px-4 py-2 rounded-2xl transition-all active:scale-90 ${isLiked ? 'text-uob-red bg-uob-red/5' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Heart size={20} fill={isLiked ? '#CE1126' : 'none'} />
            <span className="text-sm font-bold">{likesCount}</span>
          </button>
          <button onClick={() => setShowPostDetailModal(true)} className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-2xl active:scale-90">
            <MessageCircle size={20} />
            <span className="text-sm font-bold">{commentCount}</span>
          </button>
        </div>
        <button onClick={() => {
          const url = `${window.location.origin}/group/${post.group_id}?postId=${post.id}&openModal=true`;
          navigator.share ? navigator.share({ title: 'Edunet', url }) : (navigator.clipboard.writeText(url), alert('Lien copié !'));
        }} className="p-2.5 text-slate-400 hover:text-uob-blue hover:bg-uob-blue/5 rounded-2xl active:scale-90">
          <Share2 size={20} />
        </button>
      </div>

      {showImageModal && <GroupImageModal post={post} onClose={() => setShowImageModal(false)} onOpenComments={() => setShowPostDetailModal(true)} />}
      {showPostDetailModal && <GroupPostDetailModal postInitial={{ ...post, group_post_likes: likes, likes_count: likesCount }} onClose={() => setShowPostDetailModal(false)} onInteractionUpdate={(nl, nc) => { setLikes(nl); setLikesCount(nl.length); setCommentCount(nc); }} />}
      {showLikersModal && <LikerListModal postId={post.id} postType="group" onClose={() => setShowLikersModal(false)} />}
      {showEditModal && <EditGroupPostModal post={post} onClose={() => setShowEditModal(false)} />}
    </div>
  );
};

export default memo(GroupPostCard);
