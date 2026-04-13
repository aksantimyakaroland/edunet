import React,{createContext,useContext,useState,useEffect,useCallback} from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../App';
type Ctx = { unreadCount:number; fetchUnreadCount:()=>void };
const Ctx = createContext<Ctx>({unreadCount:0,fetchUnreadCount:()=>{}});
export const useUnreadMessages = () => useContext(Ctx);
const UnreadMessagesProvider: React.FC<{children:React.ReactNode}> = ({children}) => {
  const {session} = useAuth();
  const [unreadCount,setUnreadCount] = useState(0);
  const fetchUnreadCount = useCallback(async()=>{
    if(!session?.user){setUnreadCount(0);return;}
    const {data,error} = await supabase.rpc('get_unread_messages_count');
    if(error){setUnreadCount(0);}else{setUnreadCount(data??0);}
  },[session]);
  useEffect(()=>{
    fetchUnreadCount();
    const ch = supabase.channel('unread-msgs')
      .on('postgres_changes',{event:'*',schema:'public',table:'messages'},()=>setTimeout(fetchUnreadCount,250))
      .subscribe();
    return ()=>{supabase.removeChannel(ch);};
  },[fetchUnreadCount]);
  return <Ctx.Provider value={{unreadCount,fetchUnreadCount}}>{children}</Ctx.Provider>;
};
export default UnreadMessagesProvider;
