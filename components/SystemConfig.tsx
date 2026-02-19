
import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  MapPin, 
  Building2, 
  Users as UsersIcon, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X,
  Search,
  Save,
  AlertCircle,
  Key,
  ShieldAlert,
  UserX,
  CheckCircle,
  RotateCcw,
  UserCheck,
  Settings as SettingsIcon,
  GraduationCap,
  FileText,
  FolderArchive,
  Network,
  Video,
  Folder,
  FolderOpen,
  CornerUpLeft,
  BarChart3,
  Sparkles,
  FileCog
} from 'lucide-react';
import { 
  ModuleId, SystemRole, Department, Location, User, UserRole, UserStatus, 
  SafetyGlobalConfig, DocumentTypeConfig, RecordTypeConfig, LearningResource, DocumentGlobalConfig, DocumentFolder, RecordGlobalConfig
} from '../types';
import { MODULES } from '../constants';
import { 
  ROLES, DEPARTMENTS, LOCATIONS, USERS, SAFETY_CONFIG, DOC_TYPES, RECORD_TYPES, LEARNING_RESOURCES, DOC_CONFIG, DOC_FOLDERS, DOCUMENTS, RECORD_CONFIG,
  updateRoles, updateDepartments, updateLocations, updateUsers, updateSafetyConfig, updateDocTypes, updateRecordTypes, updateLearningResources, updateDocConfig, updateDocFolders, updateDocuments, updateRecordConfig
} from '../mockData';

type ConfigTab = 
  | 'ROLES' 
  | 'DEPARTMENTS' 
  | 'LOCATIONS' 
  | 'USER_CORRECTION' 
  | 'MODULE_SETTINGS';

type ModuleSettingTab = 'SAFETY' | 'TRAINING' | 'DOCUMENTS' | 'RECORDS' | 'ORG_CHART' | 'KPIS';

interface SystemConfigProps {
  currentUser?: User;
}

const SystemConfig: React.FC<SystemConfigProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<ConfigTab>('ROLES');

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fadeIn">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-6">
        <h1 className="text-2xl font-bold text-slate-800">System Configuration</h1>
        <p className="text-slate-500 mt-1 text-sm md:text-base">Manage global settings, access control, and organizational structure.</p>
        
        <div className="flex items-center gap-6 mt-6 overflow-x-auto no-scrollbar pb-2">
          <TabButton active={activeTab === 'ROLES'} onClick={() => setActiveTab('ROLES')} icon={Shield} label="Roles & Permissions" />
          <TabButton active={activeTab === 'DEPARTMENTS'} onClick={() => setActiveTab('DEPARTMENTS')} icon={Building2} label="Departments" />
          <TabButton active={activeTab === 'LOCATIONS'} onClick={() => setActiveTab('LOCATIONS')} icon={MapPin} label="Locations" />
          <TabButton active={activeTab === 'USER_CORRECTION'} onClick={() => setActiveTab('USER_CORRECTION')} icon={UsersIcon} label="User Administration" />
          
          <div className="w-px h-6 bg-slate-200 mx-2 shrink-0"></div>

          <TabButton active={activeTab === 'MODULE_SETTINGS'} onClick={() => setActiveTab('MODULE_SETTINGS')} icon={SettingsIcon} label="Module Settings" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'ROLES' && <RolesManager currentUser={currentUser} />}
          {activeTab === 'DEPARTMENTS' && <SimpleCrudManager title="Departments" data={DEPARTMENTS} type="DEPT" />}
          {activeTab === 'LOCATIONS' && <SimpleCrudManager title="Locations" data={LOCATIONS} type="LOC" />}
          {activeTab === 'USER_CORRECTION' && currentUser && <UserCorrectionManager currentUser={currentUser} />}
          {activeTab === 'MODULE_SETTINGS' && <ModuleSettingsLayout />}
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`pb-3 flex items-center gap-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
      active ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
    }`}
  >
    <Icon size={18} />
    {label}
  </button>
);

