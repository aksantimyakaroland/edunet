/**
 * @fileoverview Modal image plein écran — Edunet / UOB
 * @author Roland Myaka
 */
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Heart, MessageCircle, Share2 } from 'lucide-react';
import { Post as PostType, Like } from '../types';
import { useAuth } from '../App';
import { supabase } from '../services/supabase';

interface Props { post: PostType; onClose: () => void; onOpenComments: () => void; }

const ImageModal: React.FC<Props> = ({ post, onClose, onOpenComments }) => {
  const { session } = useAuth();
  const [likes, setLikes] = useState<Like[]>(post.likes);
  const contentRef = useRef<HTMLDivElement>(null);
  const modalRoot = document.getElementById('modal-root');

  useEffect(() => { setLikes(post.likes); }, [post.likes]);
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = 'auto'; }; }, []);

  const handleBackdrop = (e: React.MouseEvent) => {
    if (contentRef.current && !contentRef.current.contains(e.target as Node)) onClose();
  };

  const userHasLiked = likes.some(l => l.user_id === session?.user?.id);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.user) return;
    if (userHasLiked) {
      const like = likes.find(l => l.user_id === session.user.id);
      if (like) { setLikes(likes.filter(l => l.id !== like.id)); await supabase.from('likes').delete().eq('id', like.id); }
    } else {
      const temp: Like = { id: `temp-${Date.now()}`, post_id: post.id, user_id: session.user.id };
      setLikes([...likes, temp]);
      const { error } = await supabase.from('likes').insert({ post_id: post.id, user_id: session.user.id });
      if (error) setLikes(prev => prev.filter(l => l.id !== temp.id));
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post.id}`;
    try { navigator.share ? await navigator.share({ title: 'Edunet', url }) : (await navigator.clipboard.writeText(url), alert('Lien copié !')); } catch {}
  };

  if (!modalRoot) return null;
  return createPortal(
    <div className="fixed inset-0 w-full h-full bg-brand-dark/95 z-[999] flex justify-center items-center backdrop-blur-xl animate-fade-in" onClick={handleBackdrop}>
      <button className="absolute top-6 right-6 text-white/50 hover:text-white z-[1000] bg-white/10 p-3 rounded-full" onClick={onClose}><X size={28}/></button>
      <div ref={contentRef} className="relative w-full h-full flex flex-col items-center justify-center p-4 sm:p-10">
        <div className="flex-1 flex items-center justify-center w-full h-full">
          <img src={post.media_url} alt="Vue complète" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"/>
        </div>
        <div className="w-full max-w-4xl mx-auto mt-6 text-white">
          {post.content && <p className="mb-6 text-white/90 text-sm sm:text-base font-medium line-clamp-2">{post.content}</p>}
          <div className="flex justify-between items-center pb-8 sm:pb-0">
            <div className="flex items-center space-x-6 text-white/70">
              <button onClick={handleLike} className={`flex items-center space-x-2 transition-all ${userHasLiked ? 'text-uob-red' : 'hover:text-white'}`}>
                <Heart size={26} fill={userHasLiked ? '#CE1126' : 'none'}/><span className="font-black text-lg">{likes.length}</span>
              </button>
              <button onClick={() => { onClose(); onOpenComments(); }} className="flex items-center space-x-2 hover:text-white">
                <MessageCircle size={26}/><span className="font-black text-lg">{post.comments.length}</span>
              </button>
            </div>
            <button onClick={handleShare} className="p-3 bg-white/10 rounded-2xl text-white/70 hover:text-white"><Share2 size={24}/></button>
          </div>
        </div>
      </div>
    </div>,
    modalRoot
  );
};
export default ImageModal;
