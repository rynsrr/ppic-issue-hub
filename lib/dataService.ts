import { Issue, PPICId, DepartmentConfig, DEFAULT_DEPARTMENTS } from '@/types/issue';
import { supabase, isSupabaseConfigured } from './supabase';
import {
  loadIssues as loadLocalIssues,
  saveIssues as saveLocalIssues,
  loadDepartments as loadLocalDepartments,
  saveDepartments as saveLocalDepartments,
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

// Get departments and team members
export async function getDepartments(): Promise<DepartmentConfig[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('ppic_names').select('*');
      if (!error && data && data.length > 0) {
        const rowMap = new Map<string, string>();
        data.forEach((r: any) => {
          if (r.id && r.custom_name) {
            rowMap.set(r.id.trim(), r.custom_name.trim());
          }
        });

        // Match against DEFAULT_DEPARTMENTS
        const depts: DepartmentConfig[] = DEFAULT_DEPARTMENTS.map((d) => {
          const rowVal = rowMap.get(d.name);
          if (rowVal) {
            const members = rowVal.split(',').map((s) => s.trim()).filter(Boolean);
            return { ...d, members: members.length > 0 ? members : d.members };
          }
          return d;
        });

        // Include any extra departments created by user (excluding legacy PPIC 1..5 keys)
        rowMap.forEach((val, key) => {
          if (
            !/^ppic \d$/i.test(key) &&
            !depts.some((d) => d.name.toLowerCase() === key.toLowerCase())
          ) {
            const members = val.split(',').map((s) => s.trim()).filter(Boolean);
            depts.push({
              id: key.toLowerCase().replace(/\s+/g, '-'),
              name: key,
              members,
            });
          }
        });

        saveLocalDepartments(depts);
        return depts;
      }
    } catch (e) {
      console.error('Supabase getDepartments error:', e);
    }
  }
  return loadLocalDepartments();
}

// Save departments and team members
export async function saveDepartments(depts: DepartmentConfig[]): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      for (const d of depts) {
        await supabase
          .from('ppic_names')
          .upsert(
            { id: d.name, custom_name: d.members.join(', ') },
            { onConflict: 'id' }
          );
      }
    } catch (e) {
      console.error('Supabase saveDepartments error:', e);
    }
  }
  saveLocalDepartments(depts);
}

// Legacy wrappers
export async function getPpicNames(): Promise<PPICNamesMap> {
  const depts = await getDepartments();
  const map: PPICNamesMap = {};
  depts.forEach((d) => {
    map[d.name] = d.members.join(', ');
  });
  return map;
}

export async function savePpicNames(names: PPICNamesMap): Promise<void> {
  const depts: DepartmentConfig[] = Object.entries(names).map(([name, membersStr]) => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    members: membersStr.split(',').map((s) => s.trim()).filter(Boolean),
  }));
  await saveDepartments(depts);
}
