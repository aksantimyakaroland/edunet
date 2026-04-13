import React,{useState,useEffect} from 'react';
import { Download,Smartphone,X,Share,PlusSquare } from 'lucide-react';
interface Props { onComplete:()=>void }
const InstallPWABanner: React.FC<Props> = ({onComplete}) => {
  const [prompt,setPrompt]=useState<any>(null);
  const [v,setV]=useState(false);
  const [ios,setIos]=useState(false);
  useEffect(()=>{
    const ua=navigator.userAgent.toLowerCase();
    const isIos=/iphone|ipad|ipod/.test(ua);
    const standalone=(navigator as any).standalone||window.matchMedia('(display-mode:standalone)').matches;
    if(standalone){onComplete();return;}
    if(isIos){setIos(true);const t=setTimeout(()=>setV(true),2000);return()=>clearTimeout(t);}
    const h=(e:any)=>{e.preventDefault();setPrompt(e);setV(true);};
    window.addEventListener('beforeinstallprompt',h);
    return()=>window.removeEventListener('beforeinstallprompt',h);
  },[onComplete]);
  const install=async()=>{if(!prompt)return;prompt.prompt();const{outcome}=await prompt.userChoice;if(outcome==='accepted'){setPrompt(null);setV(false);onComplete();}};
  const close=()=>{setV(false);onComplete();};
  if(!v) return null;
  return (
    <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[100] animate-fade-in-up">
      <div className="glass bg-white/90 rounded-[2.5rem] shadow-premium border border-slate-100 overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-uob-blue/10 p-3 rounded-2xl text-uob-blue"><Smartphone size={24}/></div>
            <button onClick={close} className="p-2 text-slate-300 hover:text-slate-500"><X size={20}/></button>
          </div>
          <h3 className="text-lg font-black text-slate-800">Installer Edunet</h3>
          <p className="mt-2 text-sm text-slate-500 font-medium leading-relaxed">Accédez rapidement à la communauté UOB depuis votre écran d'accueil.</p>
          {ios ? (
            <div className="mt-6 bg-slate-50 p-4 rounded-3xl space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Comment installer :</p>
              <div className="flex items-center space-x-3 text-xs font-bold text-slate-700"><div className="bg-white p-2 rounded-lg shadow-sm"><Share size={14} className="text-uob-blue"/></div><span>1. Appuyez sur "Partager" dans Safari</span></div>
              <div className="flex items-center space-x-3 text-xs font-bold text-slate-700"><div className="bg-white p-2 rounded-lg shadow-sm"><PlusSquare size={14} className="text-uob-blue"/></div><span>2. "Sur l'écran d'accueil"</span></div>
            </div>
          ) : (
            <button onClick={install} className="mt-6 w-full py-4 bg-uob-blue text-white font-black rounded-2xl shadow-lg shadow-uob-blue/20 flex items-center justify-center space-x-2 hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-widest text-xs"><Download size={18}/><span>Installer</span></button>
          )}
          <button onClick={close} className="mt-3 w-full py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600">Plus tard</button>
        </div>
      </div>
    </div>
  );
};
export default InstallPWABanner;
