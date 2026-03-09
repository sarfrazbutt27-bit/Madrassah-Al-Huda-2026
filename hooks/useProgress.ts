import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { CurriculumProgress } from '../types';

export const useProgress = (userId?: string) => {
  const [progress, setProgress] = useState<CurriculumProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('curriculum_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setProgress(data.map(p => ({
        userId: p.user_id,
        curriculumItemId: p.curriculum_item_id,
        isCompleted: p.is_completed,
        completedAt: p.completed_at
      })));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const toggleProgress = async (itemId: string, isCompleted: boolean) => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from('curriculum_progress')
        .upsert({
          user_id: userId,
          curriculum_item_id: itemId,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null
        });

      if (error) throw error;
      
      // Update local state
      setProgress(prev => {
        const existing = prev.find(p => p.curriculumItemId === itemId);
        if (existing) {
          return prev.map(p => p.curriculumItemId === itemId ? { ...p, isCompleted, completedAt: isCompleted ? new Date().toISOString() : undefined } : p);
        } else {
          return [...prev, { userId, curriculumItemId: itemId, isCompleted, completedAt: isCompleted ? new Date().toISOString() : undefined }];
        }
      });
      
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    progress,
    loading,
    error,
    toggleProgress,
    refreshProgress: fetchProgress
  };
};
