/**
 * @fileoverview Modal de détail d'une publication de groupe — Edunet / UOB
 * @author Roland Myaka
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Heart, MessageCircle, Send, Trash2, MoreHorizontal, Pencil } from 'lucide-react';
import { GroupPost, GroupPostLike, GroupPostComment, Profile } from '../types';
import { useAuth } from '../App';
import { supabase } from '../services/supabase';
import { Link, useNavigate } from 'react-router-dom';
import Spinner from './Spinner';
import Avatar from './Avatar';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  postInitial: GroupPost;
  onClose: () => void;
  onInteractionUpdate?: (likes: GroupPostLike[], commentCount: number) => void;
}

const renderLinks = (text: string) => {
  if (!text) return text;
  const re = /((?:https?:\/\/|www\.)[^\s]+)/gi;
  return text.split(re).map((p, i) => {
    if (p.match(re)) { const href = p.match(/^https?:\/\//i) ? p : `https://${p}`; return <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-uob-blue hover:underline break-all" onClick={e => e.stopPropagation()}>{p}</a>; }
    return p;
  });
};

interface CommentItemProps {
  comment: GroupPostComment; isReply?: boolean; currentUserId?: string;
  onReply: (c: GroupPostComment) => void; onDelete: (id: string) => void;
  onUpdate: (id: string, content: string) => void; onCloseModal: () => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, isReply, currentUserId, onReply, onDelete, onUpdate, onCloseModal }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  return (
    <div className={`flex items-start space-x-3 ${isReply ? 'ml-10 mt-3' : 'mt-4 animate-fade-in'}`}>
      <Link to={`/profile/${comment.user_id}`} onClick={onCloseModal} className="shrink-0">
        <Avatar avatarUrl={comment.profiles.avatar_url} name={comment.profiles.full_name} size="sm"/>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="group/comment relative bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className="flex justify-between items-start">
            <Link to={`/profile/${comment.user_id}`} onClick={onCloseModal}>
              <p className="font-black text-[10px] text-uob-blue uppercase tracking-widest mb-1">{comment.profiles.full_name}</p>
            </Link>
            {currentUserId === comment.user_id && (
              <div className="relative">
                <button onClick={() => setMenuOpen(!menuOpen)} className="text-slate-400 hover:text-slate-600 p-1"><MoreHorizontal size={14}/></button>
                {menuOpen && (
                  <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-premium border border-slate-100 py-1 z-20 overflow-hidden animate-fade-in">
                    <button onClick={() => { setIsEditing(true); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center"><Pencil size={12} className="mr-2"/>Modifier</button>
                    <button onClick={() => { onDelete(comment.id); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-uob-red hover:bg-red-50 flex items-center"><Trash2 size={12} className="mr-2"/>Supprimer</button>
                  </div>
                )}
              </div>
            )}
          </div>
          {isEditing ? (
            <form onSubmit={e => { e.preventDefault(); onUpdate(comment.id, editContent); setIsEditing(false); }} className="mt-1">
              <input value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full bg-white border border-slate-100 rounded-xl p-2 text-sm font-medium outline-none focus:ring-1 focus:ring-uob-blue"/>
              <div className="flex space-x-2 mt-2">
                <button type="submit" className="text-[10px] font-black uppercase text-uob-blue hover:underline">Sauver</button>
                <button type="button" onClick={() => setIsEditing(false)} className="text-[10px] font-black uppercase text-slate-400 hover:underline">Annuler</button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-slate-700 font-medium leading-relaxed break-words">{renderLinks(comment.content)}</p>
          )}
        </div>
        <div className="flex items-center space-x-3 mt-1 ml-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
          <button onClick={() => onReply(comment)} className="hover:text-uob-blue">Répondre</button>
          <span>•</span>
          <span>{formatDistanceToNow(new Date(comment.created_at), { locale: fr })}</span>
        </div>
        {comment.replies?.map(r => <CommentItem key={r.id} comment={r} isReply currentUserId={currentUserId} onReply={onReply} onDelete={onDelete} onUpdate={onUpdate} onCloseModal={onCloseModal}/>)}
      </div>
    </div>
  );
};

const GroupPostDetailModal: React.FC<Props> = ({ postInitial, onClose, onInteractionUpdate }) => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [post] = useState<GroupPost>(postInitial);
  const [likes, setLikes] = useState<GroupPostLike[]>(postInitial.group_post_likes || []);
  const [likesCount, setLikesCount] = useState(() => Math.max(postInitial.likes_count || 0, postInitial.group_post_likes?.length || 0));
  const [comments, setComments] = useState<GroupPostComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [replyingTo, setReplyingTo] = useState<GroupPostComment | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const modalRootRef = useRef(document.getElementById('modal-root'));
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleClose = useCallback(() => { setIsAnimatingOut(true); setTimeout(onClose, 300); }, [onClose]);
  useEffect(() => { onInteractionUpdate?.(likes, comments.length); }, [likes, comments.length]);

  const adjustHeight = () => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = '48px'; const sh = ta.scrollHeight; const max = 120; ta.style.height = `${Math.min(sh, max)}px`; ta.style.overflowY = sh > max ? 'auto' : 'hidden'; }
  };

  const fetchComments = async () => {
    const { data } = await supabase.from('group_post_comments').select('*, profiles(*)').eq('group_post_id', postInitial.id);
    if (data) setComments(data as any);
  };

  useEffect(() => {
    fetchComments();
    if (session?.user) {
      supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => setCurrentUserProfile(data));
      const ch = supabase.channel(`gpc-${postInitial.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'group_post_comments', filter: `group_post_id=eq.${postInitial.id}` }, () => fetchComments())
        .subscribe();
      return () => { supabase.removeChannel(ch); };
    }
  }, [postInitial.id, session]);

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);

  const nestedComments = useMemo(() => {
    const map: { [k: string]: GroupPostComment } = {};
    const roots: GroupPostComment[] = [];
    comments.forEach(c => { c.replies = []; map[c.id] = c; });
    comments.forEach(c => { if (c.parent_comment_id && map[c.parent_comment_id]) map[c.parent_comment_id].replies?.push(c); else roots.push(c); });
    return roots;
  }, [comments]);

  const handleLike = async () => {
    if (!session?.user) { navigate('/auth?mode=signup'); return; }
    const hasLiked = likes.some(l => l.user_id === session.user.id);
    if (hasLiked) {
      const like = likes.find(l => l.user_id === session.user.id);
      if (like) { setLikes(prev => prev.filter(l => l.id !== like.id)); setLikesCount(p => Math.max(0, p - 1)); await supabase.from('group_post_likes').delete().eq('id', like.id); }
    } else {
      const tempId = `temp-${Date.now()}`;
      setLikes(prev => [...prev, { id: tempId, group_post_id: post.id, user_id: session.user.id } as any]);
      setLikesCount(p => p + 1);
      const { data } = await supabase.from('group_post_likes').insert({ group_post_id: post.id, user_id: session.user.id }).select().single();
      if (data) setLikes(prev => prev.map(l => l.id === tempId ? data : l));
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = replyingTo ? replyContent : newComment;
    if (!content.trim() || !session?.user || !currentUserProfile) { if (!session?.user) navigate('/auth?mode=signup'); return; }
    setIsPostingComment(true);
    try {
      const { data, error } = await supabase.from('group_post_comments').insert({ group_post_id: post.id, user_id: session.user.id, content, parent_comment_id: replyingTo?.id }).select('*, profiles(*)').single();
      if (error) throw error;
      if (data) { setComments(prev => [...prev, data as any]); setNewComment(''); setReplyContent(''); setReplyingTo(null); if (textareaRef.current) textareaRef.current.style.height = '48px'; }
    } catch (e) { console.error(e); } finally { setIsPostingComment(false); }
  };

  const handleDeleteComment = async (id: string) => {
    if (!window.confirm('Supprimer ce commentaire ?')) return;
    const { error } = await supabase.from('group_post_comments').delete().eq('id', id);
    if (!error) setComments(prev => prev.filter(c => c.id !== id));
  };

  const handleUpdateComment = async (id: string, content: string) => {
    const { error } = await supabase.from('group_post_comments').update({ content }).eq('id', id);
    if (!error) setComments(prev => prev.map(c => c.id === id ? { ...c, content } : c));
  };

  const isLiked = likes.some(l => l.user_id === session?.user?.id);

  if (!modalRootRef.current) return null;
  return createPortal(
    <div className={`fixed inset-0 bg-brand-dark/80 backdrop-blur-md z-[999] flex justify-center items-center p-4 transition-opacity duration-300 ${isAnimatingOut ? 'opacity-0' : 'opacity-100'}`} onClick={handleClose}>
      <div onClick={e => e.stopPropagation()} className={`bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl flex flex-col h-[90vh] overflow-hidden transition-all duration-300 ${isAnimatingOut ? 'scale-95' : 'scale-100'}`}>
        <div className="flex justify-between items-center p-6 border-b border-slate-50 flex-shrink-0">
          <h2 className="font-black text-xl text-slate-800 tracking-tight italic uppercase">Groupe · Post</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full active:scale-90"><X size={24}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="flex items-center space-x-4 mb-6">
            <Link to={`/profile/${post.profiles.id}`} onClick={handleClose}><Avatar avatarUrl={post.profiles.avatar_url} name={post.profiles.full_name} size="lg"/></Link>
            <div>
              <Link to={`/profile/${post.profiles.id}`} onClick={handleClose}><p className="font-extrabold text-slate-800 hover:text-uob-blue">{post.profiles.full_name}</p></Link>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr })}</p>
            </div>
          </div>
          <p className="text-slate-700 whitespace-pre-wrap font-medium leading-relaxed mb-6">{renderLinks(post.content)}</p>
          {post.media_url && (post.media_type?.startsWith('image/') || post.media_type === 'image') && (
            <div className="rounded-[2rem] overflow-hidden mb-6 bg-slate-100 border border-slate-100">
              <img src={post.media_url} alt="Média" className="w-full h-auto max-h-[500px] object-contain"/>
            </div>
          )}
          <div className="flex items-center space-x-6 pb-6 border-b border-slate-50">
            <button onClick={handleLike} className={`flex items-center space-x-2 font-black active:scale-95 ${isLiked ? 'text-uob-red' : 'text-slate-400 hover:text-slate-800'}`}>
              <Heart size={20} fill={isLiked ? '#CE1126' : 'none'}/><span className="text-sm">{likesCount}</span>
            </button>
            <div className="flex items-center space-x-2 font-black text-slate-400"><MessageCircle size={20}/><span className="text-sm">{comments.length}</span></div>
          </div>
          <div className="pt-6">
            {nestedComments.map(c => <CommentItem key={c.id} comment={c} currentUserId={session?.user?.id} onReply={setReplyingTo} onDelete={handleDeleteComment} onUpdate={handleUpdateComment} onCloseModal={handleClose}/>)}
            {comments.length === 0 && <div className="text-center py-10 opacity-40 italic text-sm font-medium">Lancez la discussion !</div>}
          </div>
        </div>
        <div className="p-4 sm:p-6 border-t border-slate-50 bg-white relative z-10 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
          {replyingTo && (
            <div className="bg-slate-50 p-3 rounded-2xl mb-3 flex items-center justify-between border border-slate-100 animate-fade-in">
              <p className="text-xs font-bold text-slate-500">Répondre à <span className="text-uob-blue">{replyingTo.profiles.full_name}</span></p>
              <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-uob-red p-1"><X size={16}/></button>
            </div>
          )}
          <form onSubmit={handlePostComment} className="flex items-center space-x-3">
            <Avatar avatarUrl={currentUserProfile?.avatar_url} name={currentUserProfile?.full_name || ''} size="md" className="shrink-0"/>
            <div className="flex-1 min-w-0 pr-2">
              <textarea ref={textareaRef} rows={1}
                placeholder={replyingTo ? 'Écrire une réponse…' : 'Votre commentaire…'}
                value={replyingTo ? replyContent : newComment}
                onChange={e => { replyingTo ? setReplyContent(e.target.value) : setNewComment(e.target.value); adjustHeight(); }}
                className="w-full bg-slate-50 p-4 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-uob-blue outline-none text-sm font-medium resize-none max-h-32"/>
            </div>
            <button type="submit" disabled={isPostingComment || !(replyingTo ? replyContent : newComment).trim()}
              className="bg-uob-blue text-white w-12 h-12 shrink-0 flex items-center justify-center rounded-2xl shadow-lg active:scale-95 disabled:opacity-50 hover:bg-blue-700">
              {isPostingComment ? <Spinner/> : <Send size={20}/>}
            </button>
          </form>
        </div>
      </div>
    </div>,
    modalRootRef.current
  );
};
export default GroupPostDetailModal;
