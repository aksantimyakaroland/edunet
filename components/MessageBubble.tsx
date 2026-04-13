/**
 * @fileoverview Bulle de message dans le chat — Edunet / UOB
 * Supporte : texte, images, audio, fichiers, réponses imbriquées, édition, suppression.
 * @author Roland Myaka
 */
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../services/supabase';
import { Message } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CheckCheck, MoreHorizontal, MessageSquareReply, Pencil,
  Trash2, XCircle, Download, Play, Pause, X, Copy, FileAudio,
} from 'lucide-react';

interface Props {
  message: Message;
  isOwnMessage: boolean;
  onSetEditing: (m: Message) => void;
  onSetReplying: (m: Message) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onMediaClick: (url: string, type: string, name: string) => void;
}

// ── Lecteur audio ──────────────────────────────────────────
const AudioPlayer: React.FC<{ src: string; isOwnMessage: boolean }> = ({ src, isOwnMessage }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasError, setHasError] = useState(false);

  const togglePlay = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!audioRef.current) return;
    try { isPlaying ? audioRef.current.pause() : await audioRef.current.play(); }
    catch { setHasError(true); }
  };

  const handleProgress = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const t = ((e.clientX - rect.left) / rect.width) * duration;
    if (audioRef.current && isFinite(t)) audioRef.current.currentTime = t;
  };

  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    const onMeta  = () => { if (isFinite(a.duration)) setDuration(a.duration); };
    const onTime  = () => setCurrentTime(a.currentTime);
    const onPlay  = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onErr   = () => setHasError(true);
    a.addEventListener('loadedmetadata', onMeta); a.addEventListener('timeupdate', onTime);
    a.addEventListener('play', onPlay); a.addEventListener('pause', onPause);
    a.addEventListener('ended', onPause); a.addEventListener('error', onErr);
    return () => {
      a.removeEventListener('loadedmetadata', onMeta); a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('play', onPlay); a.removeEventListener('pause', onPause);
      a.removeEventListener('ended', onPause); a.removeEventListener('error', onErr);
    };
  }, []);

  const fmt = (t: number) => { if (!isFinite(t)) return '0:00'; return `${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`; };
  const progress = duration ? (currentTime / duration) * 100 : 0;
  const own = isOwnMessage;

  if (hasError) return (
    <div className={`mt-1 p-3 rounded-xl flex items-center justify-between border ${own ? 'bg-white/10 border-white/20 text-white' : 'bg-red-50 border-red-100 text-uob-red'}`}>
      <div className="flex items-center space-x-3"><FileAudio size={24}/><div><p className="text-[10px] font-black uppercase tracking-widest">Note vocale</p><p className="text-[9px] opacity-80 uppercase">Format non supporté</p></div></div>
      <a href={src} target="_blank" rel="noopener noreferrer" className={`p-2 rounded-lg ${own ? 'bg-white/20' : 'bg-white shadow-sm'}`} onClick={e => e.stopPropagation()}><Download size={18}/></a>
    </div>
  );

  return (
    <div className={`flex items-center gap-2 mt-1 w-full ${own ? 'text-white' : 'text-slate-600'}`}>
      <audio ref={audioRef} src={src} preload="auto" playsInline/>
      <button type="button" onClick={togglePlay} className={`p-2.5 rounded-full shrink-0 transition-all ${own ? 'bg-white/20 hover:bg-white/40' : 'bg-slate-200 hover:bg-slate-300'}`}>
        {isPlaying ? <Pause size={18} className="fill-current"/> : <Play size={18} className="fill-current"/>}
      </button>
      <div className="flex-1 flex flex-col min-w-0 pr-1">
        <div onClick={handleProgress} className={`h-1.5 w-full rounded-full cursor-pointer relative ${own ? 'bg-white/30' : 'bg-slate-200'}`}>
          <div style={{ width: `${Math.min(progress, 100)}%` }} className={`h-full rounded-full transition-all duration-100 ${own ? 'bg-white' : 'bg-uob-blue'}`}/>
        </div>
        <div className="flex justify-between text-[10px] font-mono mt-1 opacity-80">
          <span>{fmt(currentTime)}</span><span>{fmt(duration)}</span>
        </div>
      </div>
    </div>
  );
};

