
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  User, 
  UserRole, 
  QualityRecord, 
  QualityRecordStatus, 
  RecordTypeConfig, 
  RecordTemplate,
  DocStatus
} from '../types';
import { 
  QUALITY_RECORDS, 
  RECORD_TYPES, 
  RECORD_TEMPLATES, 
  LOCATIONS, 
  DEPARTMENTS, 
  USERS,
  DOCUMENTS,
  updateQualityRecords, 
  updateRecordTypes, 
  updateRecordTemplates 
} from '../mockData';
import { 
  FolderArchive, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  Download, 
  Settings, 
  ArrowLeft, 
  Save, 
  Trash2, 
  FileText, 
  Upload, 
  CheckCircle,
  XCircle,
  Archive,
  ClipboardList,
  User as UserIcon,
  MapPin,
  Building2,
  FileCog,
  File,
  ChevronRight,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Palette,
  Type,
  Link,
  X,
  ExternalLink
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { COMPANY_NAME } from '../constants';

interface RecordsModuleProps {
  currentUser: User;
}

type ViewMode = 'LIST' | 'EDITOR' | 'VIEWER' | 'TEMPLATES';

const RecordsModule: React.FC<RecordsModuleProps> = ({ currentUser }) => {
  const [view, setView] = useState<ViewMode>('LIST');
  const [records, setRecords] = useState<QualityRecord[]>(QUALITY_RECORDS);
  // Using imported RECORD_TYPES directly to ensure freshness
  const recordTypes = RECORD_TYPES;
  const [templates, setTemplates] = useState<RecordTemplate[]>(RECORD_TEMPLATES);
  
  const [selectedRecord, setSelectedRecord] = useState<QualityRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Global Filters
  const [filters, setFilters] = useState({
    location: 'ALL',
    department: 'ALL',
    user: 'ALL'
  });

  // Editor State
  const [editFormData, setEditFormData] = useState<Partial<QualityRecord>>({});
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Search terms for searchable selectors
  const [linkSearchTerm, setLinkSearchTerm] = useState('');
  const [approverSearchTerm, setApproverSearchTerm] = useState('');

  // Template State
  const [editingTemplate, setEditingTemplate] = useState<Partial<RecordTemplate> | null>(null);

  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;

  // --- Filtering Logic ---
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const matchesSearch = rec.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           rec.recordNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLoc = filters.location === 'ALL' || rec.locationId === filters.location;
      const matchesDept = filters.department === 'ALL' || rec.departmentId === filters.department;
      const matchesUser = filters.user === 'ALL' || rec.creatorId === filters.user;
      
      return matchesSearch && matchesLoc && matchesDept && matchesUser;
    });
  }, [records, searchTerm, filters]);

  // --- Helpers ---

  const formatContentForDisplay = (content: string | undefined) => {
    if (!content) return '';
    // Check if it looks like HTML. If not, replace newlines with <br>
    if (content.trim().startsWith('<') || content.includes('</div>') || content.includes('<br') || content.includes('</p>')) {
        return content;
    }
    return content.replace(/\n/g, '<br>');
  };

  const stripHtml = (html: string) => {
     const tmp = document.createElement("DIV");
     tmp.innerHTML = html;
     return tmp.textContent || tmp.innerText || "";
  };

  // --- Effects ---

  // Synchronize editor content when entering editor mode
  useEffect(() => {
    if (view === 'EDITOR' && editorRef.current && !editFormData.isUploadedFile) {
        // Set initial content when entering editor mode or switching docs
        editorRef.current.innerHTML = formatContentForDisplay(editFormData.content);
    }
  }, [view, editFormData.id, editFormData.isUploadedFile]);

  // --- Actions ---

  const handleStartCreate = () => {
    const defaultType = recordTypes[0]?.prefix || 'REC';
    setEditFormData({
      title: '',
      type: defaultType,
      content: '',
      isUploadedFile: false,
      retentionYears: 5,
      locationId: currentUser.locationId || '1',
      departmentId: currentUser.departmentId || '1',
      approverIds: [],
      referenceDocIds: []
    });
    setFileError('');
    setView('EDITOR');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setFileError('File size exceeds 20MB limit.');
      return;
    }
    setEditFormData({
      ...editFormData,
      isUploadedFile: true,
      content: `[FILE] ${file.name} (Archived Record)` 
    });
    setFileError('');
  };

  const handleSaveRecord = () => {
    if (!editFormData.title || !editFormData.type) return;

    const count = records.filter(r => r.type === editFormData.type).length + 1;
    const rNumber = `${editFormData.type}-${count.toString().padStart(3, '0')}`;

    const newRec: QualityRecord = {
      id: editFormData.id || Date.now().toString(),
      recordNumber: rNumber,
      title: editFormData.title,
      type: editFormData.type,
      content: editFormData.content || '',
      isUploadedFile: editFormData.isUploadedFile || false,
      creatorId: currentUser.id,
      locationId: editFormData.locationId || '1',
      departmentId: editFormData.departmentId || '1',
      status: QualityRecordStatus.ACTIVE,
      retentionYears: editFormData.retentionYears || 5,
      createdAt: editFormData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      approverIds: editFormData.approverIds || [],
      referenceDocIds: editFormData.referenceDocIds || []
    };

    const updated = [newRec, ...records.filter(r => r.id !== newRec.id)];
    setRecords(updated);
    updateQualityRecords(updated);
    setView('LIST');
  };

  const handleArchive = (id: string) => {
    const updated = records.map(r => r.id === id ? { ...r, status: QualityRecordStatus.ARCHIVED } : r);
    setRecords(updated);
    updateQualityRecords(updated);
    if (selectedRecord?.id === id) setSelectedRecord({ ...selectedRecord, status: QualityRecordStatus.ARCHIVED });
  };

  const handleDownloadPDF = (rec: QualityRecord) => {
    const doc = new jsPDF();
    const margin = 20;
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY_NAME, margin, 20);
    doc.setFontSize(12);
    doc.text("QUALITY RECORD", margin, 30);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Record #: ${rec.recordNumber}`, margin, 40);
    doc.text(`Title: ${rec.title}`, margin, 45);
    doc.text(`Created By: ${USERS.find(u=>u.id===rec.creatorId)?.name}`, margin, 50);
    doc.text(`Date: ${new Date(rec.createdAt).toLocaleString()}`, margin, 55);
    doc.line(margin, 60, 190, 60);
    doc.setFontSize(11);
    
    const cleanText = stripHtml(rec.content || "(No Content)");
    const splitText = doc.splitTextToSize(cleanText, 170);
    doc.text(splitText, margin, 70);
    doc.save(`Record_${rec.recordNumber}.pdf`);
  };

  // --- Template Handlers ---
  const handleSaveTemplate = () => {
    if (!editingTemplate || !editingTemplate.name) return;
    
    const newTpl: RecordTemplate = {
      id: editingTemplate.id || Date.now().toString(),
      name: editingTemplate.name,
      content: editingTemplate.content || ''
    };

    let updated;
    if (editingTemplate.id) {
      updated = templates.map(t => t.id === newTpl.id ? newTpl : t);
    } else {
      updated = [...templates, newTpl];
    }

    setTemplates(updated);
    updateRecordTemplates(updated);
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (id: string) => {
    if (!window.confirm("Delete this template?")) return;
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    updateRecordTemplates(updated);
    if (editingTemplate?.id === id) setEditingTemplate(null);
  };

  const handleToggleApprover = (userId: string) => {
    const current = editFormData.approverIds || [];
    const updated = current.includes(userId)
      ? current.filter(id => id !== userId)
      : [...current, userId];
    setEditFormData({ ...editFormData, approverIds: updated });
  };

  const handleToggleReference = (docId: string) => {
    const current = editFormData.referenceDocIds || [];
    const updated = current.includes(docId)
      ? current.filter(id => id !== docId)
      : [...current, docId];
    setEditFormData({ ...editFormData, referenceDocIds: updated });
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
        setEditFormData({ ...editFormData, content: editorRef.current.innerHTML });
    }
  };

  // --- Rendering ---

  const renderList = () => (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search records..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <div>
            <select 
              className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none"
              value={filters.location}
              onChange={e => setFilters({...filters, location: e.target.value})}
            >
              <option value="ALL">All Plants</option>
              {LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <select 
              className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none"
              value={filters.department}
              onChange={e => setFilters({...filters, department: e.target.value})}
            >
              <option value="ALL">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <select 
              className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none"
              value={filters.user}
              onChange={e => setFilters({...filters, user: e.target.value})}
            >
              <option value="ALL">All Users</option>
              {USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>
        
        <div className="flex justify-between sm:justify-end gap-2 border-t border-slate-100 pt-4 sm:border-0 sm:pt-0">
          <div className="flex gap-2">
            {isSuperAdmin && (
              <button 
                onClick={() => setView('TEMPLATES')} 
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-2 text-sm font-medium" 
                title="Manage Templates"
              >
                <FileText size={18} /> <span>Templates</span>
              </button>
            )}
          </div>
          <button onClick={handleStartCreate} className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-bold flex items-center gap-2 text-sm shadow-md whitespace-nowrap"><Plus size={18} /> New Record</button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                <th className="px-6 py-4 font-semibold">Record #</th>
                <th className="px-6 py-4 font-semibold">Title</th>
                <th className="px-6 py-4 font-semibold">Location</th>
                <th className="px-6 py-4 font-semibold">Creator</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filteredRecords.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600">{rec.recordNumber}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{rec.title}</td>
                    <td className="px-6 py-4 text-slate-500">{LOCATIONS.find(l=>l.id===rec.locationId)?.name}</td>
                    <td className="px-6 py-4 text-slate-500">{USERS.find(u=>u.id===rec.creatorId)?.name}</td>
                    <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase border ${rec.status === QualityRecordStatus.ACTIVE ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{rec.status}</span>
                    </td>
                    <td className="px-6 py-4">
                    <button onClick={() => { setSelectedRecord(rec); setView('VIEWER'); }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"><Eye size={18} /></button>
                    </td>
                </tr>
                ))}
                {filteredRecords.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-slate-400">No records found matching filters.</td></tr>
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );

  const renderTemplates = () => (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
        <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setView('LIST')} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ArrowLeft size={20} /></button>
            <h2 className="text-xl font-bold text-slate-800">Record Template Manager</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* List */}
            <div className="col-span-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-[500px]">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Saved Templates</h3>
                    <button onClick={() => setEditingTemplate({name: '', content: ''})} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded-lg transition-colors"><Plus size={18} /></button>
                </div>
                <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
                    {templates.map(t => (
                        <div 
                          key={t.id} 
                          className={`p-4 cursor-pointer hover:bg-slate-50 flex justify-between items-center group transition-colors ${editingTemplate?.id === t.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}
                          onClick={() => setEditingTemplate(t)}
                        >
                            <span className="text-sm font-semibold text-slate-800">{t.name}</span>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(t.id); }} className="text-slate-300 hover:text-red-500 transition-opacity opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                        </div>
                    ))}
                    {templates.length === 0 && (
                        <div className="p-8 text-center text-slate-400 italic text-sm">No templates saved.</div>
                    )}
                </div>
            </div>

            {/* Editor */}
            <div className="col-span-2 bg-white border border-slate-200 rounded-xl p-6 flex flex-col h-[500px] shadow-sm">
                {editingTemplate ? (
                    <>
                      <h3 className="font-bold text-slate-800 mb-4">{editingTemplate.id ? 'Edit Template' : 'New Template'}</h3>
                      <div className="space-y-4 flex-1 flex flex-col min-h-0">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Template Name</label>
                              <input 
                                  type="text" 
                                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                                  value={editingTemplate.name || ''}
                                  onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                                  placeholder="e.g. Weekly Cleaning Log"
                              />
                          </div>
                          <div className="flex-1 flex flex-col min-h-0">
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Default Content / Format</label>
                              <textarea 
                                  className="w-full flex-1 p-3 border border-slate-200 rounded-lg font-mono text-sm resize-none outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                                  value={editingTemplate.content || ''}
                                  onChange={e => setEditingTemplate({...editingTemplate, content: e.target.value})}
                                  placeholder="Define the structure of the record..."
                              />
                          </div>
                          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                              <button onClick={() => setEditingTemplate(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-bold transition-colors">Cancel</button>
                              <button onClick={handleSaveTemplate} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md transition-all">Save Template</button>
                          </div>
                      </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4">
                        <div className="p-4 bg-slate-50 rounded-full">
                            <FileCog size={48} className="opacity-20" />
                        </div>
                        <p className="text-sm font-medium">Select a template to edit or create a new one</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );

  const renderEditor = () => {
    // Other approved docs for reference
    const otherDocs = DOCUMENTS.filter(d => d.status === DocStatus.APPROVED);
    const filteredDocs = otherDocs.filter(d => 
        d.title.toLowerCase().includes(linkSearchTerm.toLowerCase()) || 
        d.docNumber.toLowerCase().includes(linkSearchTerm.toLowerCase())
    );

    // Filtered approvers
    const filteredApprovers = USERS.filter(u => 
        (u.role === UserRole.ADMIN || u.role === UserRole.MANAGER) &&
        u.name.toLowerCase().includes(approverSearchTerm.toLowerCase())
    );

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col h-full max-h-[calc(100vh-180px)]">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-t-xl shrink-0">
                <div className="flex items-center gap-3">
                <button onClick={() => setView('LIST')} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><ArrowLeft size={20} /></button>
                <h2 className="text-base md:text-lg font-bold text-slate-800">New Quality Record</h2>
                </div>
                <button onClick={handleSaveRecord} className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg"><Save size={18} /> Save Record</button>
            </div>
            
            <div className="p-4 md:p-8 space-y-6 overflow-y-auto flex-1">
                {/* Header Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Record Title</label>
                        <input type="text" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" value={editFormData.title} onChange={e=>setEditFormData({...editFormData, title: e.target.value})} placeholder="e.g. Press #1 Cleanup Log" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Record Type</label>
                        <select className="w-full p-3 border border-slate-200 rounded-xl bg-white outline-none shadow-sm" value={editFormData.type} onChange={e=>setEditFormData({...editFormData, type: e.target.value})}>
                            {recordTypes.map(t=><option key={t.id} value={t.prefix}>{t.name} ({t.prefix})</option>)}
                        </select>
                    </div>
                </div>

                {/* Sub Header (Meta) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                    <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Location</label><select className="w-full p-3 border border-slate-200 rounded-xl bg-white shadow-sm" value={editFormData.locationId} onChange={e=>setEditFormData({...editFormData, locationId: e.target.value})}>{LOCATIONS.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
                    <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Department</label><select className="w-full p-3 border border-slate-200 rounded-xl bg-white shadow-sm" value={editFormData.departmentId} onChange={e=>setEditFormData({...editFormData, departmentId: e.target.value})}>{DEPARTMENTS.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                    <div><label className="block text-xs font-bold text-slate-400 uppercase mb-2">Retention (Years)</label><input type="number" className="w-full p-3 border border-slate-200 rounded-xl bg-white shadow-sm" value={editFormData.retentionYears} onChange={e=>setEditFormData({...editFormData, retentionYears: parseInt(e.target.value)})} /></div>
                </div>

                {/* Advanced Header Sections (Approvers & Links) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Approvers / Stakeholders</label>
                        <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm flex flex-wrap gap-2 min-h-[44px] shadow-inner">
                            {editFormData.approverIds?.map(id => {
                                const u = USERS.find(user => user.id === id);
                                return u ? (
                                    <span key={id} className="px-2 py-1 bg-white border border-slate-200 rounded-md flex items-center gap-1 shadow-sm font-medium">
                                        {u.name}
                                        <button onClick={() => handleToggleApprover(id)} className="text-slate-400 hover:text-red-500 ml-1"><X size={12}/></button>
                                    </span>
                                ) : null;
                            })}

                            <div className="relative group">
                                <div className="flex items-center gap-2 border border-slate-200 bg-white rounded-md px-2 py-1 shadow-sm group-focus-within:ring-2 group-focus-within:ring-indigo-500/20">
                                    <Search size={12} className="text-slate-400" />
                                    <input 
                                        type="text" 
                                        className="bg-transparent border-none outline-none text-xs w-24" 
                                        placeholder="Add User..." 
                                        value={approverSearchTerm}
                                        onChange={e => setApproverSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-300 shadow-xl rounded-lg max-h-48 overflow-y-auto hidden group-focus-within:block z-30 p-1">
                                    {filteredApprovers.length === 0 ? <p className="p-2 text-[10px] text-slate-400 text-center">No matching users</p> : 
                                        filteredApprovers.map(u => (
                                            <button 
                                                key={u.id} 
                                                onClick={() => { handleToggleApprover(u.id); setApproverSearchTerm(''); }}
                                                className={`w-full text-left p-2 rounded text-xs hover:bg-slate-50 flex justify-between items-center ${editFormData.approverIds?.includes(u.id) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}
                                            >
                                                <span><b>{u.name}</b></span>
                                                {editFormData.approverIds?.includes(u.id) && <CheckCircle size={10} />}
                                            </button>
                                        ))
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Reference SOPs / Forms</label>
                        <div className="p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm min-h-[44px] shadow-inner">
                            <div className="flex flex-wrap gap-2 mb-2">
                                {editFormData.referenceDocIds?.map(rid => {
                                    const rd = DOCUMENTS.find(d => d.id === rid);
                                    return rd ? (
                                        <span key={rid} className="px-2 py-1 bg-white border border-slate-200 rounded-md shadow-sm flex items-center gap-2 text-xs font-medium text-slate-700">
                                            <Link size={10} className="text-slate-400" />
                                            {rd.docNumber}
                                            <button onClick={() => handleToggleReference(rid)} className="text-slate-400 hover:text-red-500"><X size={12}/></button>
                                        </span>
                                    ) : null;
                                })}
                            </div>
                            <div className="relative group">
                                <div className="flex items-center gap-2 border border-slate-200 bg-white rounded-md px-2 py-1 shadow-sm group-focus-within:ring-2 group-focus-within:ring-indigo-500/20">
                                    <Search size={12} className="text-slate-400" />
                                    <input 
                                        type="text" 
                                        className="bg-transparent border-none outline-none text-xs w-full" 
                                        placeholder="Link SOP or Instruction..." 
                                        value={linkSearchTerm}
                                        onChange={e => setLinkSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-300 shadow-xl rounded-lg max-h-48 overflow-y-auto hidden group-focus-within:block z-30 p-1">
                                    {filteredDocs.length === 0 ? <p className="p-2 text-[10px] text-slate-400 text-center">No approved docs found</p> : 
                                        filteredDocs.map(d => (
                                            <button 
                                                key={d.id} 
                                                onClick={() => { handleToggleReference(d.id); setLinkSearchTerm(''); }}
                                                className={`w-full text-left p-2 rounded text-[10px] hover:bg-slate-50 flex justify-between items-center ${editFormData.referenceDocIds?.includes(d.id) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}
                                            >
                                                <span><b>{d.docNumber}</b>: {d.title}</span>
                                                {editFormData.referenceDocIds?.includes(d.id) && <CheckCircle size={10} />}
                                            </button>
                                        ))
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Editor */}
                <div>
                    <div className="flex gap-4 mb-4 border-b overflow-x-auto no-scrollbar whitespace-nowrap">
                        <button onClick={()=>setEditFormData({...editFormData, isUploadedFile: false})} className={`pb-2 text-sm font-bold transition-all ${!editFormData.isUploadedFile ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>Write Log</button>
                        <button onClick={()=>setEditFormData({...editFormData, isUploadedFile: true})} className={`pb-2 text-sm font-bold transition-all ${editFormData.isUploadedFile ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>Upload Evidence</button>
                        <div className="ml-auto flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-medium">Apply Template:</span>
                            <div className="flex gap-2">
                                {templates.map(t => (
                                    <button 
                                        key={t.id} 
                                        onClick={() => {
                                            setEditFormData({...editFormData, content: t.content});
                                            if(editorRef.current) editorRef.current.innerHTML = formatContentForDisplay(t.content);
                                        }}
                                        className="text-xs text-indigo-600 hover:underline font-bold"
                                    >
                                        {t.name}
                                    </button>
                                ))}
                                {templates.length === 0 && <span className="text-[10px] text-slate-300 italic">No templates</span>}
                            </div>
                        </div>
                    </div>
                    {editFormData.isUploadedFile ? (
                        <div className="p-8 md:p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 text-center shadow-inner">
                        <Upload size={40} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-sm font-medium text-slate-600 mb-6">PDF, PNG, JPG (Max 20MB)</p>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" /><button onClick={()=>fileInputRef.current?.click()} className="px-6 py-2 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-100 font-bold text-sm">Select File</button>
                        {editFormData.content?.startsWith('[FILE]') && <p className="mt-4 text-indigo-600 font-bold flex items-center justify-center gap-2 text-sm"><CheckCircle size={16}/> File Attached</p>}
                        </div>
                    ) : (
                        <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col min-h-[400px] shadow-sm">
                            {/* Rich Text Toolbar */}
                            <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 flex-wrap shrink-0">
                                <button onMouseDown={(e) => { e.preventDefault(); execCmd('bold'); }} className="p-1.5 hover:bg-slate-200 rounded text-slate-700" title="Bold"><Bold size={16}/></button>
                                <button onMouseDown={(e) => { e.preventDefault(); execCmd('italic'); }} className="p-1.5 hover:bg-slate-200 rounded text-slate-700" title="Italic"><Italic size={16}/></button>
                                <button onMouseDown={(e) => { e.preventDefault(); execCmd('underline'); }} className="p-1.5 hover:bg-slate-200 rounded text-slate-700" title="Underline"><Underline size={16}/></button>
                                <button onMouseDown={(e) => { e.preventDefault(); execCmd('strikeThrough'); }} className="p-1.5 hover:bg-slate-200 rounded text-slate-700" title="Strike Through"><Strikethrough size={16}/></button>
                                
                                <div className="w-px h-5 bg-slate-300 mx-1"></div>
                                
                                <div className="flex items-center gap-1">
                                    <Palette size={16} className="text-slate-500 ml-1"/>
                                    <select onChange={(e) => execCmd('foreColor', e.target.value)} className="text-xs bg-transparent border border-slate-200 rounded p-1 outline-none w-20">
                                        <option value="black">Black</option>
                                        <option value="red">Red</option>
                                        <option value="blue">Blue</option>
                                        <option value="green">Green</option>
                                    </select>
                                </div>

                                <div className="w-px h-5 bg-slate-300 mx-1"></div>

                                <div className="flex items-center gap-1">
                                    <Type size={16} className="text-slate-500 ml-1"/>
                                    <select onChange={(e) => execCmd('fontSize', e.target.value)} className="text-xs bg-transparent border border-slate-200 rounded p-1 outline-none w-20">
                                        <option value="3">Normal</option>
                                        <option value="1">Small</option>
                                        <option value="5">Large</option>
                                        <option value="7">Huge</option>
                                    </select>
                                </div>
                            </div>
                            
                            {/* Editable Content */}
                            <div 
                                ref={editorRef}
                                className="flex-1 p-4 outline-none overflow-y-auto font-sans text-sm min-h-[300px]"
                                contentEditable
                                onInput={(e) => setEditFormData({...editFormData, content: e.currentTarget.innerHTML})}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
  };

  const renderViewer = () => {
    if (!selectedRecord) return null;
    const referencedDocs = selectedRecord.referenceDocIds?.map(rid => DOCUMENTS.find(d => d.id === rid)).filter(Boolean) || [];
    
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col h-full animate-fadeIn overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 rounded-t-xl shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('LIST')} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><ArrowLeft size={20} /></button>
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-800">{selectedRecord.recordNumber}</h2>
              <p className="text-xs text-slate-500 truncate max-w-[200px] md:max-w-none">{selectedRecord.title}</p>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => handleDownloadPDF(selectedRecord)} className="flex-1 md:flex-none px-4 py-2 bg-white border rounded-lg font-bold text-xs shadow-sm hover:bg-slate-50 flex items-center justify-center gap-2 transition-all"><Download size={16} /> PDF</button>
            {selectedRecord.status === QualityRecordStatus.ACTIVE && (
              <button onClick={() => { setEditFormData(selectedRecord); setView('EDITOR'); }} className="flex-1 md:flex-none px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-bold text-xs shadow-sm hover:bg-indigo-100 flex items-center justify-center gap-2 transition-all"><Edit3 size={16} /> Edit</button>
            )}
            {selectedRecord.status === QualityRecordStatus.ACTIVE && (
              <button onClick={() => handleArchive(selectedRecord.id)} className="flex-1 md:flex-none px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-xs shadow-md hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all"><Archive size={16} /> Archive</button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-12 bg-slate-50">
          <div className="bg-white min-h-full p-6 md:p-12 shadow-sm border border-slate-200 rounded-sm relative mb-8">
            <div className="border-b-2 border-slate-800 pb-4 mb-8 flex justify-between items-end uppercase">
               <h1 className="text-lg md:text-xl font-black">{COMPANY_NAME}</h1>
               <div className="text-right text-[8px] md:text-[10px] font-bold">Record #: {selectedRecord.recordNumber}</div>
            </div>
            {selectedRecord.isUploadedFile ? (
               <div className="flex flex-col items-center justify-center py-12 md:py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                 <FileText size={48} className="mb-4 opacity-20" />
                 <p className="font-bold text-sm">FILE ATTACHED</p>
                 <p className="text-[10px] md:text-xs text-center px-4 mt-1">{selectedRecord.content.replace('[FILE] ', '')}</p>
                 <button className="mt-6 px-4 py-1.5 bg-white border rounded text-xs font-bold hover:bg-slate-100 transition-colors">Download Attachment</button>
               </div>
            ) : (
               <div 
                  className="prose max-w-none text-slate-800 font-sans text-xs md:text-sm leading-relaxed" 
                  dangerouslySetInnerHTML={{ __html: formatContentForDisplay(selectedRecord.content) }} 
               />
            )}
            <div className="mt-12 md:mt-20 pt-4 border-t border-slate-100 text-[8px] md:text-[10px] text-slate-400 font-bold flex flex-col md:flex-row justify-between uppercase gap-2">
              <span>By: {USERS.find(u=>u.id===selectedRecord.creatorId)?.name}</span>
              <span>Retention: {selectedRecord.retentionYears} Years</span>
              <span>Logged: {new Date(selectedRecord.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Reference Links in Viewer */}
          {referencedDocs.length > 0 && (
                <div className="max-w-4xl w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mx-auto">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Link size={14} className="text-indigo-600" /> Reference Documents
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {referencedDocs.map(rd => rd && (
                            <div 
                                key={rd.id} 
                                className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-4 text-left"
                            >
                                <div className="p-2 bg-white text-indigo-600 rounded-lg shadow-sm">
                                    <FileText size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{rd.type}</p>
                                    <p className="font-bold text-slate-800 text-xs truncate">{rd.docNumber}: {rd.title}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fadeIn p-4 md:p-6 overflow-hidden">
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl shadow-sm"><FolderArchive size={24} /></div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">Quality Records</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Archival, evidence retention, and logs.</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {view === 'LIST' && renderList()}
        {view === 'EDITOR' && renderEditor()}
        {view === 'VIEWER' && renderViewer()}
        {view === 'TEMPLATES' && renderTemplates()}
      </div>
    </div>
  );
};

export default RecordsModule;
