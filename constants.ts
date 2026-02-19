
import { 
  Users, 
  Settings, 
  ShieldAlert, 
  GraduationCap, 
  FileText, 
  HardDrive,
  LayoutDashboard,
  BarChart3,
  FolderArchive,
  Network
} from 'lucide-react';
import { ModuleConfig, ModuleId } from './types';

// In a real app, this should be handled securely on the backend
export const SUPER_ADMIN_CODE = "431687081988";

export const APP_NAME = "Simple-LMS";
export const COMPANY_NAME = "Frankston Packaging";

export const MODULES: ModuleConfig[] = [
  {
    id: ModuleId.DASHBOARD,
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Overview of system status and key metrics.",
    color: "text-emerald-600"
  },
  {
    id: ModuleId.SYSTEM_CONFIG,
    label: "System Config",
    icon: Settings,
    description: "Configure global system settings and preferences.",
    color: "text-slate-600"
  },
  {
    id: ModuleId.SAFETY,
    label: "Safety",
    icon: ShieldAlert,
    description: "Incident reporting, safety audits, and compliance.",
    color: "text-red-600"
  },
  {
    id: ModuleId.TRAINING,
    label: "Training & Learning",
    icon: GraduationCap,
    description: "Employee training records and learning modules.",
    color: "text-emerald-600"
  },
  {
    id: ModuleId.DOCUMENTS,
    label: "Documents",
    icon: FileText,
    description: "Document control, versioning, and distribution.",
    color: "text-orange-600"
  },
  {
    id: ModuleId.RECORDS,
    label: "Records",
    icon: FolderArchive,
    description: "Quality records retention and archival.",
    color: "text-indigo-700"
  },
  {
    id: ModuleId.ORG_CHART,
    label: "Org Chart",
    icon: Network,
    description: "Visual overview of organizational structure and hierarchy.",
    color: "text-violet-600"
  },
  {
    id: ModuleId.BACKUP,
    label: "Back Up",
    icon: HardDrive,
    description: "System data backup and archiving.",
    color: "text-pink-600"
  },
  {
    id: ModuleId.KPIS,
    label: "KPIs",
    icon: BarChart3,
    description: "Track Key Performance Indicators and metrics.",
    color: "text-teal-600"
  }
];

export const NAV_ITEMS = MODULES;