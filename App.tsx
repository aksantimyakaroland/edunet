/**
 * @fileoverview Composant racine — Edunet / UOB
 * @author Roland Myaka
 */
import React, { useState, useEffect, createContext, useContext, lazy, Suspense } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './services/supabase';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Spinner from './components/Spinner';

const AuthPage           = lazy(() => import('./components/Auth'));
const Feed               = lazy(() => import('./components/Feed'));
const Profile            = lazy(() => import('./components/Profile'));
const SettingsPage       = lazy(() => import('./components/SettingsPage'));
const PostPage           = lazy(() => import('./components/PostPage'));
const GroupsPage         = lazy(() => import('./components/GroupsPage'));
const GroupPage          = lazy(() => import('./components/GroupPage'));
const ChatPage           = lazy(() => import('./components/ChatPage'));
const UsersPage          = lazy(() => import('./components/UsersPage'));
const SearchResultsPage  = lazy(() => import('./components/SearchResultsPage'));
const NotificationsPage  = lazy(() => import('./components/NotificationsPage'));
const AdminFeedbacksPage = lazy(() => import('./components/AdminFeedbacksPage'));
const FeedbackPage       = lazy(() => import('./components/FeedbackPage'));

import Navbar                 from './components/Navbar';
import TabBar                 from './components/TabBar';
import ScrollToTopButton      from './components/ScrollToTopButton';
import UnreadMessagesProvider from './components/UnreadMessagesProvider';
import NotificationsProvider  from './components/NotificationsProvider';
import InstallPWABanner       from './components/InstallPWABanner';
import CompleteProfilePopup   from './components/CompleteProfilePopup';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime:    1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// ── Auth Context ──────────────────────────────────────────
type AuthContextType = { session: Session | null; loading: boolean };
const AuthContext = createContext<AuthContextType>({ session: null, loading: true });
export const useAuth = () => useContext(AuthContext);

// ── Search Context ────────────────────────────────────────
type SearchFilterContextType = {
  searchQuery: string; setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  filterType: string;  setFilterType:  React.Dispatch<React.SetStateAction<string>>;
  sortOrder: string;   setSortOrder:   React.Dispatch<React.SetStateAction<string>>;
  isSearchActive: boolean; setIsSearchActive: React.Dispatch<React.SetStateAction<boolean>>;
};
export const SearchFilterContext = createContext<SearchFilterContextType | undefined>(undefined);
export const useSearchFilter = () => {
  const ctx = useContext(SearchFilterContext);
  if (!ctx) throw new Error('useSearchFilter hors provider');
  return ctx;
};

const SearchFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchQuery,    setSearchQuery   ] = useState('');
  const [filterType,     setFilterType    ] = useState('all');
  const [sortOrder,      setSortOrder     ] = useState('desc');
  const [isSearchActive, setIsSearchActive] = useState(false);
  return (
    <SearchFilterContext.Provider value={{ searchQuery, setSearchQuery, filterType, setFilterType, sortOrder, setSortOrder, isSearchActive, setIsSearchActive }}>
      {children}
    </SearchFilterContext.Provider>
  );
};

const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
    <div className="w-12 h-12 border-4 border-uob-blue/10 border-t-uob-blue rounded-full animate-spin"/>
    <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-300">Chargement…</p>
  </div>
);

const AppContent: React.FC = () => {
  const { session } = useAuth();
  const location    = useLocation();
  const isAuthPage         = location.pathname === '/auth';
  const isChatConversation = location.pathname.startsWith('/chat/') && location.pathname.split('/').length > 2;
  const showScrollButton   = !isAuthPage && (location.pathname === '/' || location.pathname.startsWith('/group/'));
  const showNavBars        = !isAuthPage && !isChatConversation;

  // Mise à jour du statut "en ligne" toutes les 2 minutes
  useEffect(() => {
    if (!session?.user) return;
    const update = () => supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', session.user.id);
    update();
    const iv = setInterval(update, 120_000);
    return () => clearInterval(iv);
  }, [session]);

  useEffect(() => { if (!isChatConversation) window.scrollTo(0, 0); }, [location.pathname, isChatConversation]);

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-uob-blue selection:text-white">
      {showNavBars && <Navbar />}
      <main className={`transition-all duration-500 ${
        isAuthPage ? '' :
        isChatConversation ? 'h-screen pt-0 pb-0 overflow-hidden flex flex-col' :
        'container mx-auto px-4 pt-20 sm:pt-24 pb-28 sm:pb-32'
      }`}>
        <Suspense fallback={<PageLoader />}>
          <div key={location.pathname} className={`page-transition ${isChatConversation ? 'flex-1 min-h-0 h-full' : ''}`}>
            <Routes location={location}>
              <Route path="/"                   element={<Feed />} />
              <Route path="/profile/:userId"    element={<Profile />} />
              <Route path="/post/:postId"        element={<PostPage />} />
              <Route path="/auth"               element={!session ? <AuthPage /> : <Navigate to="/" />} />
              <Route path="/groups"             element={session ? <GroupsPage />         : <Navigate to="/auth" />} />
              <Route path="/group/:groupId"     element={session ? <GroupPage />          : <Navigate to="/auth" />} />
              <Route path="/chat"               element={session ? <ChatPage />           : <Navigate to="/auth" />} />
              <Route path="/chat/:conversationId" element={session ? <ChatPage />         : <Navigate to="/auth" />} />
              <Route path="/users"              element={session ? <UsersPage />          : <Navigate to="/auth" />} />
              <Route path="/settings"           element={session ? <SettingsPage />       : <Navigate to="/auth" />} />
              <Route path="/feedback"           element={session ? <FeedbackPage />       : <Navigate to="/auth" />} />
              <Route path="/admin/feedbacks"    element={session ? <AdminFeedbacksPage /> : <Navigate to="/auth" />} />
              <Route path="/search"             element={session ? <SearchResultsPage />  : <Navigate to="/auth" />} />
              <Route path="/notifications"      element={session ? <NotificationsPage />  : <Navigate to="/auth" />} />
              <Route path="*"                   element={<Navigate to="/" />} />
            </Routes>
          </div>
        </Suspense>
      </main>
      {showNavBars && <TabBar />}
      {session && showScrollButton && <ScrollToTopButton />}
      <InstallPWABanner onComplete={() => {}} />
      {session && !isAuthPage && <NotificationsProvider />}
      {session && !isAuthPage && <CompleteProfilePopup />}
    </div>
  );
};

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => { setSession(session); setLoading(false); })
      .catch(() => setLoading(false));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); setLoading(false); });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6">
      <div className="w-32 h-32 bg-uob-blue rounded-[2.5rem] flex items-center justify-center shadow-premium mb-8 animate-pulse">
        <span className="text-white font-black text-4xl">UOB</span>
      </div>
      <Spinner />
      <p className="mt-6 text-slate-400 font-black text-xs uppercase tracking-widest animate-pulse">Chargement d'Edunet…</p>
    </div>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ session, loading }}>
        <BrowserRouter>
          <SearchFilterProvider>
            <UnreadMessagesProvider>
              <AppContent />
            </UnreadMessagesProvider>
          </SearchFilterProvider>
        </BrowserRouter>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

export default App;
