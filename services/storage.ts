
import { Resume, User, UserRole, JobDescription } from "../types";

const STORAGE_KEYS = {
  RESUMES: 'topres_resumes',
  USERS: 'topres_users',
  JD: 'topres_active_jd',
  CURRENT_USER: 'topres_session'
};

export const storage = {
  getResumes: (): Resume[] => {
    const data = localStorage.getItem(STORAGE_KEYS.RESUMES);
    return data ? JSON.parse(data) : [];
  },
  saveResumes: (resumes: Resume[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.RESUMES, JSON.stringify(resumes));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError') {
        throw new Error('Storage limit exceeded. Please delete some resumes or reduce file sizes.');
      }
      throw e;
    }
  },
  getUsers: (): User[] => {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!data) {
      // Set default admin to RECRUITER so the UI selector works correctly by default
      const defaultAdmin: User = { id: 'admin-0', username: 'admin', role: UserRole.RECRUITER, password: 'admin123' };
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([defaultAdmin]));
      return [defaultAdmin];
    }
    return JSON.parse(data);
  },
  saveUsers: (users: User[]) => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },
  getJD: (): JobDescription => {
    const data = localStorage.getItem(STORAGE_KEYS.JD);
    return data ? JSON.parse(data) : { title: '', content: '' };
  },
  saveJD: (jd: JobDescription) => {
    localStorage.setItem(STORAGE_KEYS.JD, JSON.stringify(jd));
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
