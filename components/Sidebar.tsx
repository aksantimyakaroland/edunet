/**
 * @fileoverview Sidebar droite du fil d'actualité — Edunet / UOB.
 * @author Roland Myaka
 */
import React from 'react';
import { TrendingUp, Users, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Sidebar: React.FC = () => (
  <div className="space-y-6">
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
      <div className="flex items-center space-x-2 mb-4">
        <TrendingUp className="text-uob-blue" size={20} />
        <h3 className="font-extrabold text-slate-800 uppercase tracking-wider text-xs">Sujets populaires</h3>
      </div>
      <div className="space-y-3">
        {['#InformatiqueDGestion','#UOB_Innovation','#Examens'].map(tag => (
          <div key={tag} className="group cursor-pointer">
            <p className="text-sm font-bold text-slate-700 group-hover:text-uob-blue transition-colors">{tag}</p>
            <p className="text-[10px] text-slate-400 font-medium">Publications récentes</p>
          </div>
        ))}
      </div>
    </div>
    <div className="bg-gradient-to-br from-brand-dark to-slate-800 rounded-2xl p-5 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-uob-red/20 blur-2xl" />
      <div className="relative z-10">
        <div className="flex items-center space-x-2 mb-3">
          <Calendar size={18} className="text-uob-red" />
          <h3 className="font-bold text-sm">Communauté UOB</h3>
        </div>
        <p className="text-xs font-medium text-slate-300">Rejoignez les groupes de votre filière</p>
        <Link to="/groups" className="mt-4 flex items-center text-[10px] font-extrabold text-white hover:underline">
          Voir les groupes <ArrowRight size={12} className="ml-1"/>
        </Link>
      </div>
    </div>
    <div className="px-5 text-[10px] text-slate-400 font-medium">
      <p>© 2025 Edunet · Université Officielle de Bukavu</p>
      <p className="mt-1">Développé par Roland Myaka</p>
    </div>
  </div>
);
export default Sidebar;
