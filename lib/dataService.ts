import { Issue, PPICId } from '@/types/issue';
import { supabase, isSupabaseConfigured } from './supabase';
import {
  loadIssues as loadLocalIssues,
  saveIssues as saveLocalIssues,
  loadPPICNames as loadLocalPPICNames,
  savePPICNames as saveLocalPPICNames,
  PPICNamesMap,
  DEFAULT_PPIC_NAMES,
} from './storage';

// Fetch all issues (Supabase or LocalStorage)
export async function getIssues(): Promise<Issue[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch error, fallback to local storage:', error.message);
        return loadLocalIssues();
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        ppic: row.ppic as PPICId,
        title: row.title,
        date: row.date,
        status: row.status as 'BELUM_SELESAI' | 'SELESAI',
        createdAt: row.created_at || new Date().toISOString(),
        resolvedAt: row.resolved_at || null,
      }));
    } catch (e) {
      console.error('Supabase getIssues error:', e);
      return loadLocalIssues();
    }
  }
  return loadLocalIssues();
}

// Add issue
export async function addIssue(issue: Issue): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('issues').insert({
        id: issue.id,
        ppic: issue.ppic,
        title: issue.title,
        date: issue.date,
        status: issue.status,
        created_at: issue.createdAt,
        resolved_at: issue.resolvedAt || null,
      });
    } catch (e) {
      console.error('Supabase addIssue error:', e);
    }
  }

  // Always update local storage
  const current = loadLocalIssues();
  saveLocalIssues([issue, ...current]);
}

// Update status
export async function updateIssueStatus(
  id: string,
  newStatus: 'BELUM_SELESAI' | 'SELESAI',
  resolvedAt?: string | null
): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('issues')
        .update({
          status: newStatus,
          resolved_at: resolvedAt || null,
        })
        .eq('id', id);
    } catch (e) {
      console.error('Supabase updateIssueStatus error:', e);
    }
  }

  const current = loadLocalIssues();
  const updated = current.map((i) =>
    i.id === id ? { ...i, status: newStatus, resolvedAt: resolvedAt || null } : i
  );
  saveLocalIssues(updated);
}

// Delete issue
export async function removeIssue(id: string): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('issues').delete().eq('id', id);
    } catch (e) {
      console.error('Supabase removeIssue error:', e);
    }
  }

  const current = loadLocalIssues();
  saveLocalIssues(current.filter((i) => i.id !== id));
}

// Load custom PPIC names
export async function getPpicNames(): Promise<PPICNamesMap> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('ppic_names').select('*');
      if (!error && data && data.length > 0) {
        const map: PPICNamesMap = { ...DEFAULT_PPIC_NAMES };
        data.forEach((row: any) => {
          if (row.id && row.custom_name) {
            map[row.id as PPICId] = row.custom_name;
          }
        });
        saveLocalPPICNames(map);
        return map;
      }
    } catch (e) {
      console.error('Supabase getPpicNames error:', e);
    }
  }
  return loadLocalPPICNames();
}

// Save custom PPIC names
export async function savePpicNames(names: PPICNamesMap): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      for (const [key, value] of Object.entries(names)) {
        await supabase
          .from('ppic_names')
          .upsert({ id: key, custom_name: value }, { onConflict: 'id' });
      }
    } catch (e) {
      console.error('Supabase savePpicNames error:', e);
    }
  }
  saveLocalPPICNames(names);
}
