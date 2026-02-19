import React, { useState, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  Download, 
  Filter, 
  FileSpreadsheet, 
  BarChart3,
  ShieldAlert,
  GraduationCap,
  FileText,
  CheckCircle, 
  Clock,
  AlertTriangle
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { User } from '../types';
import { 
  SAFETY_INCIDENTS, 
  DOCUMENTS,
  TRAINING_RECORDS, 
  USERS, 
  LOCATIONS, 
  DEPARTMENTS 
} from '../mockData';

interface KPIsModuleProps {
  currentUser: User;
}

type KpiTab = 'SAFETY' | 'DOCUMENTS' | 'TRAINING';

const KPIsModule: React.FC<KPIsModuleProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<KpiTab>('SAFETY');
  const [filters, setFilters] = useState({
    location: 'ALL',
    department: 'ALL',
    user: 'ALL'
  });
  
  const dashboardRef = useRef<HTMLDivElement>(null);

  // --- Filtering Logic ---

  const checkUserMatch = (userId: string, recordLocationId?: string) => {
    const user = USERS.find(u => u.id === userId);
    if (!user) return false;

    // Filter by Location
    const effectiveLocationId = recordLocationId || user.locationId;
    if (filters.location !== 'ALL' && effectiveLocationId !== filters.location) {
        return false;
    }

    // Filter by Department (always based on user)
    if (filters.department !== 'ALL' && user.departmentId !== filters.department) {
        return false;
    }

    // Filter by User
    if (filters.user !== 'ALL' && user.id !== filters.user) {
        return false;
    }

    return true;
  };

  const filteredSafety = useMemo(() => {
    return SAFETY_INCIDENTS.filter(inc => 
      checkUserMatch(inc.injuredUserId, inc.locationId) || 
      checkUserMatch(inc.reportedByUserId, inc.locationId)
    );
  }, [filters]);

  const filteredDocuments = useMemo(() => {
    return DOCUMENTS.filter(doc => checkUserMatch(doc.authorId));
  }, [filters]);

  const filteredTraining = useMemo(() => {
    return TRAINING_RECORDS.filter(tr => checkUserMatch(tr.userId));
  }, [filters]);

  // --- Aggregation Logic ---

  // Safety Data
  const safetyBySeverity = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    filteredSafety.forEach(inc => {
        if (counts[inc.severity] !== undefined) counts[inc.severity]++;
    });
    return Object.keys(counts).map(k => ({ 
        name: `Sev ${k}`, 
        value: counts[k as any],
        fill: k === '1' ? '#000' : k === '2' ? '#dc2626' : k === '3' ? '#f97316' : k === '4' ? '#eab308' : '#64748b'
    }));
  }, [filteredSafety]);

  const safetyByMonth = useMemo(() => {
      const data: Record<string, number> = {};
      filteredSafety.forEach(inc => {
          const month = new Date(inc.incidentDate).toLocaleString('default', { month: 'short' });
          data[month] = (data[month] || 0) + 1;
      });
      return Object.entries(data).map(([name, count]) => ({ name, Incidents: count }));
  }, [filteredSafety]);

  // Document Data
  const docsByStatus = useMemo(() => {
      const counts: Record<string, number> = {};
      filteredDocuments.forEach(d => {
          counts[d.status] = (counts[d.status] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value], idx) => ({ 
          name: name.replace('_', ' '), 
          value,
          fill: name === 'APPROVED' ? '#10b981' : name === 'PENDING_APPROVAL' ? '#f59e0b' : name === 'DRAFT' ? '#94a3b8' : '#ef4444'
      }));
  }, [filteredDocuments]);

  const docsByType = useMemo(() => {
      const counts: Record<string, number> = {};
      filteredDocuments.forEach(d => {
          counts[d.type] = (counts[d.type] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ 
          name, 
          value,
          fill: '#f97316'
      }));
  }, [filteredDocuments]);

  // Training Data
  const trainingStatus = useMemo(() => {
      const completed = filteredTraining.filter(t => t.status === 'COMPLETED').length;
      const pending = filteredTraining.filter(t => t.status === 'PENDING').length;
      return [
          { name: 'Completed', value: completed, fill: '#10b981' },
          { name: 'Pending', value: pending, fill: '#f59e0b' }
      ];
  }, [filteredTraining]);

  // --- Export Handlers ---

  const handleExportCSV = () => {
      let csvContent = "data:text/csv;charset=utf-8,";
      let filename = `KPI_Export_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;

      if (activeTab === 'SAFETY') {
          csvContent += "ID,Report#,Date,Severity,Status,InjuredUser\n";
          filteredSafety.forEach(row => {
              csvContent += `${row.id},${row.reportNumber},${row.incidentDate},${row.severity},${row.status},${USERS.find(u=>u.id===row.injuredUserId)?.name}\n`;
          });
      } else if (activeTab === 'DOCUMENTS') {
          csvContent += "ID,Doc#,Title,Ver,Type,Status,Author,Date\n";
          filteredDocuments.forEach(row => {
              csvContent += `${row.id},${row.docNumber},"${row.title}",${row.version},${row.type},${row.status},${USERS.find(u=>u.id===row.authorId)?.name},${row.updatedAt}\n`;
          });
      } else {
          csvContent += "ID,User,Type,Status,DueDate\n";
          filteredTraining.forEach(row => {
              csvContent += `${row.id},${USERS.find(u=>u.id===row.userId)?.name},${row.type},${row.status},${row.dueDate}\n`;
          });
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
      if (!dashboardRef.current) return;
      
      try {
          const canvas = await html2canvas(dashboardRef.current, { scale: 2 });
          const imgData = canvas.toDataURL('image/png');
          
          const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`KPI_Dashboard_${activeTab}.pdf`);
      } catch (err) {
          console.error("PDF Generation failed", err);
          alert("Failed to generate PDF. Please try again.");
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fadeIn p-4 md:p-6">
        {/* Header & Controls - Improved for Mobile */}
        <div className="flex flex-col gap-6 mb-8 bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <BarChart3 className="text-teal-600" /> KPI Dashboard
                    </h1>
                    <p className="text-sm text-slate-500">Real-time metrics and performance analytics.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                        onClick={handleExportCSV}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-xs hover:bg-emerald-100 transition-colors"
                    >
                        <FileSpreadsheet size={16} /> CSV
                    </button>
                    <button 
                        onClick={handleExportPDF}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg font-bold text-xs hover:bg-slate-900 transition-colors shadow-md"
                    >
                        <Download size={16} /> PDF
                    </button>
                </div>
            </div>

            {/* Filters Row - Wrap and Stack */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Plant / Location</label>
                    <div className="relative">
                        <select 
                            className="w-full pl-2 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-medium focus:ring-2 focus:ring-teal-500 outline-none appearance-none"
                            value={filters.location}
                            onChange={e => setFilters({...filters, location: e.target.value})}
                        >
                            <option value="ALL">All Plants</option>
                            {LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                        <Filter size={14} className="absolute right-2 top-3 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Department</label>
                    <div className="relative">
                        <select 
                            className="w-full pl-2 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-medium focus:ring-2 focus:ring-teal-500 outline-none appearance-none"
                            value={filters.department}
                            onChange={e => setFilters({...filters, department: e.target.value})}
                        >
                            <option value="ALL">All Departments</option>
                            {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <Filter size={14} className="absolute right-2 top-3 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">User</label>
                    <div className="relative">
                        <select 
                            className="w-full pl-2 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-medium focus:ring-2 focus:ring-teal-500 outline-none appearance-none"
                            value={filters.user}
                            onChange={e => setFilters({...filters, user: e.target.value})}
                        >
                            <option value="ALL">All Users</option>
                            {USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                        <Filter size={14} className="absolute right-2 top-3 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>
        </div>

        {/* Tab Nav - Scrollable on Mobile */}
        <div className="flex gap-2 md:gap-4 mb-6 overflow-x-auto pb-2 no-scrollbar">
            {[
                { id: 'SAFETY', icon: ShieldAlert, label: 'Safety' },
                { id: 'DOCUMENTS', icon: FileText, label: 'Documents' },
                { id: 'TRAINING', icon: GraduationCap, label: 'Training' },
            ].map(tab => {
                const Icon = tab.icon;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as KpiTab)}
                        className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold transition-all whitespace-nowrap text-sm ${activeTab === tab.id ? 'bg-white text-teal-700 shadow-sm ring-1 ring-teal-100' : 'text-slate-500 hover:bg-white/50'}`}
                    >
                        <Icon size={18} /> {tab.label}
                    </button>
                )
            })}
        </div>

        {/* Dashboard Content */}
        <div ref={dashboardRef} className="bg-slate-50">
            
            {activeTab === 'SAFETY' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Summary Card */}
                    <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                        <h3 className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-2">Total Incidents</h3>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl md:text-5xl font-black text-slate-800">{filteredSafety.length}</span>
                            <span className="text-xs text-slate-400 mb-2 font-medium">Filtered Result</span>
                        </div>
                        <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Privacy Cases</p>
                                <p className="text-base font-bold text-slate-700">{filteredSafety.filter(i => i.isPrivacyCase).length}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Hospitalizations</p>
                                <p className="text-base font-bold text-slate-700">{filteredSafety.filter(i => i.wasHospitalizedOvernight).length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Severity Pie */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
                        <h3 className="w-full text-slate-800 font-bold mb-4 border-b border-slate-100 pb-2 text-sm">By Severity</h3>
                        <div className="w-full h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={safetyBySeverity} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                        {safetyBySeverity.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Trend Line */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                        <h3 className="w-full text-slate-800 font-bold mb-4 border-b border-slate-100 pb-2 text-sm">Monthly Trend</h3>
                        <div className="w-full h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={safetyByMonth}>
                                    <defs>
                                        <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" fontSize={10} />
                                    <YAxis fontSize={10} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="Incidents" stroke="#ef4444" fillOpacity={1} fill="url(#colorInc)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'DOCUMENTS' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-4">Quick Stats</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Total</p>
                                    <p className="text-2xl font-black text-slate-800">{filteredDocuments.length}</p>
                                </div>
                                <FileText size={20} className="text-blue-500" />
                            </div>
                            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                                <div>
                                    <p className="text-[10px] text-orange-400 uppercase font-bold">Pending</p>
                                    <p className="text-2xl font-black text-orange-600">{filteredDocuments.filter(d => d.status === 'PENDING_APPROVAL').length}</p>
                                </div>
                                <Clock size={20} className="text-orange-500" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 text-sm">Status Dist.</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={docsByStatus} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                        {docsByStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 text-sm">By Type</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={docsByType}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" tick={{fontSize: 9}} />
                                    <YAxis tick={{fontSize: 9}} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'TRAINING' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
                        <h3 className="w-full font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 text-sm">Completion Rate</h3>
                        <div className="h-64 md:h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={trainingStatus} innerRadius="60%" outerRadius="90%" paddingAngle={5} dataKey="value">
                                        {trainingStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-6 text-sm uppercase tracking-widest">Detail Metrics</h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-emerald-50 rounded-lg flex justify-between items-center border border-emerald-100">
                                <div>
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase">Completed</p>
                                    <p className="text-2xl font-black text-emerald-800">{trainingStatus[0].value}</p>
                                </div>
                                <CheckCircle size={24} className="text-emerald-300" />
                            </div>
                            <div className="p-4 bg-amber-50 rounded-lg flex justify-between items-center border border-amber-100">
                                <div>
                                    <p className="text-[10px] font-bold text-amber-600 uppercase">Pending</p>
                                    <p className="text-2xl font-black text-amber-800">{trainingStatus[1].value}</p>
                                </div>
                                <Clock size={24} className="text-amber-300" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default KPIsModule;