// ── Composant principal ────────────────────────────────────
const MessageBubble: React.FC<Props> = ({ message, isOwnMessage, onSetEditing, onSetReplying, setMessages, onMediaClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const modalRoot = document.getElementById('modal-root');
  const time = format(new Date(message.created_at), 'HH:mm', { locale: fr });
  const isEdited = message.updated_at && (new Date(message.updated_at).getTime() - new Date(message.created_at).getTime() > 60000);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    if (menuOpen) document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [menuOpen]);

  const handleDeleteForMe = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); setMessages(prev => prev.filter(m => m.id !== message.id)); };
  const handleDeleteForAll = async (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); const { error } = await supabase.from('messages').delete().eq('id', message.id); if (error) alert('Erreur de suppression.'); };
  const handleReply = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); onSetReplying(message); setMenuOpen(false); };
  const handleEdit  = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); onSetEditing(message); setMenuOpen(false); };
  const handleCopy  = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); if (message.content) { navigator.clipboard.writeText(message.content); alert('Copié !'); } setMenuOpen(false); };

  const renderLinks = (text: string) => {
    const re = /((?:https?:\/\/|www\.)[^\s]+)/gi;
    return text.split(re).map((p, i) => {
      if (p.match(re)) { const href = p.match(/^https?:\/\//i) ? p : `https://${p}`; return <a key={i} href={href} target="_blank" rel="noopener noreferrer" className={`underline break-all ${isOwnMessage ? 'text-white hover:opacity-80' : 'text-uob-blue'}`} onClick={e => e.stopPropagation()}>{p}</a>; }
      return p;
    });
  };

  const renderMedia = () => {
    if (!message.media_url || !message.media_type) return null;
    if (message.media_type.startsWith('image/') || message.media_type === 'image') {
      return <div onClick={() => onMediaClick(message.media_url!, message.media_type!, 'image.jpg')} className="mt-1 mb-1 rounded-xl overflow-hidden cursor-pointer max-w-full bg-black/5 hover:scale-[1.02] transition-transform"><img src={message.media_url} alt="Média" className="w-full max-h-64 object-contain"/></div>;
    }
    if (message.media_type.startsWith('audio/')) return <AudioPlayer src={message.media_url} isOwnMessage={isOwnMessage}/>;
    return (
      <button type="button" onClick={() => onMediaClick(message.media_url!, message.media_type!, 'fichier')} className={`flex items-center w-full space-x-3 p-3 mt-1 rounded-xl text-left ${isOwnMessage ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}>
        <Download size={24}/><div className="flex-1 min-w-0"><p className="font-bold truncate text-xs">{message.media_url.split('/').pop()}</p></div>
      </button>
    );
  };

  const OptionsMenu = () => (
    <div className="flex flex-col">
      <button type="button" onClick={handleReply} className="w-full text-left flex items-center px-4 py-3 text-sm font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50"><MessageSquareReply size={18} className="mr-3 text-uob-blue"/>Répondre</button>
      {message.content && <button type="button" onClick={handleCopy} className="w-full text-left flex items-center px-4 py-3 text-sm font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50"><Copy size={18} className="mr-3 text-emerald-500"/>Copier</button>}
      {isOwnMessage && message.content && <button type="button" onClick={handleEdit} className="w-full text-left flex items-center px-4 py-3 text-sm font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50"><Pencil size={18} className="mr-3 text-uob-red"/>Modifier</button>}
      <div className="border-t border-slate-100 my-1 mx-2"/>
      <button type="button" onClick={handleDeleteForMe} className="w-full text-left flex items-center px-4 py-3 text-sm font-black uppercase tracking-widest text-uob-red hover:bg-red-50"><XCircle size={18} className="mr-3"/>Supprimer (moi)</button>
      {isOwnMessage && <button type="button" onClick={handleDeleteForAll} className="w-full text-left flex items-center px-4 py-3 text-sm font-black uppercase tracking-widest text-uob-red hover:bg-red-50"><Trash2 size={18} className="mr-3"/>Supprimer (tous)</button>}
    </div>
  );

  const MobileMenu = () => {
    if (!modalRoot) return null;
    return createPortal(
      <div className="fixed inset-0 z-[1000] flex items-end animate-fade-in" onClick={() => setMenuOpen(false)}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"/>
        <div className="relative w-full bg-white rounded-t-[2.5rem] p-6 shadow-2xl animate-fade-in-up" onClick={e => e.stopPropagation()}>
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"/>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-slate-800 uppercase italic">Options</h3>
            <button type="button" onClick={() => setMenuOpen(false)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
          </div>
          <OptionsMenu/>
        </div>
      </div>,
      modalRoot
    );
  };

  return (
    <div className={`group flex items-end gap-1 w-full ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`relative self-center ${isOwnMessage ? 'order-1' : 'order-3'}`}>
        <button type="button" onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }} className="p-2 rounded-full text-slate-400 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-slate-100">
          <MoreHorizontal size={18}/>
        </button>
        {menuOpen && (
          <>
            <div className="hidden md:block">
              <div ref={menuRef} className={`absolute bottom-full mb-2 w-56 bg-white rounded-2xl shadow-premium py-2 z-[60] border border-slate-100 animate-fade-in-up ${isOwnMessage ? 'right-0' : 'left-0'}`}>
                <OptionsMenu/>
              </div>
            </div>
            <MobileMenu/>
          </>
        )}
      </div>
      <div className={`relative max-w-[85%] sm:max-w-md lg:max-w-lg px-4 py-3 rounded-[1.25rem] order-2 shadow-soft overflow-hidden ${isOwnMessage ? 'bg-uob-blue text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'}`}>
        {message.replied_to && (
          <div className={`p-3 mb-2 border-l-4 rounded-xl flex flex-col ${isOwnMessage ? 'border-white/40 bg-black/10' : 'border-uob-blue/30 bg-slate-50'}`}>
            <p className={`font-black text-[9px] uppercase tracking-widest mb-0.5 ${isOwnMessage ? 'text-white/80' : 'text-uob-blue'}`}>{message.replied_to.profiles?.full_name || '...'}</p>
            <p className={`text-xs italic line-clamp-2 ${isOwnMessage ? 'text-white/70' : 'text-slate-500'}`}>{message.replied_to.content || 'Média'}</p>
          </div>
        )}
        {renderMedia()}
        {message.content && <div className="text-sm font-medium break-words whitespace-pre-wrap leading-relaxed">{renderLinks(message.content)}</div>}
        <div className="text-right text-[9px] mt-1.5 flex justify-end items-center font-black uppercase tracking-widest opacity-60">
          {isEdited && <span className="mr-1">modifié</span>}
          {time}
          {isOwnMessage && <CheckCheck size={20} className="ml-1" style={{ color: message.is_read ? '#FFD700' : 'rgba(255,255,255,0.5)' }}/>}
        </div>
      </div>
    </div>
  );
};
export default MessageBubble;
