import React from 'react';
interface AvatarProps { avatarUrl?: string|null; name: string; size?: 'sm'|'md'|'lg'|'xl'|'2xl'|'3xl'; className?: string; shape?: 'circle'|'square'; isOnline?: boolean; }
const SIZES = { sm:'h-8 w-8 min-w-[2rem] min-h-[2rem] text-[10px]', md:'h-10 w-10 min-w-[2.5rem] min-h-[2.5rem] text-xs', lg:'h-12 w-12 min-w-[3rem] min-h-[3rem] text-sm', xl:'h-16 w-16 min-w-[4rem] min-h-[4rem] text-lg', '2xl':'h-24 w-24 min-w-[6rem] min-h-[6rem] text-2xl', '3xl':'h-32 w-32 min-w-[8rem] min-h-[8rem] text-4xl' };
const SHAPES = { circle:'rounded-full', square:'rounded-2xl' };
const COLORS = ['bg-uob-blue','bg-uob-red','bg-indigo-500','bg-emerald-500','bg-amber-500'];
const getInitials = (n:string) => { if(!n) return '?'; const p=n.trim().split(' '); return p.length===1?p[0][0].toUpperCase():(p[0][0]+p[p.length-1][0]).toUpperCase(); };
const getColor = (s:string) => { if(!s) return COLORS[0]; let h=0; for(let i=0;i<s.length;i++) h=s.charCodeAt(i)+((h<<5)-h); return COLORS[Math.abs(h)%COLORS.length]; };
const Avatar: React.FC<AvatarProps> = ({ avatarUrl,name,size='md',className='',shape='circle',isOnline=false }) => {
  const base = `flex-shrink-0 ${SIZES[size]} ${SHAPES[shape]} ${className} shadow-sm overflow-hidden relative`;
  const dot = size==='sm'?'h-2 w-2':size==='md'?'h-2.5 w-2.5':'h-3.5 w-3.5';
  return (
    <div className="relative inline-block">
      {avatarUrl ? <img src={avatarUrl} alt={name} className={`${base} object-cover border-2 border-white`} loading="lazy"/>
        : <div className={`${base} flex items-center justify-center font-extrabold text-white border-2 border-white ${getColor(name)}`} title={name}>{getInitials(name)}</div>}
      {isOnline && <span className={`absolute bottom-0 right-0 block rounded-full bg-emerald-500 ring-2 ring-white ${dot}`}/>}
    </div>
  );
};
export default Avatar;
