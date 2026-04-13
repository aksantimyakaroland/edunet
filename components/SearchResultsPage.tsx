/**
 * @fileoverview Page de résultats de recherche — Edunet / UOB
 * @author Roland Myaka
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Profile, Group, Post } from '../types';
import Spinner from './Spinner';
import Avatar from './Avatar';
import PostCard from './Post';

type SearchResults = { users: Profile[]; groups: (Group & { member_count: number })[]; posts: Post[]; };
const PAGE_SIZE = { users: 9, groups: 9, posts: 5 };

const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResults>({ users: [], groups: [], posts: [] });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState({ users: false, groups: false, posts: false });
  const [hasMore, setHasMore] = useState({ users: true, groups: true, posts: true });
  const [activeFilter, setActiveFilter] = useState<'all' | 'users' | 'groups' | 'posts'>('all');
  const pageRef = useRef({ users: 1, groups: 1, posts: 1 });

  const fetchResults = useCallback(async (initial = true) => {
    if (!query) { setResults({ users: [], groups: [], posts: [] }); setLoading(false); return; }
    if (initial) { setLoading(true); pageRef.current = { users: 1, groups: 1, posts: 1 }; setResults({ users: [], groups: [], posts: [] }); }
    try {
      const [{ data: users }, { data: groupsRaw }, { data: posts }] = await Promise.all([
        supabase.from('profiles').select('*').ilike('full_name', `%${query}%`).range(0, PAGE_SIZE.users - 1),
        supabase.from('groups').select('*, profiles:created_by(*), group_members(count)').ilike('name', `%${query}%`).range(0, PAGE_SIZE.groups - 1),
        supabase.from('posts').select('*, profiles(*), comments(*, profiles(*)), likes(*)').ilike('content', `%${query}%`).order('created_at', { ascending: false }).range(0, PAGE_SIZE.posts - 1),
      ]);
      const groups = (groupsRaw || []).map((g: any) => ({ ...g, member_count: g.group_members[0]?.count || 0, group_members: [] }));
      setResults({ users: users || [], groups, posts: (posts as any) || [] });
      setHasMore({ users: (users || []).length === PAGE_SIZE.users, groups: groups.length === PAGE_SIZE.groups, posts: (posts || []).length === PAGE_SIZE.posts });
    } catch (e: any) { console.error(e.message); }
    finally { if (initial) setLoading(false); }
  }, [query]);

  useEffect(() => { fetchResults(true); }, [fetchResults]);

  const hasResults = useMemo(() => results.users.length > 0 || results.groups.length > 0 || results.posts.length > 0, [results]);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">
        Résultats pour : <span className="text-uob-blue">"{query}"</span>
      </h1>
      <div className="flex items-center space-x-2 my-6 border-b">
        {(['all','users','groups','posts'] as const).map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 font-semibold text-sm rounded-t-lg transition-colors ${activeFilter === f ? 'border-b-2 border-uob-blue text-uob-blue bg-uob-blue/10' : 'text-slate-500 hover:bg-slate-100'}`}>
            {f === 'all' ? 'Tout' : f === 'users' ? 'Utilisateurs' : f === 'groups' ? 'Groupes' : 'Publications'}
          </button>
        ))}
      </div>
      {loading ? <div className="flex justify-center mt-12"><Spinner/></div>
      : !hasResults ? (
        <div className="text-center bg-white p-8 rounded-lg shadow-sm border border-slate-200 mt-6">
          <h3 className="text-2xl font-semibold text-gray-700">Aucun résultat</h3>
          <p className="text-gray-500 mt-2">Essayez d'autres mots-clés.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {(activeFilter === 'all' || activeFilter === 'users') && (
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Utilisateurs ({results.users.length})</h2>
              {results.users.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.users.map(user => (
                    <Link to={`/profile/${user.id}`} key={user.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4 hover:shadow-md hover:border-uob-blue transition-all">
                      <Avatar avatarUrl={user.avatar_url} name={user.full_name} size="xl"/>
                      <div><h3 className="font-bold text-slate-800">{user.full_name}</h3><p className="text-sm text-uob-blue">{[user.promotion, user.major].filter(Boolean).join(' · ')}</p></div>
                    </Link>
                  ))}
                </div>
              ) : <div className="bg-white p-6 rounded-lg border text-center text-slate-500">Aucun utilisateur.</div>}
            </section>
          )}
          {(activeFilter === 'all' || activeFilter === 'groups') && (
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Groupes ({results.groups.length})</h2>
              {results.groups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.groups.map(g => (
                    <Link to={`/group/${g.id}`} key={g.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-uob-blue transition-all">
                      <div className="flex items-center space-x-4 mb-3">
                        <Avatar avatarUrl={g.avatar_url} name={g.name} shape="square" size="xl"/>
                        <div><h3 className="text-lg font-bold text-slate-800">{g.name}</h3><p className="text-sm text-slate-500">{g.member_count} membre(s)</p></div>
                      </div>
                      <p className="text-slate-600 text-sm line-clamp-2">{g.description}</p>
                    </Link>
                  ))}
                </div>
              ) : <div className="bg-white p-6 rounded-lg border text-center text-slate-500">Aucun groupe.</div>}
            </section>
          )}
          {(activeFilter === 'all' || activeFilter === 'posts') && (
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Publications ({results.posts.length})</h2>
              {results.posts.length > 0 ? (
                <div className="space-y-6 max-w-2xl mx-auto">
                  {results.posts.map(post => <PostCard key={post.id} post={post}/>)}
                </div>
              ) : <div className="bg-white p-6 rounded-lg border text-center text-slate-500">Aucune publication.</div>}
            </section>
          )}
        </div>
      )}
    </div>
  );
};
export default SearchResultsPage;
