import React,{useState} from 'react';
import { Bell,X } from 'lucide-react';
interface Props { onRequestPermission:()=>void }
const NotificationPermissionBanner: React.FC<Props> = ({onRequestPermission}) => {
  const [v,setV]=useState(true);
  if(!v) return null;
  return (
    <div className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 bg-white p-6 rounded-[2.5rem] shadow-premium z-[100] border border-slate-100 animate-fade-in-up md:w-[400px]">
      <div className="flex items-start">
        <div className="flex-shrink-0 bg-uob-blue/10 p-3 rounded-2xl text-uob-blue"><Bell className="h-6 w-6"/></div>
        <div className="ml-4 w-0 flex-1">
          <p className="text-base font-black text-slate-800">Activer les notifications</p>
          <p className="mt-1 text-sm text-slate-500 font-medium leading-relaxed">Ne manquez aucun message ou actualité Edunet.</p>
          <div className="mt-5 flex space-x-3">
            <button onClick={()=>{onRequestPermission();setV(false);}} className="inline-flex items-center px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-uob-blue/20 text-white bg-uob-blue hover:bg-blue-700 transition-all active:scale-95">Activer</button>
            <button onClick={()=>setV(false)} className="inline-flex items-center px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl text-slate-500 bg-slate-50 hover:bg-slate-100">Plus tard</button>
          </div>
        </div>
        <button onClick={()=>setV(false)} className="ml-4 text-slate-300 hover:text-slate-500 p-1 transition-colors"><X className="h-5 w-5"/></button>
      </div>
    </div>
  );
};
export default NotificationPermissionBanner;
