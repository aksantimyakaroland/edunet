/**
 * @fileoverview Fenêtre de chat temps réel — Edunet / UOB
 * Supporte : texte, images, audio (enregistrement), fichiers, réponses, édition, suppression.
 * @author Roland Myaka
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../App';
import { Message, Profile } from '../types';
import Spinner from './Spinner';
import Avatar from './Avatar';
import { Send, ArrowLeft, Paperclip, X, Mic, StopCircle, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useUnreadMessages } from './UnreadMessagesProvider';
import MessageBubble from './MessageBubble';
import MediaViewerModal from './MediaViewerModal';
import { formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';

const isOnline = (lastSeen?: string | null) => lastSeen ? differenceInMinutes(new Date(), new Date(lastSeen)) < 3 : false;
const fmtTime = (s: number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;

interface Props { conversationId: string; onMessagesRead: () => void; }

const ChatWindow: React.FC<Props> = ({ conversationId, onMessagesRead }) => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherParticipant, setOtherParticipant] = useState<Profile | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [mediaInView, setMediaInView] = useState<{ url: string; type: string; name: string } | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording'>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [isOnlineRealtime, setIsOnlineRealtime] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { fetchUnreadCount } = useUnreadMessages();

  const adjustHeight = () => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = '48px'; ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`; }
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior }), 100);
  };

  const markAsRead = useCallback(async () => {
    if (!session?.user || !conversationId) return;
    const { error } = await supabase.from('messages').update({ is_read: true }).eq('conversation_id', conversationId).neq('sender_id', session.user.id).is('is_read', false);
    if (!error) { fetchUnreadCount(); onMessagesRead(); }
  }, [session?.user?.id, conversationId, fetchUnreadCount, onMessagesRead]);

  const fetchData = useCallback(async () => {
    if (!session?.user || !conversationId) return;
    if (messages.length === 0) setLoading(true);
    try {
      const { data: pData } = await supabase.from('conversation_participants').select('profiles:user_id(*)').eq('conversation_id', conversationId).neq('user_id', session.user.id).maybeSingle();
      if (pData?.profiles) { const p = pData.profiles as unknown as Profile; setOtherParticipant(p); setIsOnlineRealtime(isOnline(p.last_seen_at)); }
      const { data: me } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (me) setCurrentUserProfile(me);
      const { data: msgs } = await supabase.from('messages').select('*, profiles:sender_id(*), replied_to:replying_to_message_id(*, profiles:sender_id(*))').eq('conversation_id', conversationId).order('created_at', { ascending: true });
      setMessages(msgs as any[] || []);
      if (msgs?.some(m => !m.is_read && m.sender_id !== session.user.id)) markAsRead();
      scrollToBottom('auto');
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [conversationId, session?.user?.id]);

  useEffect(() => { setMessages([]); fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!conversationId || !session?.user) return;
    const ch = supabase.channel(`chat-${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, async payload => {
        const { data } = await supabase.from('messages').select('*, profiles:sender_id(*), replied_to:replying_to_message_id(*, profiles:sender_id(*))').eq('id', payload.new.id).single();
        if (data) { setMessages(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data as Message]); if (data.sender_id !== session.user.id) markAsRead(); scrollToBottom(); }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, payload => {
        setMessages(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, payload => {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [conversationId, session?.user?.id, markAsRead]);

  const handleDeleteConversation = async () => {
    if (!window.confirm('Supprimer cette conversation ?')) return;
    setLoading(true);
    const { error } = await supabase.from('conversation_participants').delete().match({ conversation_id: conversationId, user_id: session?.user?.id });
    if (error) { alert('Erreur de suppression.'); setLoading(false); return; }
    navigate('/chat');
  };

  const handleSend = async (e?: React.FormEvent, audioBlob?: Blob) => {
    e?.preventDefault();
    if ((!newMessage.trim() && !file && !audioBlob) || !session?.user || !currentUserProfile) return;
    setIsUploading(true);
    try {
      if (editingMessage) {
        const { error } = await supabase.from('messages').update({ content: newMessage }).eq('id', editingMessage.id);
        if (error) throw error;
        setEditingMessage(null); setNewMessage('');
      } else {
        let mediaUrl, mediaType;
        if (file || audioBlob) {
          let ext = 'bin';
          if (audioBlob) {
            if (audioBlob.type.includes('mp4')||audioBlob.type.includes('m4a')) ext='m4a';
            else if (audioBlob.type.includes('webm')) ext='webm';
            else if (audioBlob.type.includes('ogg')) ext='ogg';
            else ext='wav';
          } else if (file) ext = file.name.split('.').pop() || 'bin';
          const mf = file || new File([audioBlob!], `audio_${Date.now()}.${ext}`, { type: audioBlob?.type || file?.type });
          const fname = `${conversationId}/${Date.now()}-${mf.name}`;
          const { data: upData, error: upErr } = await supabase.storage.from('chat_media').upload(fname, mf);
          if (upErr) throw upErr;
          const { data: urlData } = supabase.storage.from('chat_media').getPublicUrl(upData.path);
          mediaUrl = urlData.publicUrl; mediaType = mf.type;
        }
        const { error } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: session.user.id, content: newMessage, media_url: mediaUrl, media_type: mediaType, replying_to_message_id: replyingTo?.id });
        if (error) throw error;
        setNewMessage(''); setFile(null); setFilePreview(null); setReplyingTo(null);
      }
      setTimeout(adjustHeight, 10); scrollToBottom();
    } catch (e) { console.error(e); alert("Erreur lors de l'envoi."); }
    finally { setIsUploading(false); }
  };

  const startRecording = async (e?: React.MouseEvent) => {
    e?.preventDefault(); e?.stopPropagation();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const types = ['audio/mp4','audio/aac','audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus'];
      const mimeType = types.find(t => MediaRecorder.isTypeSupported(t)) || '';
      mediaRecorderRef.current = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
        if (blob.size > 500) await handleSend(undefined, blob);
        setRecordingStatus('idle');
      };
      mediaRecorderRef.current.start();
      setRecordingStatus('recording');
      timerRef.current = window.setInterval(() => setRecordingTime(p => p + 1), 1000);
    } catch { alert('Microphone inaccessible.'); }
  };

  const stopRecording = (e?: React.MouseEvent) => {
    e?.preventDefault(); e?.stopPropagation();
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setRecordingTime(0);
  };

  const handleSetEditing = (msg: Message) => {
    setEditingMessage(msg); setNewMessage(msg.content); setReplyingTo(null);
    setTimeout(() => { textareaRef.current?.focus(); adjustHeight(); }, 100);
  };

  if (loading && messages.length === 0) return <div className="h-full flex items-center justify-center bg-white"><Spinner/></div>;

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-slate-100 bg-white/95 backdrop-blur-md z-20 shrink-0">
        <div className="flex items-center min-w-0">
          <button type="button" onClick={() => navigate('/chat')} className="mr-3 p-2.5 rounded-2xl hover:bg-slate-50 text-slate-600 bg-slate-100/50 active:bg-slate-200">
            <ArrowLeft size={22} strokeWidth={2.5}/>
          </button>
          {otherParticipant && (
            <Link to={`/profile/${otherParticipant.id}`} className="flex items-center space-x-3 group min-w-0">
              <Avatar avatarUrl={otherParticipant.avatar_url} name={otherParticipant.full_name} size="md"/>
              <div className="min-w-0">
                <h3 className="font-black text-slate-800 tracking-tight truncate">{otherParticipant.full_name}</h3>
                <p className={`text-[10px] font-black uppercase tracking-widest ${isOnlineRealtime ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {isOnlineRealtime ? 'En ligne' : otherParticipant.last_seen_at ? `Vu ${formatDistanceToNow(new Date(otherParticipant.last_seen_at), { locale: fr, addSuffix: true })}` : 'Hors ligne'}
                </p>
              </div>
            </Link>
          )}
        </div>
        <button onClick={handleDeleteConversation} className="p-3 text-slate-400 hover:text-uob-red hover:bg-red-50 rounded-2xl active:scale-90" title="Supprimer la conversation">
          <Trash2 size={20}/>
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} isOwnMessage={msg.sender_id === session?.user?.id}
            onSetEditing={handleSetEditing} onSetReplying={setReplyingTo} setMessages={setMessages}
            onMediaClick={(url, type, name) => setMediaInView({ url, type, name })}/>
        ))}
        <div ref={messagesEndRef} className="h-4"/>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-100 bg-white shrink-0 z-10">
        {recordingStatus === 'recording' ? (
          <div className="flex items-center space-x-4 h-14 bg-red-50 rounded-2xl px-4 border border-red-100 animate-pulse">
            <div className="flex-1 flex items-center space-x-3">
              <div className="w-2.5 h-2.5 bg-uob-red rounded-full animate-ping"/>
              <span className="text-uob-red font-black tracking-tighter">{fmtTime(recordingTime)}</span>
            </div>
            <button type="button" onClick={stopRecording} className="bg-uob-red text-white p-2.5 rounded-xl shadow-lg active:scale-95"><StopCircle size={24}/></button>
          </div>
        ) : (
          <div className="space-y-2">
            {replyingTo && (
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl mb-2 border border-slate-100 text-xs animate-fade-in-up">
                <div className="truncate pr-4">
                  <span className="font-black text-uob-blue uppercase tracking-widest text-[9px] mr-2">Réponse :</span>
                  <span className="text-slate-500 italic font-medium">{replyingTo.content || 'Média'}</span>
                </div>
                <button type="button" onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-uob-red p-1"><X size={16}/></button>
              </div>
            )}
            {editingMessage && (
              <div className="flex items-center justify-between bg-uob-red/10 p-3 rounded-2xl mb-2 border border-uob-red/20 text-xs animate-fade-in-up">
                <div className="flex items-center text-uob-red font-black uppercase tracking-widest text-[9px]">
                  <Pencil size={12} className="mr-2"/> Modification…
                </div>
                <button type="button" onClick={() => { setEditingMessage(null); setNewMessage(''); }} className="text-uob-red hover:text-red-700 p-1"><RotateCcw size={16}/></button>
              </div>
            )}
            <form onSubmit={handleSend} className="flex items-end space-x-2">
              {!editingMessage && (
                <label className="p-3 text-slate-400 hover:text-uob-blue cursor-pointer rounded-2xl shrink-0 transition-colors active:bg-slate-100">
                  <Paperclip size={24}/>
                  <input type="file" onChange={e => { if (e.target.files?.[0]) { setFile(e.target.files[0]); setFilePreview(e.target.files[0].name); } }} className="hidden"/>
                </label>
              )}
              <div className="flex-1 min-w-0">
                {filePreview && (
                  <div className="flex items-center bg-uob-blue/10 p-2 mb-2 rounded-xl text-[10px] font-black uppercase text-uob-blue border border-uob-blue/20">
                    <span className="truncate flex-1 ml-2">{filePreview}</span>
                    <button type="button" onClick={() => { setFile(null); setFilePreview(null); }} className="p-1 hover:text-uob-red"><X size={14}/></button>
                  </div>
                )}
                <textarea ref={textareaRef} value={newMessage}
                  onChange={e => { setNewMessage(e.target.value); adjustHeight(); }}
                  placeholder={editingMessage ? 'Modifier le message…' : 'Écrire un message…'}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-uob-blue outline-none resize-none max-h-40 font-medium text-slate-700"
                  style={{ minHeight: '48px', overflow: 'hidden' }}/>
              </div>
              <div className="flex items-center shrink-0">
                {!newMessage.trim() && !file ? (
                  <button type="button" onClick={startRecording} className="bg-uob-blue text-white p-3.5 rounded-2xl shadow-lg shadow-uob-blue/20 active:scale-90 hover:bg-blue-700"><Mic size={24}/></button>
                ) : (
                  <button type="submit" disabled={isUploading} className="bg-uob-blue text-white p-3.5 rounded-2xl disabled:opacity-50 shadow-lg shadow-uob-blue/20 active:scale-90 hover:bg-blue-700">
                    {isUploading ? <Spinner/> : <Send size={24}/>}
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
      {mediaInView && <MediaViewerModal mediaUrl={mediaInView.url} mediaType={mediaInView.type} fileName={mediaInView.name} onClose={() => setMediaInView(null)}/>}
    </div>
  );
};
export default ChatWindow;
