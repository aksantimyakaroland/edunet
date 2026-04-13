/**
 * @fileoverview Formulaire de création / modification de publication — Edunet / UOB.
 *
 * Utilisé sur le fil d'actualité et la page profil.
 * En mode édition, pré-remplit le contenu et le média existants.
 *
 * @author Roland Myaka
 */

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../App';
import { Post as PostType } from '../types';
import { Paperclip, X, FileText, Send, RotateCcw } from 'lucide-react';
import Spinner from './Spinner';

interface CreatePostProps {
  onPostCreated:  (newPost?: PostType) => void;
  editingPost?:   PostType | null;
  onCancelEdit?:  () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated, editingPost, onCancelEdit }) => {
  const { session } = useAuth();
  const [content,    setContent   ] = useState('');
  const [uploading,  setUploading ] = useState(false);
  const [file,       setFile      ] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error,      setError     ] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** Ajuste la hauteur du textarea au contenu */
  const adjustHeight = () => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = `${ta.scrollHeight}px`; }
  };

  /* Pré-remplit le formulaire en mode édition */
  useEffect(() => {
    if (editingPost) {
      setContent(editingPost.content);
      setPreviewUrl(editingPost.media_url && editingPost.media_type === 'image' ? editingPost.media_url : null);
      setTimeout(adjustHeight, 0);
    } else {
      setContent(''); setPreviewUrl(null); setFile(null);
      if (textareaRef.current) textareaRef.current.style.height = '120px';
    }
  }, [editingPost]);

  useEffect(() => () => { if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      setFile(f);
      setPreviewUrl(f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
    } else { setFile(null); setPreviewUrl(null); }
    e.target.value = '';
  };

  const handleRemoveFile = (e?: React.MouseEvent) => {
    e?.preventDefault(); e?.stopPropagation();
    setFile(null);
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handlePost = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (!content.trim() && !file && !previewUrl) { setError('La publication ne peut pas être vide.'); return; }
    if (!session?.user) { setError('Vous devez être connecté.'); return; }

    setUploading(true); setError(null);
    let mediaUrl: string | undefined = editingPost?.media_url;
    let mediaType: string | undefined = editingPost?.media_type;

    if (file) {
      const fileName = `${session.user.id}-${Date.now()}.${file.name.split('.').pop()}`;
      const { error: upErr } = await supabase.storage.from('media').upload(fileName, file);
      if (upErr) { setError(upErr.message); setUploading(false); return; }
      const { data } = supabase.storage.from('media').getPublicUrl(fileName);
      mediaUrl  = data.publicUrl;
      mediaType = file.type.startsWith('image/') ? 'image' : 'document';
    }

    try {
      if (editingPost) {
        const { data, error } = await supabase.from('posts')
          .update({ content, media_url: mediaUrl, media_type: mediaType })
          .eq('id', editingPost.id)
          .select('*, profiles(*), comments(*, profiles(*)), likes(*)').single();
        if (error) throw error;
        onPostCreated(data as any);
      } else {
        const { data, error } = await supabase.from('posts')
          .insert({ user_id: session.user.id, content, media_url: mediaUrl, media_type: mediaType })
          .select('*, profiles(*), comments(*, profiles(*)), likes(*)').single();
        if (error) throw error;
        setContent(''); handleRemoveFile(); onPostCreated(data as any);
      }
    } catch (err: any) { setError(err.message); }
    finally { setUploading(false); }
  };

  return (
    <form onSubmit={e => e.preventDefault()}
      className={`bg-white p-6 rounded-[2rem] shadow-soft border transition-all duration-500 animate-fade-in-up
                  ${editingPost ? 'ring-2 ring-uob-blue border-transparent' : 'border-slate-100'}`}>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          {editingPost ? 'Modification en cours' : 'Nouvelle publication'}
        </h3>
        {editingPost && (
          <button type="button" onClick={onCancelEdit}
            className="flex items-center space-x-1 text-uob-red text-[10px] font-black uppercase tracking-widest">
            <RotateCcw size={12}/><span>Annuler</span>
          </button>
        )}
      </div>

      <textarea ref={textareaRef} value={content}
        onChange={e => { setContent(e.target.value); adjustHeight(); }}
        placeholder="Partagez une astuce, une question ou un projet avec la communauté UOB…"
        className="w-full p-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-uob-blue
                   outline-none resize-none font-medium text-slate-700 min-h-[120px] overflow-hidden" />

      {previewUrl && (
        <div className="mt-4 relative inline-block animate-fade-in">
          <img src={previewUrl} alt="Aperçu" className="rounded-2xl max-h-48 w-auto shadow-md" />
          <button type="button" onClick={handleRemoveFile}
            className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 shadow-lg hover:bg-uob-red">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-50">
        <div>
          <label htmlFor="file-input-feed"
            className="cursor-pointer text-slate-400 hover:text-uob-blue p-3 rounded-2xl hover:bg-slate-50 transition-all">
            <Paperclip size={24} />
          </label>
          <input id="file-input-feed" type="file" className="hidden"
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
            onChange={handleFileChange} />
        </div>
        <button type="button" onClick={handlePost}
          disabled={uploading || (!content.trim() && !file && !previewUrl)}
          className={`${editingPost ? 'bg-uob-blue' : 'bg-uob-red'} text-white font-black py-3.5 px-8
                      rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50
                      uppercase tracking-widest text-[10px] flex items-center space-x-2`}>
          {uploading ? <Spinner /> : editingPost
            ? <><Send size={14}/><span>Mettre à jour</span></>
            : <span>Publier</span>}
        </button>
      </div>
      {error && <p className="text-uob-red text-[10px] font-bold mt-3 ml-2">{error}</p>}
    </form>
  );
};

export default CreatePost;
