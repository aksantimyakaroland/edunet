import React,{useState,useEffect} from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { UserRound,GraduationCap,ArrowRight,AlertTriangle } from 'lucide-react';
const CompleteProfilePopup: React.FC = () => {
  const {session}=useAuth(); const navigate=useNavigate();
  const [v,setV]=useState(false); const [l,setL]=useState(true);
  useEffect(()=>{
    if(!session?.user){setL(false);return;}
    supabase.from('profiles').select('gender,promotion').eq('id',session.user.id).single()
      .then(({data,error})=>{ if(!error&&data&&(!data.gender||!data.promotion)) setV(true); setL(false); });
  },[session]);
  if(!v||l) return null;
  return (
    <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-lg z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-[2.5rem] shadow-premium max-w-md w-full p-8 text-center animate-fade-in-up relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-uob-blue to-uob-red"/>
        <div className="w-20 h-20 bg-uob-red/10 text-uob-red rounded-3xl flex items-center justify-center mx-auto mb-6"><AlertTriangle size={40}/></div>
        <h2 className="text-2xl font-black text-slate-800 uppercase italic">Profil incomplet</h2>
        <p className="mt-4 text-slate-500 font-medium leading-relaxed">Veuillez renseigner votre <span className="text-uob-blue font-bold">Genre</span> et votre <span className="text-uob-blue font-bold">Promotion</span>.</p>
        <div className="mt-8 space-y-3">
          <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left"><UserRound className="text-uob-blue shrink-0" size={24}/><div><p className="font-black text-[10px] uppercase tracking-widest text-slate-400">Champ requis</p><p className="text-sm font-bold text-slate-700">Genre (M / F)</p></div></div>
          <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left"><GraduationCap className="text-uob-blue shrink-0" size={24}/><div><p className="font-black text-[10px] uppercase tracking-widest text-slate-400">Champ requis</p><p className="text-sm font-bold text-slate-700">Promotion L1–L3 (Licence) · L4–L5 (Master)</p></div></div>
        </div>
        <button onClick={()=>{setV(false);navigate(`/profile/${session?.user.id}?edit=true`);}} className="mt-10 w-full py-5 bg-uob-blue text-white font-black rounded-2xl shadow-xl shadow-uob-blue/20 flex items-center justify-center space-x-2 transition-all active:scale-95 uppercase tracking-widest text-xs group px-6"><span>Mettre à jour mon profil</span><ArrowRight size={18} className="group-hover:translate-x-1 transition-transform shrink-0"/></button>
      </div>
    </div>
  );
};
export default CompleteProfilePopup;
