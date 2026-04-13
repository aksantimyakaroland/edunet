import React,{useState,useEffect} from 'react';
import { ArrowUp } from 'lucide-react';
const ScrollToTopButton: React.FC = () => {
  const [v,setV] = useState(false);
  useEffect(()=>{ const t=()=>setV(window.scrollY>300); window.addEventListener('scroll',t); return ()=>window.removeEventListener('scroll',t); },[]);
  return <button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} aria-label="Remonter" className={`fixed bottom-24 right-4 sm:right-6 bg-uob-blue text-white p-3 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none transition-all duration-300 ${v?'opacity-100 translate-y-0':'opacity-0 translate-y-4'}`}><ArrowUp size={24}/></button>;
};
export default ScrollToTopButton;
