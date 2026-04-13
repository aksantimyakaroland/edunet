/**
 * @fileoverview Page d'authentification — Edunet / UOB
 * Promotions : L1/L2/L3 (Licence) · L4/L5 (Master)
 * Matricule  : numéro simple ex. 42486
 * @author Roland Myaka
 */
import React,{useState,useEffect} from 'react';
import { supabase } from '../services/supabase';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight,Mail,Lock,User,Hash,GraduationCap,Eye,EyeOff,RefreshCw,AlertCircle,ShieldCheck,ChevronDown,UserRound,BookOpen } from 'lucide-react';
import Spinner from './Spinner';

export const PROMOTIONS: {value:string;label:string;cycle:'Licence'|'Master'}[] = [
  {value:'L1',label:'L1 — Licence 1',cycle:'Licence'},
  {value:'L2',label:'L2 — Licence 2',cycle:'Licence'},
  {value:'L3',label:'L3 — Licence 3',cycle:'Licence'},
  {value:'L4',label:'L4 — Master 1', cycle:'Master'},
  {value:'L5',label:'L5 — Master 2', cycle:'Master'},
];

const AuthPage: React.FC = () => {
  const [searchParams]=useSearchParams();
  const [mode,setMode]=useState<'login'|'signup'|'forgot'>('login');
  const [loading,setLoading]=useState(false);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [showPwd,setShowPwd]=useState(false);
  const [fullName,setFullName]=useState('');
  const [studentId,setStudentId]=useState('');
  const [faculty,setFaculty]=useState('');
  const [promotion,setPromotion]=useState('');
  const [gender,setGender]=useState<'M'|'F'|''>('');
  const [error,setError]=useState<string|null>(null);
  const [message,setMessage]=useState<string|null>(null);

  useEffect(()=>{
    const m=searchParams.get('mode');
    if(m==='signup') setMode('signup');
    else if(m==='forgot') setMode('forgot');
    else setMode('login');
  },[searchParams]);

  const getFriendlyError=(err:any)=>{
    const msg=(err.message||'').toLowerCase();
    if(msg.includes('invalid login credentials')) return 'Email ou mot de passe incorrect.';
    if(msg.includes('already registered')) return 'Cet email est déjà utilisé.';
    if(msg.includes('user not found')||msg.includes('invalid email')) return 'Adresse email introuvable.';
    return err.message||'Une erreur est survenue.';
  };

  const handleAuth=async(e:React.FormEvent)=>{
    e.preventDefault(); setLoading(true); setError(null); setMessage(null);
    try {
      if(mode==='login'){
        const {error}=await supabase.auth.signInWithPassword({email,password});
        if(error) throw error;
      } else if(mode==='signup'){
        if(fullName.trim().split(/\s+/).length<2) throw new Error('Veuillez entrer Prénom et Nom.\nEx : Jean Dupont');
        if(!gender) throw new Error('Veuillez sélectionner votre genre.');
        if(!promotion) throw new Error('Veuillez sélectionner votre promotion.');
        if(studentId&&!/^\d{4,8}$/.test(studentId.trim())) throw new Error('Matricule : 4 à 8 chiffres.\nEx : 42486');
        const {data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name:fullName.trim()}}});
        if(error) throw error;
        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            student_id: studentId.trim() || null,
            full_name: fullName.trim(),
            major: faculty.trim() || null,
            promotion,
            gender,
            role: 'user',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });
          if (profileError) throw profileError;
        }
        setMessage('Vérifiez votre boîte mail pour confirmer votre inscription.');
      } else {
        if(!email) throw new Error('Veuillez entrer votre email.');
        const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/settings?view=password`});
        if(error) throw error;
        setMessage('Lien de récupération envoyé par email.');
      }
    } catch(err:any){ setError(getFriendlyError(err)); }
    finally { setLoading(false); }
  };

  const isLogin=mode==='login'; const isForgot=mode==='forgot';

  const inputCls="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-uob-blue outline-none font-bold text-sm shadow-sm transition-all";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* Panneau gauche branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-dark p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-uob-blue/20 blur-[100px] rounded-full -mr-48 -mt-48"/>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-uob-red/20 blur-[100px] rounded-full -ml-48 -mb-48"/>
        <div className="relative z-10">
          <div className="w-20 h-20 mb-6 bg-uob-blue rounded-[1.5rem] flex items-center justify-center shadow-premium">
            <span className="text-white font-black text-2xl">UOB</span>
          </div>
          <h1 className="text-5xl font-extrabold text-white leading-tight italic">Le réseau<br/><span className="text-uob-blue text-6xl">académique</span><br/>de l'UOB.</h1>
          <p className="mt-6 text-slate-400 font-medium text-lg leading-relaxed">Université Officielle de Bukavu<br/><span className="text-slate-500 text-sm">Bukavu, République Démocratique du Congo</span></p>
        </div>
        <div className="relative z-10 flex items-center space-x-3 text-white/50 text-xs font-bold uppercase tracking-widest">
          <ShieldCheck size={16}/><span>Données sécurisées · Étudiants UOB</span>
        </div>
      </div>

      {/* Formulaire */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up">
          <div className="lg:hidden flex flex-col items-center mb-4">
            <div className="w-20 h-20 bg-uob-blue rounded-[1.5rem] flex items-center justify-center shadow-premium">
              <span className="text-white font-black text-2xl">UOB</span>
            </div>
            <p className="mt-2 text-xs text-slate-400 font-bold uppercase tracking-widest">Edunet · UOB</p>
          </div>
          <div className="text-center">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">
              {isForgot?'Récupération':isLogin?'Bon retour !':'Inscription'}
            </h2>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              {isForgot?'Réinitialisez votre mot de passe':isLogin?'Connectez-vous à Edunet':'Créez votre compte UOB'}
            </p>
          </div>
          <form onSubmit={handleAuth} className="mt-8 space-y-4">
            {error&&<div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 flex items-start animate-fade-in"><AlertCircle size={18} className="mr-2 shrink-0 mt-0.5"/><span className="whitespace-pre-line">{error}</span></div>}
            {message&&<div className="p-4 bg-green-50 text-green-600 rounded-2xl text-sm font-bold border border-green-100 flex items-start"><RefreshCw size={18} className="mr-2 shrink-0 mt-0.5"/><span>{message}</span></div>}

            {!isLogin&&!isForgot&&(
              <div className="grid grid-cols-1 gap-4">
                <div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input type="text" placeholder="Nom complet (Prénom Nom)" value={fullName} onChange={e=>setFullName(e.target.value)} required className={inputCls}/></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative"><Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input type="text" placeholder="Matricule (ex: 42486)" value={studentId} onChange={e=>setStudentId(e.target.value)} inputMode="numeric" pattern="\d*" className={inputCls}/></div>
                  <div className="relative">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={18}/>
                    <select value={promotion} onChange={e=>setPromotion(e.target.value)} required className={inputCls+" appearance-none cursor-pointer pr-10"}>
                      <option value="" disabled>Promotion</option>
                      <optgroup label="── Licence ──">{PROMOTIONS.filter(p=>p.cycle==='Licence').map(p=><option key={p.value} value={p.value}>{p.label}</option>)}</optgroup>
                      <optgroup label="── Master ──">{PROMOTIONS.filter(p=>p.cycle==='Master').map(p=><option key={p.value} value={p.value}>{p.label}</option>)}</optgroup>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative"><BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input type="text" placeholder="Filière (ex: Informatique)" value={faculty} onChange={e=>setFaculty(e.target.value)} required className={inputCls}/></div>
                  <div className="relative">
                    <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={18}/>
                    <select value={gender} onChange={e=>setGender(e.target.value as 'M'|'F')} required className={inputCls+" appearance-none cursor-pointer pr-10"}>
                      <option value="" disabled>Genre</option>
                      <option value="M">Homme (M)</option>
                      <option value="F">Femme (F)</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
                  </div>
                </div>
              </div>
            )}

            <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input type="email" placeholder="Adresse email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required className={inputCls}/></div>

            {!isForgot&&(
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                  <input type={showPwd?'text':'password'} placeholder="Mot de passe" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={isLogin?'current-password':'new-password'} required className={inputCls+" pr-12"}/>
                  <button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-uob-blue">
                    {showPwd?<EyeOff size={20}/>:<Eye size={20}/>}
                  </button>
                </div>
                {isLogin&&<div className="flex justify-end"><button type="button" onClick={()=>setMode('forgot')} className="text-xs font-bold text-slate-400 hover:text-uob-blue">Mot de passe oublié ?</button></div>}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full py-5 bg-uob-blue text-white font-black rounded-2xl shadow-xl shadow-uob-blue/20 flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest text-sm">
              <span>{loading?<Spinner/>:isForgot?'Envoyer le lien':isLogin?'Se connecter':"S'inscrire"}</span>
              {!loading&&<ArrowRight size={20}/>}
            </button>
          </form>
          <p className="text-center text-slate-500 font-bold text-sm">
            {isForgot?'Retour à la ':isLogin?'Nouveau étudiant UOB ?':'Déjà inscrit ?'}
            <button onClick={()=>setMode(isForgot?'login':isLogin?'signup':'login')} className="ml-2 text-uob-blue hover:underline font-black">
              {isForgot?'Connexion':isLogin?"S'inscrire":'Se connecter'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
export default AuthPage;
