/**
 * @fileoverview Page de détail d'une publication — Edunet / UOB.
 * Accessible via /post/:postId — utilisée pour les liens partagés.
 * @author Roland Myaka
 */

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Post as PostType } from '../types';
import PostCard from './Post';
import Spinner from './Spinner';

const PostPage: React.FC = () => {
  const { postId }   = useParams<{ postId: string }>();
  const [searchParams] = useSearchParams();
  const openModal    = searchParams.get('openModal') === 'true';

  const [post,    setPost   ] = useState<PostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError  ] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;
    setLoading(true); setError(null);

    supabase.from('posts')
      .select('*, profiles(*), comments(*, profiles(*)), likes(*)')
      .eq('id', postId).single()
      .then(({ data, error }) => {
        if (error) setError('Publication introuvable ou erreur de récupération.');
        else setPost(data as any);
      })
      .finally(() => setLoading(false));
  }, [postId]);

  if (loading) return <div className="flex justify-center mt-8"><Spinner /></div>;

  if (error) return (
    <div className="text-center bg-white p-8 rounded-lg shadow-md mt-6 max-w-2xl mx-auto">
      <h3 className="text-2xl font-semibold text-uob-red">Erreur</h3>
      <p className="text-gray-500 mt-2">{error}</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {post ? <PostCard post={post} startWithModalOpen={openModal} /> : <p>Publication introuvable.</p>}
    </div>
  );
};

export default PostPage;
