import React, { useState, useRef } from 'react';
import { User, ModuleId, UserRole } from '../types';
import { 
  SAFETY_INCIDENTS, DOCUMENTS, USERS, TRAINING_RECORDS, 
  QA_TICKETS, QA_INSPECTION_RECORDS, NCR_RECORDS, CUSTOMER_COMPLAINTS,
  updateSafetyIncidents, updateDocuments, updateUsers, updateTrainingRecords,
  updateQATickets, updateQAInspectionRecords, updateNcrRecords, updateCustomerComplaints
} from '../mockData';
import { 
  Download, 
  Upload, 
  Calendar, 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  FileJson, 
  RefreshCw, 
  HardDrive,
  CheckSquare,
  Square,
  Shield,
  Users as UsersIcon,
  FileText,
  GraduationCap,
  ClipboardCheck,
  FileSpreadsheet
} from 'lucide-react';

interface BackupModuleProps {
  currentUser: User;
}

const BackupModule: React.FC<BackupModuleProps> = ({ currentUser }) => {
  // Config State
  const [startDate, setStartDate] = useState<string>(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]); // Jan 1st current year
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [selectedModules, setSelectedModules] = useState<string[]>([
    'SAFETY', 'DOCUMENTS', 'TRAINING', 'QA', 'NCR', 'COMPLAINTS', 'USERS'
  ]);

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [statusMsg, setStatusMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Helpers ---

  const toggleModule = (mod: string) => {
    if (selectedModules.includes(mod)) {
      setSelectedModules(selectedModules.filter(m => m !== mod));
    } else {
      setSelectedModules([...selectedModules, mod]);
    }
  };

  const toggleAll = () => {
    if (selectedModules.length === 7) {
      setSelectedModules([]);
    } else {
      setSelectedModules(['SAFETY', 'DOCUMENTS', 'TRAINING', 'QA', 'NCR', 'COMPLAINTS', 'USERS']);
    }
  };

  const filterByDate = (data: any[], dateField: string) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime() + (24 * 60 * 60 * 1000); // Include full end day
    
    return data.filter(item => {
      if (!item[dateField]) return true; // Keep items without dates (like config)
      const itemDate = new Date(item[dateField]).getTime();
      return itemDate >= start && itemDate < end;
    });
  };

  // --- Export Logic ---

  const getFilteredData = () => {
    const data: any = {};

    if (selectedModules.includes('SAFETY')) {
      data.safetyIncidents = filterByDate(SAFETY_INCIDENTS, 'incidentDate');
    }
    if (selectedModules.includes('DOCUMENTS')) {
      data.documents = filterByDate(DOCUMENTS, 'createdAt');
    }
    if (selectedModules.includes('TRAINING')) {
      data.trainingRecords = filterByDate(TRAINING_RECORDS, 'assignedDate');
    }
    if (selectedModules.includes('QA')) {
      data.qaTickets = filterByDate(QA_TICKETS, 'createdAt');
      data.qaInspections = filterByDate(QA_INSPECTION_RECORDS, 'createdAt');
    }
    if (selectedModules.includes('NCR')) {
      data.ncrRecords = filterByDate(NCR_RECORDS, 'detectedAt');
    }
    if (selectedModules.includes('COMPLAINTS')) {
      data.complaints = filterByDate(CUSTOMER_COMPLAINTS, 'createdAt');
    }
    if (selectedModules.includes('USERS')) {
      data.users = USERS; 
    }
    return data;
  };

  const handleExportJSON = () => {
    const data = getFilteredData();
    const backupData = {
      meta: {
        version: '1.0',
        exportedBy: currentUser.name,
        date: new Date().toISOString(),
        range: { start: startDate, end: endDate }
      },
      data
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SimpleQMS_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    const data = getFilteredData();
    let csvContent = `Exported By: ${currentUser.name}\nDate: ${new Date().toISOString()}\nRange: ${startDate} to ${endDate}\n\n`;

    const processList = (title: string, list: any[]) => {
        if (!list || list.length === 0) return;
        csvContent += `--- ${title.toUpperCase()} ---\n`;
        // Get headers from first item
        const headers = Object.keys(list[0]);
        csvContent += headers.join(',') + '\n';
        
        list.forEach(item => {
            const row = headers.map(h => {
                const val = item[h];
                if (val === null || val === undefined) return '';
                // Handle objects/arrays by stringifying
                if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
                // Handle strings by escaping quotes
                return `"${String(val).replace(/"/g, '""')}"`;
            }).join(',');
            csvContent += row + '\n';
        });
        csvContent += '\n';
    };

    if (data.safetyIncidents) processList('Safety Incidents', data.safetyIncidents);
    if (data.documents) processList('Documents', data.documents);
    if (data.trainingRecords) processList('Training Records', data.trainingRecords);
    if (data.qaTickets) processList('QA Tickets', data.qaTickets);
    if (data.qaInspections) processList('QA Inspections', data.qaInspections);
    if (data.ncrRecords) processList('NCR Records', data.ncrRecords);
    if (data.complaints) processList('Customer Complaints', data.complaints);
    if (data.users) processList('Users', data.users);

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SimpleQMS_Report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Import ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
      setRestoreStatus('IDLE');
      setStatusMsg('');
    }
  };

  const handleRestore = () => {
    if (!importFile) return;
    setIsRestoring(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        
        // Validation check
        if (!json.meta || !json.data) {
          throw new Error("Invalid backup file format.");
        }

        let restoredCount = 0;

        if (json.data.safetyIncidents) {
          const filtered = filterByDate(json.data.safetyIncidents, 'incidentDate');
          updateSafetyIncidents(filtered); 
          restoredCount += filtered.length;
        }
        if (json.data.documents) {
          const filtered = filterByDate(json.data.documents, 'createdAt');
          updateDocuments(filtered);
          restoredCount += filtered.length;
        }
        if (json.data.trainingRecords) {
          const filtered = filterByDate(json.data.trainingRecords, 'assignedDate');
          updateTrainingRecords(filtered);
          restoredCount += filtered.length;
        }
        if (json.data.qaTickets) {
          const filtered = filterByDate(json.data.qaTickets, 'createdAt');
          updateQATickets(filtered);
          restoredCount += filtered.length;
        }
        if (json.data.qaInspections) {
          const filtered = filterByDate(json.data.qaInspections, 'createdAt');
          updateQAInspectionRecords(filtered);
          restoredCount += filtered.length;
        }
        if (json.data.ncrRecords) {
          const filtered = filterByDate(json.data.ncrRecords, 'detectedAt');
          updateNcrRecords(filtered);
          restoredCount += filtered.length;
        }
        if (json.data.complaints) {
          const filtered = filterByDate(json.data.complaints, 'createdAt');
          updateCustomerComplaints(filtered);
          restoredCount += filtered.length;
        }
        if (json.data.users) {
          updateUsers(json.data.users);
        }

        setRestoreStatus('SUCCESS');
        setStatusMsg(`Successfully restored data records falling between ${startDate} and ${endDate}.`);
      } catch (err) {
        console.error(err);
        setRestoreStatus('ERROR');
        setStatusMsg("Failed to parse or restore file. Ensure it is a valid JSON backup.");
      } finally {
        setIsRestoring(false);
      }
    };
    reader.readAsText(importFile);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fadeIn p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <HardDrive className="text-pink-600" /> System Backup & Restore
        </h1>
        <p className="text-slate-500 mt-1">Manage data retention, archiving, and system restoration.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Export Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Download size={20} className="text-blue-600" /> Export Data
            </h2>
          </div>
          
          <div className="p-6 space-y-6 flex-1">
            {/* Date Range */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                <Calendar size={14} /> Date Range
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-slate-400 mb-1">From</label>
                  <input 
                    type="date" 
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-400 mb-1">To</label>
                  <input 
                    type="date" 
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Modules */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Database size={14} /> Select Modules
                </label>
                <button onClick={toggleAll} className="text-xs text-blue-600 font-bold hover:underline">
                  {selectedModules.length === 7 ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'SAFETY', label: 'Safety Incidents', icon: Shield },
                  { id: 'DOCUMENTS', label: 'Documents', icon: FileText },
                  { id: 'TRAINING', label: 'Training Records', icon: GraduationCap },
                  { id: 'QA', label: 'QA Tickets & Logs', icon: ClipboardCheck },
                  { id: 'NCR', label: 'NCR Records', icon: AlertTriangle },
                  { id: 'COMPLAINTS', label: 'Customer Complaints', icon: AlertTriangle },
                  { id: 'USERS', label: 'User Accounts', icon: UsersIcon },
                ].map(mod => (
                  <div 
                    key={mod.id}
                    onClick={() => toggleModule(mod.id)}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                      ${selectedModules.includes(mod.id) ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 hover:border-blue-300'}
                    `}
                  >
                    <div className={`p-1.5 rounded ${selectedModules.includes(mod.id) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {selectedModules.includes(mod.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                    </div>
                    <span className={`text-sm font-medium ${selectedModules.includes(mod.id) ? 'text-blue-800' : 'text-slate-600'}`}>{mod.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-200">
            <div className="flex gap-4">
              <button 
                onClick={handleExportJSON}
                disabled={selectedModules.length === 0}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FileJson size={20} /> Backup (JSON)
              </button>
              <button 
                onClick={handleExportCSV}
                disabled={selectedModules.length === 0}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FileSpreadsheet size={20} /> Export (CSV)
              </button>
            </div>
            <p className="text-center text-xs text-slate-400 mt-2">
              Select JSON for system restore, or CSV for Excel/Reporting.
            </p>
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Upload size={20} className="text-emerald-600" /> Restore / Import Data
            </h2>
          </div>

          <div className="p-6 space-y-6 flex-1 flex flex-col">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
              <AlertTriangle className="text-amber-600 shrink-0" size={24} />
              <div>
                <h4 className="font-bold text-amber-800 text-sm">Warning: Data Overwrite</h4>
                <p className="text-xs text-amber-700 mt-1">
                  Restoring data will merge or overwrite existing records. 
                  The configured date range ({startDate} to {endDate}) will be applied to the IMPORTED file as well. 
                  Only records from the file that match this range will be restored.
                </p>
              </div>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-8 flex-1">
              <FileJson size={48} className={`mb-4 ${importFile ? 'text-emerald-600' : 'text-slate-300'}`} />
              
              {importFile ? (
                <div className="text-center">
                  <p className="font-bold text-slate-800">{importFile.name}</p>
                  <p className="text-xs text-slate-500">{(importFile.size / 1024).toFixed(2)} KB</p>
                  <button 
                    onClick={() => { setImportFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="text-red-500 text-xs font-bold hover:underline mt-2"
                  >
                    Remove File
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-slate-600 font-medium mb-2">Drag and drop or select a backup file (JSON)</p>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-100"
                  >
                    Browse Files
                  </button>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json" 
                onChange={handleFileChange} 
              />
            </div>

            {restoreStatus === 'SUCCESS' && (
              <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg flex items-center gap-3">
                <CheckCircle size={20} />
                <span className="text-sm font-medium">{statusMsg}</span>
              </div>
            )}
            {restoreStatus === 'ERROR' && (
              <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertTriangle size={20} />
                <span className="text-sm font-medium">{statusMsg}</span>
              </div>
            )}
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-200">
            <button 
              onClick={handleRestore}
              disabled={!importFile || isRestoring}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isRestoring ? <RefreshCw className="animate-spin" size={20} /> : <Upload size={20} />}
              {isRestoring ? 'Restoring...' : 'Restore Data from File'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BackupModule;