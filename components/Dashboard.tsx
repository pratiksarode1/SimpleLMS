
import React, { useState } from 'react';
import { User, ModuleId } from '../types';
import Sidebar from './Sidebar';
import { MODULES } from '../constants';
import ModuleShell from './ModuleShell';
import SystemConfig from './SystemConfig';
import SafetyModule from './SafetyModule';
import DocumentModule from './DocumentModule';
import TrainingModule from './TrainingModule';
import OrgChartModule from './OrgChartModule';
import BackupModule from './BackupModule';
import KPIsModule from './KPIsModule';
import RecordsModule from './RecordsModule';
import { Menu, Search, Bell } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardProps {
  user: User;
  activeModule: ModuleId;
  onNavigate: (id: ModuleId) => void;
  onLogout: () => void;
}

// Dummy data for the "Dashboard" overview module
const KPI_DATA = [
  { name: 'Jan', Safety: 100, Training: 95 },
  { name: 'Feb', Safety: 98, Training: 96 },
  { name: 'Mar', Safety: 100, Training: 94 },
  { name: 'Apr', Safety: 99, Training: 98 },
  { name: 'May', Safety: 100, Training: 97 },
];

const PIE_DATA = [
  { name: 'Pending', value: 12 },
  { name: 'In Progress', value: 19 },
  { name: 'Completed', value: 45 },
];
const PIE_COLORS = ['#ef4444', '#f59e0b', '#10b981'];

const Dashboard: React.FC<DashboardProps> = ({ user, activeModule, onNavigate, onLogout }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const activeModuleConfig = MODULES.find(m => m.id === activeModule) || MODULES[0];

  const renderContent = () => {
    // If it's the main dashboard view, show some charts
    if (activeModule === ModuleId.DASHBOARD) {
      return (
        <div className="animate-fadeIn space-y-6">
          <div className="mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">Welcome back, {user.name}</h1>
            <p className="text-slate-500 text-sm md:text-base">Here's what's happening at Frankston Packaging today.</p>
          </div>

          {/* Quick Stats Grid - 1 col on mobile, 2 on tablet, 4 on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: 'Pending Approvals', value: '12', color: 'bg-orange-50 text-orange-700' },
              { label: 'System Users', value: '52', color: 'bg-indigo-50 text-indigo-700' },
              { label: 'Safety Incident Free', value: '142 Days', color: 'bg-green-50 text-green-700' },
              { label: 'Training Completion', value: '94%', color: 'bg-emerald-50 text-emerald-700' },
            ].map((stat, idx) => (
              <div key={idx} className={`p-4 md:p-6 rounded-xl border border-slate-100 shadow-sm ${stat.color} bg-opacity-50`}>
                <p className="text-xs md:text-sm font-medium opacity-80 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl md:text-3xl font-bold mt-2">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Charts Row - Stacked on mobile/tablet */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Main KPI Chart */}
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Performance Trends</h3>
              <div className="h-64 md:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={KPI_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="Safety" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Training" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Pie Chart */}
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Task Status Distribution</h3>
              <div className="h-64 md:h-80 w-full flex items-center justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={PIE_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="90%"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {PIE_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeModule === ModuleId.SYSTEM_CONFIG) return <SystemConfig currentUser={user} />;
    if (activeModule === ModuleId.SAFETY) return <SafetyModule currentUser={user} />;
    if (activeModule === ModuleId.DOCUMENTS) return <DocumentModule currentUser={user} />;
    if (activeModule === ModuleId.TRAINING) return <TrainingModule currentUser={user} />;
    if (activeModule === ModuleId.RECORDS) return <RecordsModule currentUser={user} />;
    if (activeModule === ModuleId.ORG_CHART) return <OrgChartModule currentUser={user} />;
    if (activeModule === ModuleId.BACKUP) return <BackupModule currentUser={user} />;
    if (activeModule === ModuleId.KPIS) return <KPIsModule currentUser={user} />;

    return <ModuleShell module={activeModuleConfig} />;
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        activeModule={activeModule} 
        onNavigate={onNavigate} 
        onLogout={onLogout}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
              aria-label="Open Menu"
            >
              <Menu size={24} />
            </button>
            
            {/* Search Bar - Hidden on small mobile */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg text-slate-500 w-48 lg:w-64">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none outline-none text-sm w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-2 md:pl-4 border-l border-slate-200">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                <p className="text-xs text-slate-500">{user.role}</p>
              </div>
              <div className="w-8 h-8 md:w-9 md:h-9 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-sm md:text-base">
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-4 md:p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto h-full">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;