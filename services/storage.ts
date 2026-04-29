
import { Resume, User, UserRole, JobDescription } from "../types";
import { supabase, isSupabaseConfigured } from "../supabase";

const STORAGE_KEYS = {
  RESUMES: 'topres_resumes',
  USERS: 'topres_users',
  JD: 'topres_active_jd',
  CURRENT_USER: 'topres_session'
};

const getLocalUsers = (): User[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error reading local users:', e);
    return [];
  }
};

const saveLocalUsers = (users: User[]): void => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

const getLocalResumes = (): Resume[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESUMES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error reading local resumes:', e);
    return [];
  }
};

const saveLocalResumes = (resumes: Resume[]): void => {
  localStorage.setItem(STORAGE_KEYS.RESUMES, JSON.stringify(resumes));
};

const getLocalJDMap = (): Record<string, JobDescription> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.JD);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    console.error('Error reading local job descriptions:', e);
    return {};
  }
};

const saveLocalJDMap = (value: Record<string, JobDescription>): void => {
  localStorage.setItem(STORAGE_KEYS.JD, JSON.stringify(value));
};

// Helper to get current user ID from session
const getCurrentUserId = (): string | null => {
  const userData = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return userData ? JSON.parse(userData).id : null;
};

export const storage = {
  getResumes: async (): Promise<Resume[]> => {
    const userId = getCurrentUserId();
    if (!userId) return [];

    if (!isSupabaseConfigured) {
      return getLocalResumes().filter((r) => r.candidateId === userId);
    }

    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('candidate_id', userId)
        .order('upload_date', { ascending: false });

      if (error) throw error;

      return (data || []).map(row => ({
        id: row.id,
        candidateId: row.candidate_id,
        candidateName: row.candidate_name,
        content: row.content,
        fileData: row.file_data,
        fileName: row.file_name,
        uploadDate: row.upload_date,
        status: row.status as "Pending" | "Eligible" | "Ineligible",
        analysis: row.analysis,
      }));
    } catch (e) {
      console.error('Error fetching resumes from Supabase:', e);
      throw new Error('Failed to load resumes from database');
    }
  },

  getAllResumes: async (): Promise<Resume[]> => {
    if (!isSupabaseConfigured) {
      return getLocalResumes();
    }

    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .order('upload_date', { ascending: false });

      if (error) throw error;

      return (data || []).map(row => ({
        id: row.id,
        candidateId: row.candidate_id,
        candidateName: row.candidate_name,
        content: row.content,
        fileData: row.file_data,
        fileName: row.file_name,
        uploadDate: row.upload_date,
        status: row.status as "Pending" | "Eligible" | "Ineligible",
        analysis: row.analysis,
      }));
    } catch (e) {
      console.error('Error fetching all resumes from Supabase:', e);
      throw new Error('Failed to load resumes from database');
    }
  },

  saveResumes: async (resumes: Resume[]): Promise<void> => {
    if (!isSupabaseConfigured) {
      saveLocalResumes(resumes);
      return;
    }

    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('No user logged in');
    }

    try {
      // Delete all existing resumes for this user
      await supabase
        .from('resumes')
        .delete()
        .eq('candidate_id', userId);

      // Insert all resumes
      const rows = resumes.map(r => ({
        id: r.id,
        candidate_id: r.candidateId,
        candidate_name: r.candidateName,
        content: r.content,
        file_data: r.fileData || null,
        file_name: r.fileName || null,
        upload_date: r.uploadDate,
        status: r.status,
        analysis: r.analysis || null,
        shortlisted: r.status === 'Eligible',
      }));

      if (rows.length > 0) {
        const { error } = await supabase
          .from('resumes')
          .insert(rows);

        if (error) throw error;
      }
    } catch (e) {
      console.error('Error saving resumes to Supabase:', e);
      throw new Error('Failed to save resumes to database');
    }
  },

  getUsers: async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');

      if (error) throw error;

      const users = (data || []).map(row => ({
        id: row.id,
        username: row.username,
        password: row.password,
        role: row.role as UserRole,
      }));

      saveLocalUsers(users);
      return users;
    } catch (e) {
      console.error('Error fetching users from Supabase:', e);
      return getLocalUsers();
    }
  },

  saveUser: async (user: User): Promise<void> => {
    const upsertLocalUser = () => {
      const users = getLocalUsers();
      const existingIndex = users.findIndex(u => u.username === user.username);

      if (existingIndex >= 0) {
        users[existingIndex] = user;
      } else {
        users.push(user);
      }

      saveLocalUsers(users);
    };

    if (!isSupabaseConfigured) {
      upsertLocalUser();
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          username: user.username,
          password: user.password,
          role: user.role,
        });

      if (error) throw error;
      upsertLocalUser();
    } catch (e) {
      console.error('Error saving user to Supabase:', e);
      if (e instanceof Error) {
        throw new Error(`Supabase user save failed: ${e.message}`);
      }
      throw new Error('Supabase user save failed. Check your database policies and configuration.');
    }
  },

  getUserByUsername: async (username: string): Promise<User | null> => {
    const getLocalUserByUsername = (): User | null => {
      const users = getLocalUsers();
      return users.find(u => u.username === username) || null;
    };

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error && error.code !== 'PGRST116') {
        if (isSupabaseConfigured) {
          throw new Error(`Supabase user lookup failed: ${error.message}`);
        }
        return getLocalUserByUsername();
      }

      if (!data) return isSupabaseConfigured ? null : getLocalUserByUsername();

      const user = {
        id: data.id,
        username: data.username,
        password: data.password,
        role: data.role as UserRole,
      };

      const users = getLocalUsers();
      const existingIndex = users.findIndex(u => u.username === user.username);
      if (existingIndex >= 0) {
        users[existingIndex] = user;
      } else {
        users.push(user);
      }
      saveLocalUsers(users);

      return user;
    } catch (e) {
      console.error('Error fetching user by username:', e);
      if (isSupabaseConfigured) {
        if (e instanceof Error) {
          if (e.message.startsWith('Supabase user lookup failed:')) {
            throw e;
          }
          throw new Error(`Supabase user lookup failed: ${e.message}`);
        }
        const fallbackMessage =
          typeof e === 'object' && e !== null && 'message' in e
            ? String((e as { message?: unknown }).message || '')
            : '';
        throw new Error(
          `Supabase user lookup failed${fallbackMessage ? `: ${fallbackMessage}` : '.'}`,
        );
      }
      return getLocalUserByUsername();
    }
  },

  getJD: async (): Promise<JobDescription> => {
    const userId = getCurrentUserId();
    if (!userId) return { title: '', content: '' };

    if (!isSupabaseConfigured) {
      const map = getLocalJDMap();
      return map[userId] || { title: '', content: '' };
    }

    try {
      const { data, error } = await supabase
        .from('job_descriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

      if (data) {
        return { title: data.title, content: data.content };
      }

      return { title: '', content: '' };
    } catch (e) {
      console.error('Error fetching job description from Supabase:', e);
      return { title: '', content: '' };
    }
  },

  saveJD: async (jd: JobDescription): Promise<void> => {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('No user logged in');
    }

    if (!isSupabaseConfigured) {
      const map = getLocalJDMap();
      map[userId] = jd;
      saveLocalJDMap(map);
      return;
    }

    try {
      // Deactivate all existing JDs
      await supabase
        .from('job_descriptions')
        .update({ is_active: false })
        .eq('user_id', userId);

      // Insert new active JD
      const { error } = await supabase
        .from('job_descriptions')
        .insert({
          user_id: userId,
          title: jd.title,
          content: jd.content,
          is_active: true,
        });

      if (error) throw error;
    } catch (e) {
      console.error('Error saving job description to Supabase:', e);
      throw new Error('Failed to save job description to database');
    }
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  setCurrentUser: (user: User | null) => {
    if (user) localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
};