const ModuleSettingsLayout = () => {
  const [activeSubTab, setActiveSubTab] = useState<ModuleSettingTab>('SAFETY');

  const SidebarItem = ({ id, label, icon: Icon }: { id: ModuleSettingTab, label: string, icon: any }) => (
    <button
      onClick={() => setActiveSubTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
        activeSubTab === id 
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm' 
          : 'text-slate-600 hover:bg-white hover:shadow-sm hover:text-slate-900'
      }`}
    >
      <Icon size={18} className={activeSubTab === id ? 'text-emerald-600' : 'text-slate-400'} />
      {label}
    </button>
  );

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-250px)] min-h-[600px]">
       {/* Sidebar */}
       <div className="w-full md:w-64 shrink-0 space-y-1 overflow-y-auto pr-2">
          <div className="pb-2 mb-2 border-b border-slate-200">
             <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Modules</p>
          </div>
          <SidebarItem id="SAFETY" label="Safety" icon={ShieldAlert} />
          <SidebarItem id="TRAINING" label="Training & Learning" icon={GraduationCap} />
          <SidebarItem id="DOCUMENTS" label="Documents" icon={FileText} />
          <SidebarItem id="RECORDS" label="Records" icon={FolderArchive} />
          <SidebarItem id="ORG_CHART" label="Org Chart" icon={Network} />
          <SidebarItem id="KPIS" label="KPIs & Analytics" icon={BarChart3} />
       </div>
       
       {/* Content */}
       <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          {activeSubTab === 'SAFETY' && <SafetySettings />}
          {activeSubTab === 'DOCUMENTS' && <DocumentSettings />}
          {activeSubTab === 'RECORDS' && <RecordSettings />}
          {activeSubTab === 'ORG_CHART' && <OrgChartSettings />}
          {activeSubTab === 'TRAINING' && <TrainingSettings />}
          {activeSubTab === 'KPIS' && <KpiSettings />}
       </div>
    </div>
  )
};

// --- Module Specific Settings Components ---

const KpiSettings = () => {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [widgets, setWidgets] = useState([
      { id: 1, title: 'Monthly Incident Rate', targetTab: 'Safety', source: 'Safety Incidents', type: 'Line Chart', aiInstructions: 'Show incidents per month for the current year' },
      { id: 2, title: 'Training Completion', targetTab: 'Training', source: 'Training Records', type: 'Pie Chart', aiInstructions: 'Show percentage of completed vs pending training' }
  ]);
  const [newWidget, setNewWidget] = useState({ 
    title: '', 
    targetTab: 'Overview Dashboard', 
    source: 'Safety Incidents', 
    type: 'Bar Chart',
    aiInstructions: ''
  });

  const handleAddWidget = () => {
      if(!newWidget.title) return;
      const widget = {
          id: Date.now(),
          ...newWidget
      };
      setWidgets([...widgets, widget]);
      setNewWidget({ ...newWidget, title: '', aiInstructions: '' });
  };

  const handleDeleteWidget = (id: number) => {
      if(window.confirm("Delete this widget?")) {
          setWidgets(widgets.filter(w => w.id !== id));
      }
  };

  return (
    <div className="flex flex-col h-full">
        <div className="p-6 border-b border-slate-100">
           <h3 className="text-lg font-bold text-slate-800">KPI & Analytics Settings</h3>
           <p className="text-sm text-slate-500">Manage data sources, custom widgets, and AI features.</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* AI Section */}
            <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div>
                    <h4 className="text-purple-900 font-bold flex items-center gap-2 text-lg">
                        <Sparkles size={20} className="text-purple-600" /> AI-Driven Analytics
                    </h4>
                    <p className="text-purple-700 text-sm mt-1 max-w-lg">Allow users to query data using natural language (e.g. "Show me NCRs from last week").</p>
                </div>
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-purple-100 shadow-sm">
                    <span className={`text-xs font-bold uppercase tracking-wider ${aiEnabled ? 'text-purple-700' : 'text-slate-400'}`}>{aiEnabled ? 'ENABLED' : 'DISABLED'}</span>
                    <button 
                        onClick={() => setAiEnabled(!aiEnabled)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 focus:outline-none ${aiEnabled ? 'bg-purple-600' : 'bg-slate-300'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${aiEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                </div>
            </div>

            {/* Custom KPI Library */}
            <div>
                <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-2">
                    <BarChart3 size={20} className="text-blue-600" /> Custom KPI Library
                </h4>
                <p className="text-slate-500 text-sm mb-6">Define custom charts available to users on their dashboard.</p>

                <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm mb-8">
                    <h5 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Create New Widget</h5>
                    
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Chart Title</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                                    placeholder="e.g. Supplier Performance"
                                    value={newWidget.title}
                                    onChange={e => setNewWidget({...newWidget, title: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Tab</label>
                                <select 
                                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newWidget.targetTab}
                                    onChange={e => setNewWidget({...newWidget, targetTab: e.target.value})}
                                >
                                    <option>Overview Dashboard</option>
                                    <option>Safety</option>
                                    <option>Training</option>
                                    <option>Documents</option>
                                    <option>Records</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Source Module</label>
                                <select 
                                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newWidget.source}
                                    onChange={e => setNewWidget({...newWidget, source: e.target.value})}
                                >
                                    <option>Safety Incidents</option>
                                    <option>Training Records</option>
                                    <option>Documents</option>
                                    <option>Records</option>
                                    <option>QA Inspections</option>
                                    <option>NCRs</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Chart Type</label>
                                <select 
                                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newWidget.type}
                                    onChange={e => setNewWidget({...newWidget, type: e.target.value})}
                                >
                                    <option>Bar Chart</option>
                                    <option>Line Chart</option>
                                    <option>Pie Chart</option>
                                    <option>Area Chart</option>
                                    <option>Metric Card</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">AI Instructions / Data Details</label>
                            <textarea 
                                className="w-full p-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-none" 
                                placeholder="Describe exactly what data to show (e.g. 'Show count of open CAPAs grouped by risk level for the last 6 months')"
                                value={newWidget.aiInstructions}
                                onChange={e => setNewWidget({...newWidget, aiInstructions: e.target.value})}
                            />
                            <p className="text-[10px] text-slate-400 mt-1">The system will interpret this instruction to fetch and visualize the correct data.</p>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button 
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md transition-colors flex items-center gap-2"
                                onClick={handleAddWidget}
                            >
                                <Plus size={16} /> Add Widget
                            </button>
                        </div>
                    </div>
                </div>

                {/* List of Widgets */}
                <div>
                    <h5 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Configured Widgets</h5>
                    <div className="space-y-3">
                        {widgets.length === 0 ? (
                            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
                                No custom widgets defined.
                            </div>
                        ) : widgets.map(w => (
                            <div key={w.id} className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-start shadow-sm hover:shadow-md transition-all">
                                <div>
                                    <h6 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                        {w.title}
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded border border-slate-200">{w.type}</span>
                                    </h6>
                                    <div className="flex gap-4 mt-1 text-xs text-slate-500">
                                        <span><span className="font-semibold">Tab:</span> {w.targetTab}</span>
                                        <span><span className="font-semibold">Source:</span> {w.source}</span>
                                    </div>
                                    {w.aiInstructions && (
                                        <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded border border-slate-100 italic">
                                            "{w.aiInstructions}"
                                        </p>
                                    )}
                                </div>
                                <button 
                                    onClick={() => handleDeleteWidget(w.id)}
                                    className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Widget"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

const SafetySettings = () => {
  const [config, setConfig] = useState<SafetyGlobalConfig>(SAFETY_CONFIG);

  const toggleApprover = (userId: string) => {
    const currentList = config.safetyApprovers || [];
    const newList = currentList.includes(userId) 
        ? currentList.filter(id => id !== userId)
        : [...currentList, userId];
    
    const updatedConfig = { ...config, safetyApprovers: newList };
    setConfig(updatedConfig);
    updateSafetyConfig(updatedConfig);
  };

  return (
    <div className="flex flex-col h-full">
        <div className="p-6 border-b border-slate-100">
           <h3 className="text-lg font-bold text-slate-800">Safety Module Configuration</h3>
           <p className="text-sm text-slate-500">Manage approvers for safety incidents, near misses, and observations.</p>
        </div>
        
        <div className="p-6">
            <div className="max-w-2xl">
                <h3 className="font-bold text-slate-700 mb-3 border-b pb-2 flex items-center gap-2">
                    <ShieldAlert size={16} /> Safety Approvers
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {USERS.map(u => (
                        <label key={u.id} className="flex items-center gap-3 p-3 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                            <input 
                                type="checkbox" 
                                checked={config.safetyApprovers.includes(u.id)} 
                                onChange={() => toggleApprover(u.id)} 
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" 
                            />
                            <div>
                                <span className="block text-sm font-medium text-slate-800">{u.name}</span>
                                <span className="block text-xs text-slate-500">{u.role}</span>
                            </div>
                        </label>
                    ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    Selected users will have permission to approve Incidents, acknowledge Near Misses, and close Safety Observations.
                </p>
            </div>
        </div>
    </div>
  );
};

const TrainingSettings = () => {
  const [resources, setResources] = useState<LearningResource[]>(LEARNING_RESOURCES);
  const [newRes, setNewRes] = useState<Partial<LearningResource>>({});

  const handleAdd = () => {
    if (!newRes.title || !newRes.url) return;
    const res: LearningResource = {
        id: Date.now().toString(),
        title: newRes.title,
        description: newRes.description || '',
        url: newRes.url,
        assignedRoleIds: newRes.assignedRoleIds || [],
        isSelfAssignable: newRes.isSelfAssignable || false,
        durationMinutes: 10, // Default for now
        createdAt: new Date().toISOString()
    };
    const updated = [...resources, res];
    setResources(updated);
    updateLearningResources(updated);
    setNewRes({});
  };

  const handleDelete = (id: string) => {
      const updated = resources.filter(r => r.id !== id);
      setResources(updated);
      updateLearningResources(updated);
  };

  const toggleRole = (roleId: string) => {
      const current = newRes.assignedRoleIds || [];
      const updated = current.includes(roleId) ? current.filter(id => id !== roleId) : [...current, roleId];
      setNewRes({...newRes, assignedRoleIds: updated});
  };

  return (
    <div className="flex flex-col h-full">
        <div className="p-6 border-b border-slate-100">
           <h3 className="text-lg font-bold text-slate-800">Training Configuration</h3>
           <p className="text-sm text-slate-500">Manage learning library resources and assignments.</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Add New Section */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Plus size={18} /> Add New Resource</h4>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                            <input 
                                type="text" 
                                className="w-full p-2 border border-slate-300 rounded text-sm" 
                                value={newRes.title || ''} 
                                onChange={e => setNewRes({...newRes, title: e.target.value})}
                                placeholder="e.g. GMP Basics"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">YouTube URL</label>
                            <input 
                                type="text" 
                                className="w-full p-2 border border-slate-300 rounded text-sm" 
                                value={newRes.url || ''} 
                                onChange={e => setNewRes({...newRes, url: e.target.value})}
                                placeholder="https://youtube.com/..."
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                        <textarea 
                            className="w-full p-2 border border-slate-300 rounded text-sm h-20" 
                            value={newRes.description || ''} 
                            onChange={e => setNewRes({...newRes, description: e.target.value})}
                            placeholder="Brief description of the content..."
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Assign to Roles</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {ROLES.map(role => (
                                <label key={role.id} className="flex items-center gap-2 text-sm p-2 bg-white border rounded cursor-pointer hover:bg-slate-50">
                                    <input 
                                        type="checkbox" 
                                        checked={newRes.assignedRoleIds?.includes(role.id)}
                                        onChange={() => toggleRole(role.id)}
                                        className="rounded text-emerald-600"
                                    />
                                    {role.name}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                        <input 
                            type="checkbox" 
                            id="selfAssign"
                            checked={newRes.isSelfAssignable || false}
                            onChange={e => setNewRes({...newRes, isSelfAssignable: e.target.checked})}
                            className="rounded text-emerald-600"
                        />
                        <label htmlFor="selfAssign" className="text-sm font-medium text-slate-700">Allow Self-Assignment (Visible to everyone)</label>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button onClick={handleAdd} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800">Add Resource</button>
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div>
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Video size={18} /> Existing Resources</h4>
                <div className="space-y-3">
                    {resources.map(res => (
                        <div key={res.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-1">
                                <h5 className="font-bold text-slate-800">{res.title}</h5>
                                <p className="text-xs text-slate-500 mb-1">{res.description}</p>
                                <div className="flex gap-2 text-[10px] uppercase font-bold text-slate-400">
                                    <span>{res.assignedRoleIds.length} Roles Assigned</span>
                                    {res.isSelfAssignable && <span className="text-emerald-600">• Self-Assignable</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <a href={res.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">View Link</a>
                                <button onClick={() => handleDelete(res.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {resources.length === 0 && (
                        <div className="text-center py-8 text-slate-400 italic">No resources added yet.</div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

const DocumentSettings = () => {
  const [docTypes, setDocTypes] = useState<DocumentTypeConfig[]>(DOC_TYPES);
  const [newType, setNewType] = useState<Partial<DocumentTypeConfig>>({});
  const [docConfig, setDocConfig] = useState<DocumentGlobalConfig>(DOC_CONFIG);
  
  // Folder Mgmt State
  const [folders, setFolders] = useState<DocumentFolder[]>(DOC_FOLDERS);
  const [editingFolder, setEditingFolder] = useState<DocumentFolder | null>(null);

  // Type Handlers
  const handleAddType = () => {
      if (!newType.name || !newType.prefix) return;
      const type: DocumentTypeConfig = {
          id: Date.now().toString(),
          name: newType.name,
          prefix: newType.prefix.toUpperCase()
      };
      const updated = [...docTypes, type];
      setDocTypes(updated);
      updateDocTypes(updated);
      setNewType({});
  };

  const handleDeleteType = (id: string) => {
      const updated = docTypes.filter(t => t.id !== id);
      setDocTypes(updated);
      updateDocTypes(updated);
  };

  // User Permission Handlers
  const toggleUser = (userId: string, list: 'allowedCreators' | 'changeRequestApprovers') => {
      const currentList = docConfig[list];
      const newList = currentList.includes(userId) 
          ? currentList.filter(id => id !== userId)
          : [...currentList, userId];
      
      const updatedConfig = { ...docConfig, [list]: newList };
      setDocConfig(updatedConfig);
      updateDocConfig(updatedConfig);
  };

  // Folder Handlers
  const handleSaveFolder = () => {
      if (!editingFolder || !editingFolder.name) return;
      
      const updated = folders.map(f => f.id === editingFolder.id ? editingFolder : f);
      setFolders(updated);
      updateDocFolders(updated);
      setEditingFolder(null);
  };

  const handleDeleteFolder = (id: string) => {
      if(!window.confirm("Are you sure you want to delete this folder? Any documents inside will be moved to Root.")) return;
      
      // 1. Remove folder
      const updatedFolders = folders.filter(f => f.id !== id);
      setFolders(updatedFolders);
      updateDocFolders(updatedFolders);

      // 2. Move docs to root
      const updatedDocs = DOCUMENTS.map(d => d.folderId === id ? { ...d, folderId: 'root' } : d);
      updateDocuments(updatedDocs);
  };

  return (
    <div className="flex flex-col h-full">
        <div className="p-6 border-b border-slate-100">
           <h3 className="text-lg font-bold text-slate-800">Document Settings</h3>
           <p className="text-sm text-slate-500">Configure document types, folders, and permissions.</p>
        </div>
        
        <div className="p-6 space-y-8 overflow-y-auto">
            {/* Permissions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Plus size={16} /> Allowed Document Creators</h4>
                    <p className="text-xs text-slate-500 mb-3">Users who can create new documents and folders.</p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                        {USERS.map(u => (
                            <label key={`creator-${u.id}`} className="flex items-center gap-2 text-sm p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={docConfig.allowedCreators.includes(u.id)} 
                                    onChange={() => toggleUser(u.id, 'allowedCreators')}
                                    className="rounded text-emerald-600"
                                />
                                <span className={docConfig.allowedCreators.includes(u.id) ? 'text-slate-800 font-medium' : 'text-slate-500'}>{u.name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><CheckCircle size={16} /> Change Request Approvers</h4>
                    <p className="text-xs text-slate-500 mb-3">Users who can approve document change requests.</p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                        {USERS.map(u => (
                            <label key={`approver-${u.id}`} className="flex items-center gap-2 text-sm p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={docConfig.changeRequestApprovers.includes(u.id)} 
                                    onChange={() => toggleUser(u.id, 'changeRequestApprovers')}
                                    className="rounded text-orange-600"
                                />
                                <span className={docConfig.changeRequestApprovers.includes(u.id) ? 'text-slate-800 font-medium' : 'text-slate-500'}>{u.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Folder Structure */}
            <div>
               <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><FolderOpen size={16} /> Folder Structure</h4>
               <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                          <tr>
                              <th className="px-4 py-3 font-semibold">Folder Name</th>
                              <th className="px-4 py-3 font-semibold">Parent Folder</th>
                              <th className="px-4 py-3 font-semibold text-right">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {folders.map(folder => (
                              <tr key={folder.id} className="hover:bg-slate-50">
                                  <td className="px-4 py-3 font-medium text-slate-800 flex items-center gap-2">
                                      <Folder size={16} className={folder.isSystem ? 'text-orange-400' : 'text-emerald-500'} />
                                      {folder.name}
                                      {folder.isSystem && <span className="text-[10px] uppercase font-bold text-orange-600 bg-orange-100 px-1.5 rounded">System</span>}
                                  </td>
                                  <td className="px-4 py-3 text-slate-500">
                                      {folder.parentId ? (
                                          <span className="flex items-center gap-1"><CornerUpLeft size={12}/> {folders.find(f => f.id === folder.parentId)?.name || 'Unknown'}</span>
                                      ) : <span className="text-slate-400 italic">Root</span>}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                      <button onClick={() => setEditingFolder(folder)} className="p-1 text-blue-600 hover:bg-blue-50 rounded mr-2" title="Edit / Move">
                                          <Edit2 size={16} />
                                      </button>
                                      {!folder.isSystem && (
                                          <button onClick={() => handleDeleteFolder(folder.id)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Delete">
                                              <Trash2 size={16} />
                                          </button>
                                      )}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
               </div>
            </div>

            {/* Folder Edit Modal */}
            {editingFolder && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Edit Folder</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Folder Name</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2 border border-slate-300 rounded text-sm"
                                    value={editingFolder.name}
                                    onChange={e => setEditingFolder({...editingFolder, name: e.target.value})}
                                />
                            </div>
                            {!editingFolder.isSystem && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Parent Folder (Move)</label>
                                    <select 
                                        className="w-full p-2 border border-slate-300 rounded text-sm bg-white"
                                        value={editingFolder.parentId || 'root'}
                                        onChange={e => setEditingFolder({...editingFolder, parentId: e.target.value === 'root' ? undefined : e.target.value})}
                                    >
                                        <option value="root">Root (No Parent)</option>
                                        {folders.filter(f => f.id !== editingFolder.id && f.parentId !== editingFolder.id).map(f => (
                                            <option key={f.id} value={f.id}>{f.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setEditingFolder(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                            <button onClick={handleSaveFolder} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Types */}
            <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3">Document Types</h4>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type Name</label>
                            <input 
                                type="text" 
                                placeholder="e.g. Work Instruction" 
                                className="w-full p-2 border border-slate-300 rounded text-sm"
                                value={newType.name || ''}
                                onChange={e => setNewType({...newType, name: e.target.value})}
                            />
                        </div>
                        <div className="w-32">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prefix</label>
                            <input 
                                type="text" 
                                placeholder="e.g. WI" 
                                className="w-full p-2 border border-slate-300 rounded text-sm uppercase"
                                value={newType.prefix || ''}
                                onChange={e => setNewType({...newType, prefix: e.target.value})}
                            />
                        </div>
                        <button onClick={handleAddType} className="px-4 py-2 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700">Add</button>
                    </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-slate-600">Prefix</th>
                                <th className="px-4 py-3 font-semibold text-slate-600">Name</th>
                                <th className="px-4 py-3 font-semibold text-slate-600 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {docTypes.map(dt => (
                                <tr key={dt.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-mono font-bold text-slate-700">{dt.prefix}</td>
                                    <td className="px-4 py-3 text-slate-600">{dt.name}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => handleDeleteType(dt.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
  );
};

const RecordSettings = () => {
  const [recTypes, setRecTypes] = useState<RecordTypeConfig[]>(RECORD_TYPES);
  const [newType, setNewType] = useState<Partial<RecordTypeConfig>>({});
  const [recConfig, setRecConfig] = useState<RecordGlobalConfig>(RECORD_CONFIG);

  const handleAdd = () => {
      if (!newType.name || !newType.prefix) return;
      const type: RecordTypeConfig = {
          id: Date.now().toString(),
          name: newType.name,
          prefix: newType.prefix.toUpperCase()
      };
      const updated = [...recTypes, type];
      setRecTypes(updated);
      updateRecordTypes(updated);
      setNewType({});
  };

  const handleDelete = (id: string) => {
      const updated = recTypes.filter(t => t.id !== id);
      setRecTypes(updated);
      updateRecordTypes(updated);
  };

  const toggleUser = (userId: string, list: 'allowedCreators' | 'templateManagers') => {
      const currentList = recConfig[list] || [];
      const newList = currentList.includes(userId) 
          ? currentList.filter(id => id !== userId)
          : [...currentList, userId];
      
      const updatedConfig = { ...recConfig, [list]: newList };
      setRecConfig(updatedConfig);
      updateRecordConfig(updatedConfig);
  };

  return (
    <div className="flex flex-col h-full">
        <div className="p-6 border-b border-slate-100">
           <h3 className="text-lg font-bold text-slate-800">Quality Records Settings</h3>
           <p className="text-sm text-slate-500">Configure record types, retention policies, and permissions.</p>
        </div>
        
        <div className="p-6 space-y-8 overflow-y-auto">
            {/* Permissions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Plus size={16} /> Authorized Record Creators</h4>
                    <p className="text-xs text-slate-500 mb-3">Users allowed to log new records in the system.</p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                        {USERS.map(u => (
                            <label key={`r-creator-${u.id}`} className="flex items-center gap-2 text-sm p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={(recConfig.allowedCreators || []).includes(u.id)} 
                                    onChange={() => toggleUser(u.id, 'allowedCreators')}
                                    className="rounded text-indigo-600"
                                />
                                <span className={(recConfig.allowedCreators || []).includes(u.id) ? 'text-slate-800 font-medium' : 'text-slate-500'}>{u.name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><FileCog size={16} /> Template Managers</h4>
                    <p className="text-xs text-slate-500 mb-3">Users allowed to create and edit record templates.</p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                        {USERS.map(u => (
                            <label key={`r-template-${u.id}`} className="flex items-center gap-2 text-sm p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={(recConfig.templateManagers || []).includes(u.id)} 
                                    onChange={() => toggleUser(u.id, 'templateManagers')}
                                    className="rounded text-indigo-600"
                                />
                                <span className={(recConfig.templateManagers || []).includes(u.id) ? 'text-slate-800 font-medium' : 'text-slate-500'}>{u.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Add Record Type */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-3">Add Record Type</h4>
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Maintenance Log" 
                        className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                        value={newType.name || ''}
                        onChange={e => setNewType({...newType, name: e.target.value})}
                      />
                  </div>
                  <div className="w-full sm:w-32">
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prefix</label>
                      <input 
                        type="text" 
                        placeholder="e.g. MNT" 
                        className="w-full p-2 border border-slate-300 rounded text-sm uppercase focus:ring-1 focus:ring-indigo-500 outline-none"
                        value={newType.prefix || ''}
                        onChange={e => setNewType({...newType, prefix: e.target.value})}
                      />
                  </div>
                  <button onClick={handleAdd} className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white rounded text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm">Add</button>
              </div>
            </div>

            {/* Existing Types List */}
            <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3">Existing Types</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-slate-600">Prefix</th>
                                <th className="px-4 py-3 font-semibold text-slate-600">Name</th>
                                <th className="px-4 py-3 font-semibold text-slate-600 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recTypes.map(rt => (
                                <tr key={rt.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-mono font-bold text-indigo-700">{rt.prefix}</td>
                                    <td className="px-4 py-3 text-slate-600">{rt.name}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => handleDelete(rt.id)} className="text-slate-400 hover:text-red-500 p-1 transition-colors"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
  );
};

const OrgChartSettings = () => {
  const [localUsers, setLocalUsers] = useState<User[]>(USERS);
  const [searchTerm, setSearchTerm] = useState('');

  const handleManagerChange = (userId: string, newManagerId: string) => {
    const updated = localUsers.map(u => 
      u.id === userId ? { ...u, managerId: newManagerId === 'NONE' ? undefined : newManagerId } : u
    );
    setLocalUsers(updated);
    updateUsers(updated);
  };

  return (
    <div className="flex flex-col h-full">
        <div className="p-6 border-b border-slate-100">
           <h3 className="text-lg font-bold text-slate-800">Reporting Structure</h3>
           <p className="text-sm text-slate-500">Define manager-subordinate relationships for the Org Chart.</p>
        </div>
        
        <div className="p-4 bg-slate-50 border-b border-slate-200">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search employees..." 
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0">
                    <tr>
                        <th className="px-6 py-3 font-semibold">Employee</th>
                        <th className="px-6 py-3 font-semibold">Role</th>
                        <th className="px-6 py-3 font-semibold">Reports To</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {localUsers.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map(user => {
                        const role = ROLES.find(r => r.id === user.systemRoleId);
                        return (
                            <tr key={user.id} className="hover:bg-slate-50">
                                <td className="px-6 py-3 font-medium text-slate-800 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">{user.name.charAt(0)}</div>
                                    {user.name}
                                </td>
                                <td className="px-6 py-3 text-slate-500">{role?.name || user.role}</td>
                                <td className="px-6 py-3">
                                    <select 
                                        className="w-full max-w-xs p-2 border border-slate-200 rounded bg-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={user.managerId || 'NONE'}
                                        onChange={(e) => handleManagerChange(user.id, e.target.value)}
                                    >
                                        <option value="NONE" className="text-slate-400">-- No Manager (Root) --</option>
                                        {localUsers.filter(manager => manager.id !== user.id).map(manager => (
                                            <option key={manager.id} value={manager.id}>{manager.name}</option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    </div>
  );
};

// ... RolesManager, SettingsManager, SimpleCrudManager, UserCorrectionManager remain same ...
const RolesManager = ({ currentUser }: { currentUser?: User }) => {
  const [editingRole, setEditingRole] = useState<SystemRole | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<SystemRole>>({ name: '', description: '', moduleAccess: [] });

  const handleSave = () => {
    if (!formData.name) return;
    if (editingRole) {
      const updated = ROLES.map(r => r.id === editingRole.id ? { ...r, ...formData } as SystemRole : r);
      updateRoles(updated);
      setEditingRole(null);
    } else {
      const newRole: SystemRole = {
        id: Date.now().toString(),
        name: formData.name!,
        description: formData.description,
        moduleAccess: formData.moduleAccess || []
      };
      updateRoles([...ROLES, newRole]);
      setIsCreating(false);
    }
  };

  const handleDelete = () => {
    if (!editingRole) return;
    if (window.confirm(`Are you sure you want to delete the role "${editingRole.name}"? This action cannot be undone.`)) {
      const updated = ROLES.filter(r => r.id !== editingRole.id);
      updateRoles(updated);
      setEditingRole(null);
    }
  };

  const toggleModule = (moduleId: ModuleId) => {
    const current = formData.moduleAccess || [];
    setFormData({ ...formData, moduleAccess: current.includes(moduleId) ? current.filter(m => m !== moduleId) : [...current, moduleId] });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[600px]">
      <div className="w-full lg:w-1/3 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-80 lg:h-auto">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-lg">
          <h3 className="font-semibold text-slate-700">All Roles</h3>
          <button onClick={() => { setEditingRole(null); setFormData({name: '', description: '', moduleAccess: []}); setIsCreating(true); }} className="p-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"><Plus size={16} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
          {ROLES.map(role => (
            <div key={role.id} onClick={() => { setEditingRole(role); setFormData({...role}); setIsCreating(false); }} className={`p-3 rounded-lg cursor-pointer border transition-all ${editingRole?.id === role.id ? 'border-emerald-50 bg-emerald-50' : 'border-slate-100 hover:border-emerald-200'}`}>
              <h4 className="font-medium text-slate-800">{role.name}</h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-1">{role.description}</p>
            </div>
          ))}
        </div>
      </div>

      {(editingRole || isCreating) ? (
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col h-[600px] lg:h-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-lg font-bold text-slate-800">{isCreating ? 'Create New Role' : 'Edit Role'}</h3>
            <div className="flex gap-2 w-full sm:w-auto">
              {!isCreating && currentUser?.role === UserRole.SUPER_ADMIN && (
                <button onClick={handleDelete} className="flex-1 sm:flex-none px-3 py-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 flex items-center justify-center gap-2 transition-colors">
                  <Trash2 size={16} /> Delete
                </button>
              )}
              <button onClick={() => { setEditingRole(null); setIsCreating(false); }} className="flex-1 sm:flex-none px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
              <button onClick={handleSave} className="flex-1 sm:flex-none px-4 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 flex items-center justify-center gap-2"><Save size={16} /> Save</button>
            </div>
          </div>
          <div className="space-y-4 mb-6">
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Role Name" />
            <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Description" />
          </div>
          <div className="flex-1 overflow-hidden flex flex-col">
            <label className="block text-sm font-medium text-slate-700 mb-3">Module Permissions</label>
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MODULES.filter(m => m.id !== ModuleId.LOGOUT).map(module => {
                  const isSelected = formData.moduleAccess?.includes(module.id);
                  const Icon = module.icon;
                  return (
                    <div key={module.id} onClick={() => toggleModule(module.id)} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-white border-emerald-500 shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-200'}`}>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-emerald-600 border-emerald-600' : 'border-slate-400 bg-white'}`}>{isSelected && <Check size={14} className="text-white" />}</div>
                      <div className="p-2 rounded-md bg-slate-100 text-slate-600"><Icon size={18} /></div>
                      <span className={`text-sm font-medium ${isSelected ? 'text-emerald-900' : 'text-slate-600'}`}>{module.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-lg min-h-[300px]">
          <Shield size={48} className="mb-4 opacity-20" />
          <p>Select a role to edit or create a new one</p>
        </div>
      )}
    </div>
  );
};

