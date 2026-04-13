import React,{useEffect,useState} from 'react';
import { useAuth } from '../App';
import { supabase } from '../services/supabase';
import NotificationPermissionBanner from './NotificationPermissionBanner';

// @ts-ignore
const VAPID_KEY: string = (typeof import.meta!=='undefined'&&(import.meta as any).env?.VITE_VAPID_PUBLIC_KEY)||'';

function b64ToUint8(b64: string): Uint8Array {
  const pad='='.repeat((4-b64.length%4)%4);
  const raw=atob((b64+pad).replace(/-/g,'+').replace(/_/g,'/'));
  const out=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++) out[i]=raw.charCodeAt(i);
  return out;
}

const NotificationsProvider: React.FC = () => {
  const {session}=useAuth();
  const [perm,setPerm]=useState<NotificationPermission>('default');
  useEffect(()=>{ if('Notification' in window) setPerm(Notification.permission); },[]);

  const subscribe=async()=>{
    if(!VAPID_KEY) return;
    try {
      const sw=await navigator.serviceWorker.ready;
      const old=await sw.pushManager.getSubscription();
      if(old) await old.unsubscribe();
      const sub=await sw.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64ToUint8(VAPID_KEY)});
      if(!session?.user) return;
      await supabase.from('push_subscriptions').upsert({user_id:session.user.id,subscription:sub.toJSON()},{onConflict:'user_id'});
    } catch(e){ console.error('[Edunet] Push subscribe error:',e); }
  };

  useEffect(()=>{
    if(session&&'serviceWorker' in navigator&&'PushManager' in window&&perm==='granted') subscribe();
  },[session,perm]);

  const handleRequest=async()=>{
    if(!('Notification' in window)){alert('Notifications non supportées.');return;}
    const p=await Notification.requestPermission();
    setPerm(p);
    if(p==='granted') await subscribe();
  };

  if(perm!=='default') return null;
  return <NotificationPermissionBanner onRequestPermission={handleRequest}/>;
};
export default NotificationsProvider;
