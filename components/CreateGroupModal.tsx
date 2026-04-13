/**
 * @fileoverview Modal création de groupe — Edunet / UOB
 * @author Roland Myaka
 */
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../App';
import Spinner from './Spinner';
import { X, Upload, Lock, Globe } from 'lucide-react';

interface Props { onClose: () => void; }

const CreateGroupModal: React.FC<Props> = ({ onClose }) => {
  const { session } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (e.target.files?.[0]) { const f = e.target.files[0]; setAvatarFile(f); setPreviewUrl(URL.createObjectURL(f)); }
    else { setAvatarFile(null); setPreviewUrl(null); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !session?.user) { setError('Le nom du groupe est obligatoire.'); return; }
    setLoading(true); setError(null);
    try {
      let avatarUrl: string | undefined;
      if (avatarFile) {
        const fileName = `group-${Date.now()}.${avatarFile.name.split('.').pop()}`;
        const { error: upErr } = await supabase.storage.from('avatars').upload(fileName, avatarFile);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
        avatarUrl = data.publicUrl;
      }
      const { data: gData, error: gErr } = await supabase.from('groups')
        .insert({ name, description, created_by: session.user.id, avatar_url: avatarUrl, is_private: isPrivate })
        .select().single();
      if (gErr) throw gErr;
      if (gData) {
        const { error: mErr } = await supabase.from('group_members').upsert({ group_id: gData.id, user_id: session.user.id, role: 'admin' }, { onConflict: 'group_id,user_id' });
        if (mErr) {
          await supabase.from('group_members').insert({ group_id: gData.id, user_id: session.user.id, role: 'admin' });
        }
      }
      onClose();
    } catch (err: any) { setError(err.message || 'Une erreur est survenue.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div ref={modalRef} className="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-lg w-full animate-fade-in-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Créer un groupe</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={24}/></button>
        </div>
        {error && <div className="bg-red-50 text-uob-red p-4 rounded-2xl mb-6 text-sm font-bold border border-red-100">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-700 text-xs font-black uppercase tracking-widest mb-2 ml-1">Nom du groupe</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Informatique L3" required
              className="bg-slate-50 border border-slate-100 text-slate-900 text-sm rounded-2xl focus:ring-2 focus:ring-uob-blue outline-none block w-full p-4"/>
          </div>
          <div>
            <label className="block text-slate-700 text-xs font-black uppercase tracking-widest mb-2 ml-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="De quoi parle ce groupe ?"
              className="bg-slate-50 border border-slate-100 text-slate-900 text-sm rounded-2xl focus:ring-2 focus:ring-uob-blue outline-none block w-full p-4 resize-none"/>
          </div>
          <div>
            <label className="block text-slate-700 text-xs font-black uppercase tracking-widest mb-2 ml-1">Visibilité</label>
            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-2xl">
              <button type="button" onClick={() => setIsPrivate(false)} className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${!isPrivate ? 'bg-white text-uob-blue shadow-sm' : 'text-slate-500'}`}><Globe size={18}/><span>Public</span></button>
              <button type="button" onClick={() => setIsPrivate(true)} className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${isPrivate ? 'bg-white text-uob-blue shadow-sm' : 'text-slate-500'}`}><Lock size={18}/><span>Privé</span></button>
            </div>
          </div>
          <div>
            <label className="block text-slate-700 text-xs font-black uppercase tracking-widest mb-2 ml-1">Photo du groupe</label>
            <div className="mt-2 flex items-center space-x-6">
              <div className="h-24 w-24 rounded-[1.5rem] overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
                {previewUrl ? <img src={previewUrl} alt="Aperçu" className="h-full w-full object-cover"/> : <Upload className="text-slate-300" size={32}/>}
              </div>
              <label htmlFor="group-img-upload" className="cursor-pointer bg-uob-blue/10 text-uob-blue px-6 py-3 rounded-2xl text-sm font-black hover:bg-uob-blue hover:text-white transition-all">
                <span>Choisir une image</span>
                <input id="group-img-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*"/>
              </label>
            </div>
          </div>
          <div className="flex space-x-3 mt-8">
            <button type="button" onClick={onClose} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl">Annuler</button>
            <button type="submit" disabled={loading} className="flex-[2] bg-uob-blue text-white font-black py-4 rounded-2xl shadow-lg shadow-uob-blue/20 hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95">
              {loading ? <Spinner/> : 'Créer maintenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CreateGroupModal;