const SimpleCrudManager = ({ title, data, type }: { title: string, data: any[], type: 'DEPT' | 'LOC' }) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemAddress, setNewItemAddress] = useState('');

  const handleAdd = () => {
    if (!newItemName.trim()) return;
    const newItem = { id: Date.now().toString(), name: newItemName, ...(type === 'LOC' ? { address: newItemAddress } : {}) };
    if (type === 'DEPT') updateDepartments([...DEPARTMENTS, newItem]);
    if (type === 'LOC') updateLocations([...LOCATIONS, newItem]);
    setNewItemName('');
    setNewItemAddress('');
  };

  const handleDelete = (id: string) => {
    if (type === 'DEPT') updateDepartments(DEPARTMENTS.filter(i => i.id !== id));
    if (type === 'LOC') updateLocations(LOCATIONS.filter(i => i.id !== id));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-bold text-slate-800 mb-6">{title} Management</h3>
      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-slate-50 p-4 rounded-lg border border-slate-100">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder={`New ${title} Name`} className="p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
          {type === 'LOC' && <input type="text" value={newItemAddress} onChange={(e) => setNewItemAddress(e.target.value)} placeholder="Address (Optional)" className="p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none" />}
        </div>
        <button onClick={handleAdd} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-medium flex items-center gap-2 h-fit self-end md:self-auto w-full md:w-auto justify-center"><Plus size={18} /> Add</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map(item => (
          <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 text-slate-500 rounded">{type === 'DEPT' ? <Building2 size={20} /> : <MapPin size={20} />}</div>
              <div><p className="font-semibold text-slate-800">{item.name}</p>{item.address && <p className="text-sm text-slate-500">{item.address}</p>}</div>
            </div>
            <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

const UserCorrectionManager = ({ currentUser }: { currentUser: User }) => {
  const [localUsers, setLocalUsers] = useState<User[]>(USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [filter, setFilter] = useState<'ACTIVE' | 'PENDING'>('ACTIVE');
  const [passwordResetMsg, setPasswordResetMsg] = useState('');

  useEffect(() => {
    setLocalUsers(USERS);
  }, []);

  const handleUpdateUser = (id: string, updates: Partial<User>) => {
    const updated = localUsers.map(u => u.id === id ? { ...u, ...updates } : u);
    setLocalUsers(updated);
    updateUsers(updated);
    if (editingUser?.id === id) setEditingUser({ ...editingUser, ...updates });
  };

  const handlePasswordReset = () => {
    if (editingUser) {
      setPasswordResetMsg(`Reset link sent to ${editingUser.email || 'user email'}`);
      setTimeout(() => setPasswordResetMsg(''), 3000);
    }
  };

  const handleToggleStatus = () => {
    if (!editingUser) return;
    const newStatus = editingUser.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;
    handleUpdateUser(editingUser.id, { status: newStatus });
  };

  const handleDelete = () => {
    if (!editingUser) return;
    if (window.confirm("Are you sure you want to delete this user?")) {
      const updated = localUsers.filter(u => u.id !== editingUser.id);
      setLocalUsers(updated);
      updateUsers(updated);
      setEditingUser(null);
    }
  };

  const handleApprove = () => {
    if (!editingUser) return;
    handleUpdateUser(editingUser.id, { status: UserStatus.ACTIVE });
  };

  const filteredUsers = localUsers.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = false;
    if (filter === 'ACTIVE') matchesFilter = u.status === UserStatus.ACTIVE || u.status === UserStatus.INACTIVE;
    if (filter === 'PENDING') matchesFilter = u.status === UserStatus.PENDING;

    return matchesSearch && matchesFilter;
  });

  const pendingCount = localUsers.filter(u => u.status === UserStatus.PENDING).length;

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-sm border border-slate-200">
      
      {/* Header / Tabs */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-2 w-full md:w-auto">
           <button 
             onClick={() => setFilter('ACTIVE')}
             className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold text-sm transition-all ${filter === 'ACTIVE' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
           >
             Active Users
           </button>
           <button 
             onClick={() => setFilter('PENDING')}
             className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${filter === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'text-slate-500 hover:bg-slate-100'}`}
           >
             Pending <span className="px-1.5 py-0.5 bg-orange-200 text-orange-800 rounded-full text-[10px]">{pendingCount}</span>
           </button>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input 
            type="text" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="Search users..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm" 
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 sticky top-0">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4 hidden sm:table-cell">Role</th>
                <th className="px-6 py-4 hidden md:table-cell">Department</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">No users found.</td></tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className={`hover:bg-slate-50 transition-colors ${editingUser?.id === user.id ? 'bg-emerald-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">{user.name.charAt(0)}</div>
                        <div>
                          <p className="font-medium text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-400">{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell"><span className="bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200">{ROLES.find(r => r.id === user.systemRoleId)?.name || user.role}</span></td>
                    <td className="px-6 py-4 hidden md:table-cell">{DEPARTMENTS.find(d => d.id === user.departmentId)?.name || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${
                        user.status === UserStatus.ACTIVE ? 'bg-green-100 text-green-700 border-green-200' : 
                        user.status === UserStatus.INACTIVE ? 'bg-slate-100 text-slate-600 border-slate-200' :
                        user.status === UserStatus.PENDING ? 'bg-orange-100 text-orange-700 border-orange-200' :
                        'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => setEditingUser(user)} className="text-emerald-600 hover:text-emerald-800 font-medium text-xs flex items-center gap-1">
                        <Edit2 size={14} /> Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Edit Panel */}
        {editingUser && (
          <div className="absolute top-0 right-0 h-full w-full md:w-96 border-l border-slate-200 bg-slate-50 p-6 overflow-y-auto shadow-xl z-10 flex flex-col animate-slideLeft">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-bold text-slate-800 text-lg">Edit User</h4>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <div className="flex-1 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Full Name</label>
                <input 
                  type="text" 
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" 
                  value={editingUser.name} 
                  onChange={(e) => handleUpdateUser(editingUser.id, { name: e.target.value })} 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Hierarchy Role</label>
                <select className="w-full p-2.5 bg-white border border-slate-300 rounded-lg" value={editingUser.role} onChange={(e) => handleUpdateUser(editingUser.id, { role: e.target.value as UserRole })}>
                  <option value={UserRole.USER}>Standard User</option>
                  <option value={UserRole.MANAGER}>Manager</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Functional Role</label>
                <select className="w-full p-2.5 bg-white border border-slate-300 rounded-lg" value={editingUser.systemRoleId || ''} onChange={(e) => handleUpdateUser(editingUser.id, { systemRoleId: e.target.value })}>
                  <option value="">Select Role...</option>
                  {ROLES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Department</label>
                <select className="w-full p-2.5 bg-white border border-slate-300 rounded-lg" value={editingUser.departmentId || ''} onChange={(e) => handleUpdateUser(editingUser.id, { departmentId: e.target.value })}>
                  <option value="">Select Department...</option>
                  {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Plant / Location</label>
                <select className="w-full p-2.5 bg-white border border-slate-300 rounded-lg" value={editingUser.locationId || ''} onChange={(e) => handleUpdateUser(editingUser.id, { locationId: e.target.value })}>
                  <option value="">Select Location...</option>
                  {LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Reporting Manager</label>
                <select className="w-full p-2.5 bg-white border border-slate-300 rounded-lg" value={editingUser.managerId || ''} onChange={(e) => handleUpdateUser(editingUser.id, { managerId: e.target.value })}>
                  <option value="">No Manager</option>
                  {localUsers.filter(u => u.id !== editingUser.id && u.status !== UserStatus.OBSOLETE).map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-6 border-t border-slate-200 mt-6 space-y-3">
              <h5 className="text-xs font-bold text-slate-400 uppercase">Actions</h5>
              
              {editingUser.status === UserStatus.PENDING ? (
                <button onClick={handleApprove} className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 flex items-center justify-center gap-2">
                  <UserCheck size={16} /> Approve User
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={handleToggleStatus} 
                    className={`flex-1 py-2.5 rounded-lg font-bold text-xs border flex items-center justify-center gap-2 transition-colors ${
                      editingUser.status === UserStatus.ACTIVE 
                        ? 'bg-white border-red-200 text-red-600 hover:bg-red-50' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {editingUser.status === UserStatus.ACTIVE ? <><UserX size={14} /> Deactivate</> : <><RotateCcw size={14} /> Activate</>}
                  </button>
                  
                  <button 
                    onClick={handleDelete} 
                    className="flex-1 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg font-bold text-xs hover:bg-red-100 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}

              <button 
                onClick={handlePasswordReset} 
                className="w-full py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold text-xs hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
              >
                <Key size={14} /> Reset Password
              </button>

              {passwordResetMsg && (
                <div className="p-2 bg-green-100 text-green-800 text-xs rounded text-center font-semibold animate-pulse">
                  {passwordResetMsg}
                </div>
              )}

              <div className="p-3 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-700 flex gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" /> 
                Changes are saved automatically to the session.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemConfig;
