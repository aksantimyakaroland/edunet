import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home,Users,Users2,MessageSquare } from 'lucide-react';
import { useAuth } from '../App';
import { useUnreadMessages } from './UnreadMessagesProvider';

const TabBar: React.FC = () => {
  const {session}=useAuth();
  const {unreadCount}=useUnreadMessages();
  const base='relative flex flex-col items-center justify-center text-slate-400 hover:text-uob-blue transition-all duration-200 active:scale-90 group';
  const active='text-uob-blue';
  const line='absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-uob-blue group-[.text-uob-blue]:w-8 transition-all duration-300 rounded-b-full';
  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.05)] z-40">
      <div className="container mx-auto h-full grid grid-cols-4 max-w-lg">
        <NavLink to="/" end className={({isActive})=>`${base} ${isActive?active:''}`}><div className="p-1 rounded-xl"><Home size={24}/></div><span className="text-[10px] font-black uppercase tracking-widest mt-1">Accueil</span><div className={line}/></NavLink>
        <NavLink to={session?'/groups':'/auth'} className={({isActive})=>`${base} ${isActive?active:''}`}><div className="p-1 rounded-xl"><Users size={24}/></div><span className="text-[10px] font-black uppercase tracking-widest mt-1">Groupes</span><div className={line}/></NavLink>
        <NavLink to={session?'/users':'/auth'} className={({isActive})=>`${base} ${isActive?active:''}`}><div className="p-1 rounded-xl"><Users2 size={24}/></div><span className="text-[10px] font-black uppercase tracking-widest mt-1">Membres</span><div className={line}/></NavLink>
        <NavLink to={session?'/chat':'/auth'} className={({isActive})=>`${base} ${isActive?active:''}`}>
          <div className="p-1 rounded-xl relative"><MessageSquare size={24}/>
            {unreadCount>0&&<span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-uob-red text-white text-[9px] flex items-center justify-center ring-2 ring-white font-black animate-pulse">{unreadCount>9?'9+':unreadCount}</span>}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest mt-1">Chat</span><div className={line}/>
        </NavLink>
      </div>
    </div>
  );
};
export default TabBar;
