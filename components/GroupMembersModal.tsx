/**
 * @fileoverview Modal gestion des membres d'un groupe — Edunet / UOB
 * @author Roland Myaka
 */
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Group, GroupMember, GroupJoinRequest } from '../types';
import { X, Shield, UserX, Check, UserPlus, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import Spinner from './Spinner';
import { useAuth } from '../App';

interface Props { group: Group; initialMembers: GroupMember[]; initialRequests: GroupJoinRequest[]; isAdmin: boolean; onClose: () => void; onMembersUpdate: () => void; }

const GroupMembersModal: React.FC<Props> = ({ group, initialMembers, initialRequests, isAdmin, onClose, onMembersUpdate }) => {
  const { session } = useAuth();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [members, setMembers] = useState(initialMembers);
  const [requests, setRequests] = useState(initialRequests);
  const [activeTab, setActiveTab] = useState<'members' | 'requests'>(isAdmin && group.is_private && initialRequests.length > 0 ? 'requests' : 'members');

  useEffect(() => { setMembers(initialMembers); setRequests(initialRequests); }, [initialMembers, initialRequests]);

  const handleRoleChange = async (member: GroupMember, newRole: 'admin' | 'member') => {
    if (!isAdmin || member.user_id === group.created_by || !session?.user) return;
    setLoadingAction(member.user_id);
    let error;
    if (newRole === 'admin') {
      ({ error } = await supabase.rpc('promote_to_group_admin', { p_group_id: group.id, p_user_id: member.user_id, p_actor_id: session.user.id }));
    } else {
      ({ error } = await supabase.rpc('demote_to_group_member', { p_group_id: group.id, p_user_id: member.user_id }));
    }
    if (error) alert('Erreur : ' + error.message);
    else onMembersUpdate();
    setLoadingAction(null);
  };

  const handleRemove = async (member: GroupMember) => {
    if (!isAdmin || member.user_id === group.created_by) return;
    if (!window.confirm(`Retirer ${member.profiles.full_name} ?`)) return;
    setLoadingAction(member.user_id);
    const { error } = await supabase.from('group_members').delete().match({ group_id: group.id, user_id: member.user_id });
    if (error) alert('Erreur : ' + error.message);
    else onMembersUpdate();
    setLoadingAction(null);
  };

  const handleApprove = async (request: GroupJoinRequest) => {
    if (!session?.user || !isAdmin) return;
    setLoadingAction(request.user_id);
    const { error } = await supabase.rpc('approve_group_join_request', { p_request_id: request.id, p_admin_id: session.user.id });
    if (error) alert('Erreur : ' + error.message);
    else onMembersUpdate();
    setLoadingAction(null);
  };

  const handleReject = async (request: GroupJoinRequest) => {
    setLoadingAction(request.user_id);
    const { error } = await supabase.from('group_join_requests').delete().eq('id', request.id);
    if (error) alert('Erreur : ' + error.message);
    else onMembersUpdate();
    setLoadingAction(null);
  };

  const RoleBadge: React.FC<{ member: GroupMember }> = ({ member }) => {
    if (member.user_id === group.created_by) return <span className="text-xs font-medium bg-uob-red/10 text-uob-red rounded-full px-2 py-0.5 ml-1 flex items-center gap-1"><Crown size={12}/>Créateur</span>;
    if (member.role === 'admin') return <span className="text-xs font-medium bg-uob-blue/10 text-uob-blue rounded-full px-2 py-0.5 ml-1">Admin</span>;
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-uob-blue">Gérer le groupe</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24}/></button>
        </div>
        {isAdmin && group.is_private && (
          <div className="flex border-b mb-4">
            <button onClick={() => setActiveTab('members')} className={`px-4 py-2 font-semibold text-sm ${activeTab === 'members' ? 'border-b-2 border-uob-blue text-uob-blue' : 'text-slate-500'}`}>Membres ({members.length})</button>
            <button onClick={() => setActiveTab('requests')} className={`relative px-4 py-2 font-semibold text-sm ${activeTab === 'requests' ? 'border-b-2 border-uob-blue text-uob-blue' : 'text-slate-500'}`}>
              Demandes
              {requests.length > 0 && <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-uob-red rounded-full">{requests.length}</span>}
            </button>
          </div>
        )}
        <div className="flex-grow overflow-y-auto pr-2">
          {(activeTab === 'members' || !group.is_private) ? (
            <ul className="space-y-3">
              {members.map(member => (
                <li key={member.user_id} className="flex items-center justify-between hover:bg-slate-50 p-2 rounded-lg">
                  <Link to={`/profile/${member.user_id}`} onClick={onClose} className="flex items-center space-x-3 flex-grow min-w-0">
                    <Avatar avatarUrl={member.profiles.avatar_url} name={member.profiles.full_name}/>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-700 truncate flex items-center">{member.profiles.full_name}<RoleBadge member={member}/></p>
                      <p className="text-sm text-slate-500 truncate">{member.profiles.major || 'Étudiant UOB'}</p>
                    </div>
                  </Link>
                  {isAdmin && group.created_by !== member.user_id && (
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {loadingAction === member.user_id ? <Spinner/> : (
                        <>
                          <button onClick={() => handleRoleChange(member, member.role === 'admin' ? 'member' : 'admin')} className="p-2 rounded-full text-slate-500 hover:bg-uob-blue/10 hover:text-uob-blue" title={member.role === 'admin' ? 'Rétrograder' : 'Promouvoir admin'}><Shield size={18}/></button>
                          <button onClick={() => handleRemove(member)} className="p-2 rounded-full text-slate-500 hover:bg-red-100 hover:text-uob-red" title="Retirer"><UserX size={18}/></button>
                        </>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-3">
              {requests.length > 0 ? requests.map(req => (
                <li key={req.id} className="flex items-center justify-between hover:bg-slate-50 p-2 rounded-lg">
                  <Link to={`/profile/${req.user_id}`} onClick={onClose} className="flex items-center space-x-3 flex-grow min-w-0">
                    <Avatar avatarUrl={req.profiles.avatar_url} name={req.profiles.full_name}/>
                    <div className="min-w-0"><p className="font-semibold text-slate-700 truncate">{req.profiles.full_name}</p></div>
                  </Link>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    {loadingAction === req.user_id ? <Spinner/> : (
                      <>
                        <button onClick={() => handleApprove(req)} className="p-2 rounded-full text-slate-500 hover:bg-green-100 hover:text-green-600"><Check size={20}/></button>
                        <button onClick={() => handleReject(req)} className="p-2 rounded-full text-slate-500 hover:bg-red-100 hover:text-uob-red"><X size={20}/></button>
                      </>
                    )}
                  </div>
                </li>
              )) : (
                <div className="text-center p-6 text-slate-500"><UserPlus size={32} className="mx-auto text-slate-300 mb-2"/><p>Aucune demande en attente.</p></div>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
export default GroupMembersModal;
