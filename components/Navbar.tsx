import React,{useState,useEffect} from 'react';
import { supabase } from '../services/supabase';
import { useAuth,useSearchFilter } from '../App';
import { Link,useNavigate } from 'react-router-dom';
import { Profile } from '../types';
import { User,LogOut,Search,Bell,LayoutGrid,Settings } from 'lucide-react';
import Avatar from './Avatar';

const Navbar: React.FC = () => {
  const {session,loading:authLoading}=useAuth();
  const navigate=useNavigate();
  const {searchQuery,setSearchQuery}=useSearchFilter();
  const [profile,setProfile]=useState<Profile|null>(null);
  const [profileLoading,setProfileLoading]=useState(true);
  const [dropdownOpen,setDropdownOpen]=useState(false);
  const [unread,setUnread]=useState(0);

  const fetchProfile=async()=>{
    if(!session?.user) return;
    setProfileLoading(true);
    const {data}=await supabase.from('profiles').select('*').eq('id',session.user.id).single();
    if(data) setProfile(data as Profile);
    setProfileLoading(false);
  };

  const fetchNotifCount=async()=>{
    if(!session?.user) return;
    const {count}=await supabase.from('notifications').select('*',{count:'exact',head:true}).eq('user_id',session.user.id).eq('is_read',false);
    setUnread(count||0);
  };

  useEffect(()=>{
    if(session?.user){
      fetchProfile(); fetchNotifCount();
      const pc=supabase.channel(`nav-prof-${session.user.id}`)
        .on('postgres_changes',{event:'UPDATE',schema:'public',table:'profiles',filter:`id=eq.${session.user.id}`},p=>setProfile(p.new as Profile))
        .subscribe();
      const nc=supabase.channel(`nav-notif-${session.user.id}`)
        .on('postgres_changes',{event:'*',schema:'public',table:'notifications'},()=>fetchNotifCount())
        .subscribe();
      return ()=>{ supabase.removeChannel(pc); supabase.removeChannel(nc); };
    } else { setProfile(null); setProfileLoading(false); setUnread(0); }
  },[session]);

  const handleSignOut=async(e:React.MouseEvent)=>{
    e.preventDefault(); e.stopPropagation(); setDropdownOpen(false);
    try { await supabase.auth.signOut(); } catch(err){ console.error(err); }
    finally { navigate('/auth'); window.location.reload(); }
  };

  const isLoading=authLoading||(!!session&&profileLoading);

  return (
    <nav className="glass fixed top-0 w-full z-40 border-b border-slate-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <div className="flex items-center space-x-4 flex-1">
            <Link to="/" className="flex items-center space-x-2.5 flex-shrink-0 active:scale-95">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-uob-blue rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                <span className="text-white font-black text-xs sm:text-sm">UOB</span>
              </div>
              <span className="hidden sm:block text-xl font-black tracking-tighter text-brand-dark uppercase">Edu<span className="text-uob-blue">net</span></span>
            </Link>
            <div className="hidden md:block relative max-w-xs w-full ml-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
              <input type="search" placeholder="Rechercher étudiant ou publication…" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-slate-100/70 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-uob-blue outline-none transition-all"/>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-3">
            <Link to="/groups" className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-2xl transition-all active:scale-90"><LayoutGrid size={22}/></Link>
            <Link to="/notifications" className="relative p-2.5 text-slate-600 hover:bg-slate-100 rounded-2xl transition-all active:scale-90">
              <Bell size={22}/>
              {unread>0&&<span className="absolute top-2 right-2 flex h-4 w-4 animate-pulse"><span className="relative inline-flex rounded-full h-4 w-4 bg-uob-red text-[10px] font-bold text-white items-center justify-center border-2 border-white">{unread>9?'9+':unread}</span></span>}
            </Link>
            {isLoading?<div className="ml-2 w-10 h-10 bg-slate-100 rounded-full animate-pulse"/>
            :profile?(
              <div className="relative flex items-center pl-3 border-l border-slate-200 ml-2">
                <button onClick={()=>setDropdownOpen(!dropdownOpen)} className="flex items-center space-x-2 group active:scale-95">
                  <Avatar avatarUrl={profile.avatar_url} name={profile.full_name} size="md" className="ring-2 ring-transparent group-hover:ring-uob-blue/30"/>
                  <span className="hidden sm:block text-sm font-black text-slate-800">{profile.full_name.split(' ')[0]}</span>
                </button>
                {dropdownOpen&&(
                  <>
                    <div className="fixed inset-0 z-10" onClick={()=>setDropdownOpen(false)}/>
                    <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-3xl shadow-premium border border-slate-100 py-2 overflow-hidden animate-fade-in-up z-20">
                      <Link to={`/profile/${profile.id}`} onClick={()=>setDropdownOpen(false)} className="flex items-center px-4 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50"><User size={18} className="mr-3 text-slate-400"/>Mon profil</Link>
                      <Link to="/settings" onClick={()=>setDropdownOpen(false)} className="flex items-center px-4 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50"><Settings size={18} className="mr-3 text-slate-400"/>Paramètres</Link>
                      <div className="border-t border-slate-100 my-1 mx-2"/>
                      <button onClick={handleSignOut} className="w-full flex items-center px-4 py-3.5 text-sm font-bold text-uob-red hover:bg-red-50 text-left"><LogOut size={18} className="mr-3"/>Déconnexion</button>
                    </div>
                  </>
                )}
              </div>
            ):(
              <Link to="/auth?mode=signup" className="ml-2 bg-uob-blue text-white px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-uob-blue/20 hover:bg-blue-700 transition-all active:scale-95">Rejoindre</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;
