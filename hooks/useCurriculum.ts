import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { CurriculumYear, CurriculumItem } from '../types';

export const useCurriculum = () => {
  const [years, setYears] = useState<CurriculumYear[]>([]);
  const [items, setItems] = useState<CurriculumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchYears = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('curriculum_years')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setYears(data.map((y: any) => ({
        id: y.id,
        label: y.label,
        startDate: y.start_date,
        endDate: y.end_date,
        isActive: y.is_active,
        createdBy: y.created_by,
        createdAt: y.created_at
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const fetchItems = useCallback(async (yearId?: string) => {
    if (!yearId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('curriculum_items')
        .select('*')
        .eq('year_id', yearId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setItems(data.map((i: any) => ({
        id: i.id,
        yearId: i.year_id,
        subject: i.subject,
        level: i.level,
        term: i.term,
        title: i.title,
        content: i.content,
        orderIndex: i.order_index,
        status: i.status,
        publishedAt: i.published_at,
        publishedBy: i.published_by,
        createdAt: i.created_at,
        updatedAt: i.updated_at
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const upsertItem = async (item: Partial<CurriculumItem>, userId?: string) => {
    if (!item.yearId) {
      return { success: false, error: "Kein Schuljahr gefunden. Bitte stellen Sie sicher, dass ein Schuljahr angelegt und ausgewählt ist." };
    }

    try {
      const payload = {
        year_id: item.yearId,
        subject: item.subject,
        level: item.level,
        term: item.term,
        title: item.title,
        content: item.content,
        order_index: item.orderIndex || 0,
        status: item.status || 'draft',
        teacher_id: userId,
        updated_at: new Date().toISOString()
      };

      console.log("Upserting curriculum item:", payload);

      // Use upsert with onConflict for robustness
      const { data, error } = await supabase
        .from('curriculum_items')
        .upsert({ 
          ...(item.id ? { id: item.id } : {}),
          ...payload, 
          created_at: item.id ? undefined : new Date().toISOString() 
        }, { 
          onConflict: 'year_id,subject,level,term,title' 
        })
        .select();

      if (error) {
        console.error("Supabase Upsert Error:", error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error("Keine Daten vom Server zurückgegeben.");
      }

      // Refresh items and levels
      fetchItems(item.yearId);
      fetchLevels();
      return { success: true, data: data[0] };
    } catch (err) {
      console.error("Upsert Exception:", err);
      return { success: false, error: err instanceof Error ? err.message : "Unbekannter Fehler beim Speichern." };
    }
  };

  const deleteItem = async (id: string, yearId: string) => {
    try {
      const { error } = await supabase
        .from('curriculum_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchItems(yearId);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const publishItem = async (id: string, yearId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('curriculum_items')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          published_by: userId
        })
        .eq('id', id);

      if (error) throw error;
      fetchItems(yearId);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const createYear = async (label: string, startDate: string, endDate: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from('curriculum_years')
        .insert([{
          label,
          start_date: startDate,
          end_date: endDate,
          is_active: false,
          created_by: userId
        }])
        .select();

      if (error) throw error;
      fetchYears();
      return { success: true, data: data[0] };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const [availableLevels, setAvailableLevels] = useState<string[]>(['J-1/M-1', 'J-2/M-2', 'J-3/M-3', 'J-4/M-4', 'J-5/M-5', 'J-6/M-6', 'Imam Kurs', 'Ijaza Kurs', 'Ilmiyyah Kurs', 'Hifz Kurs', 'Arabisch Modul 1', 'Arabisch Modul 2', 'Arabisch Modul 3']);

  const fetchLevels = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('curriculum_items')
        .select('level');
      
      if (error) throw error;
      
      const uniqueLevels: string[] = (data || []).map((d: any) => String(d.level));
      // Core J/M levels plus specialized courses as defaults, plus whatever is in the DB
      const defaults: string[] = ['J-1/M-1', 'J-2/M-2', 'J-3/M-3', 'J-4/M-4', 'J-5/M-5', 'J-6/M-6', 'Imam Kurs', 'Ijaza Kurs', 'Ilmiyyah Kurs', 'Hifz Kurs', 'Arabisch Modul 1', 'Arabisch Modul 2', 'Arabisch Modul 3'];
      const combined: string[] = Array.from(new Set([...defaults, ...uniqueLevels]));
      setAvailableLevels(combined.sort());
    } catch (err) {
      console.error("Error fetching levels:", err);
    }
  }, []);

  useEffect(() => {
    fetchYears();
    fetchLevels();
  }, [fetchYears, fetchLevels]);

  return {
    years,
    items,
    availableLevels,
    loading,
    error,
    fetchItems,
    upsertItem,
    deleteItem,
    publishItem,
    createYear
  };
};
