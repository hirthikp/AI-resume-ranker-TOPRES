
import { 
  Beaker, Search, Cpu, Mail, User, Shield, Briefcase, 
  FileText, CheckCircle, XCircle, Zap, Users, ShieldAlert 
} from 'lucide-react';

export const COLORS = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  accent: '#6366F1',
  text: '#111827'
};

export const ICONS = {
  Lab: Beaker,
  Audit: Search,
  Neural: Zap,
  Email: Mail,
  Account: User,
  Admin: Shield,
  Work: Briefcase,
  File: FileText,
  Check: CheckCircle,
  Cross: XCircle,
  Users: Users,
  Error: ShieldAlert
};

export const DEFAULT_JD = {
  title: "Senior Product Engineer",
  content: "Join our core team to build the future of HR. We need a high-end engineer with expertise in React, TypeScript, and Generative AI pipelines. 5+ years experience required."
};
