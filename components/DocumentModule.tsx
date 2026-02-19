
import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  UserRole, 
  Document, 
  DocStatus, 
  DocChangeRequest, 
  DocTemplate,
  DocumentTypeConfig,
  ModuleId,
  DocumentFolder,
  DocumentGlobalConfig
} from '../types';
import { 
  DOCUMENTS, 
  CHANGE_REQUESTS, 
  DOC_TEMPLATES, 
  DOC_TYPES, 
  DOC_FOLDERS, 
  DOC_CONFIG, 
  USERS, 
  ROLES, 
  LOCATIONS, 
  updateDocuments, 
  updateChangeRequests, 
  updateDocTemplates, 
  updateDocFolders 
} from '../mockData';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  File, 
  Upload, 
  Users as UsersIcon, 
  GitPullRequest, 
  Printer, 
  Settings, 
  ArrowLeft, 
  GraduationCap, 
  Power,
  Save,
  Trash2,
  FileCog,
  Folder,
  FolderOpen,
  Archive,
  PenTool,
  CornerUpLeft,
  ChevronRight,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Palette,
  Type,
  Baseline,
  FolderInput,
  Link,
  ExternalLink,
  X,
  FileSpreadsheet,
  Presentation
} from 'lucide-react';

import { jsPDF } from 'jspdf';

interface DocumentModuleProps {
  currentUser: User;
}

type ViewMode = 'LIST' | 'EDITOR' | 'VIEWER' | 'TEMPLATES' | 'CHANGE_REQUESTS';

const DocumentModule: React.FC<DocumentModuleProps> = ({ currentUser }) => {
  const [view, setView] = useState<ViewMode>('LIST');
  const [docs, setDocs] = useState<Document[]>(DOCUMENTS);
  const [folders, setFolders] = useState<DocumentFolder[]>(DOC_FOLDERS);
  const [changeRequests, setChangeRequests] = useState<DocChangeRequest[]>(CHANGE_REQUESTS);
  const [templates, setTemplates] = useState<DocTemplate[]>(DOC_TEMPLATES);
  const [config, setConfig] = useState<DocumentGlobalConfig>(DOC_CONFIG);
  
  // Directly use imported DOC_TYPES
  const docTypes = DOC_TYPES;
  
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Editor State
  const [editFormData, setEditFormData] = useState<Partial<Document>>({});
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Template Editor State
  const [editingTemplate, setEditingTemplate] = useState<Partial<DocTemplate> | null>(null);

  // Training Modal State
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [trainingDocId, setTrainingDocId] = useState<string | null>(null);

  // CR Modal State
  const [isCRModalOpen, setIsCRModalOpen] = useState(false);
  const [crReason, setCrReason] = useState('');

  // Folder Creation State
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Move Document State
  const [movingDoc, setMovingDoc] = useState<Document | null>(null);
  const [moveTargetFolderId, setMoveTargetFolderId] = useState<string>('');

  // Link Search State
  const [linkSearchTerm, setLinkSearchTerm] = useState('');
  const [approverSearchTerm, setApproverSearchTerm] = useState('');

  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;
  // Use config permissions
  const canCreate = config.allowedCreators.includes(currentUser.id) || isSuperAdmin;
  const canApproveCR = config.changeRequestApprovers.includes(currentUser.id) || isSuperAdmin;

  // --- Helpers ---

  const getStatusColor = (status: DocStatus) => {
    switch (status) {
      case DocStatus.APPROVED: return 'bg-green-100 text-green-700 border-green-200';
      case DocStatus.PENDING_APPROVAL: return 'bg-orange-100 text-orange-700 border-orange-200';
      case DocStatus.DRAFT: return 'bg-slate-100 text-slate-700 border-slate-200';
      case DocStatus.REVISION_REQUESTED: return 'bg-blue-100 text-blue-700 border-blue-200';
      case DocStatus.OBSOLETE: return 'bg-red-50 text-red-500 border-red-100 line-through';
      default: return 'bg-slate-100';
    }
  };

  const getNextDocNumber = (prefix: string) => {
    const count = docs.filter(d => d.docNumber.startsWith(prefix)).length + 1;
    return `${prefix}-${count.toString().padStart(3, '0')}`;
  };

  const getBreadcrumbs = () => {
    const path = [];
    let current = folders.find(f => f.id === currentFolderId);
    while (current) {
        path.unshift(current);
        current = current.parentId ? folders.find(f => f.id === current.parentId) : undefined;
    }
    // Always start with Root if not in list (safety)
    if (path.length === 0 || path[0].id !== 'root') {
        const root = folders.find(f => f.id === 'root');
        if(root && path[0]?.id !== 'root') path.unshift(root);
    }
    return path;
  };

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
  // This replaces the useEffect that was incorrectly placed inside renderEditor
  useEffect(() => {
    if (view === 'EDITOR' && editorRef.current && !editFormData.isUploadedFile) {
        // Set initial content when entering editor mode or switching docs
        editorRef.current.innerHTML = formatContentForDisplay(editFormData.content);
    }
  }, [view, editFormData.id, editFormData.isUploadedFile]); 

  // --- Actions ---

  const handleCreateFolder = () => {
      if (!newFolderName.trim()) return;
      const newFolder: DocumentFolder = {
          id: `folder-${Date.now()}`,
          name: newFolderName,
          parentId: currentFolderId
      };
      const updatedFolders = [...folders, newFolder];
      setFolders(updatedFolders);
      updateDocFolders(updatedFolders);
      setNewFolderName('');
      setIsFolderModalOpen(false);
  };

  const handleStartCreate = () => {
    const defaultType = docTypes.length > 0 ? docTypes[0] : null;
    setEditFormData({
      title: '',
      type: defaultType ? defaultType.prefix : '',
      content: '',
      isUploadedFile: false,
      approverIds: [], 
      trainingRequiredRoles: [],
      trainingRequiredSites: [],
      folderId: currentFolderId, // Create in current folder
      isRedline: false,
      referenceDocIds: []
    });
    setFileError('');
    setView('EDITOR');
  };

  const handleEditDraft = (doc: Document) => {
    setEditFormData({ ...doc, isRedline: false, referenceDocIds: doc.referenceDocIds || [] });
    setView('EDITOR');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setFileError('File size exceeds 20MB limit.');
      return;
    }
    
    // Convert to Base64 for Preview
    const reader = new FileReader();
    reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setEditFormData({
            ...editFormData,
            isUploadedFile: true,
            content: base64
        });
    };
    reader.readAsDataURL(file);
    setFileError('');
  };

  const handleSaveDocument = (status: DocStatus) => {
    if (!editFormData.title || !editFormData.type) return;

    let dNumber = editFormData.docNumber;
    if (!dNumber) {
        const typeConfig = docTypes.find(dt => dt.prefix === editFormData.type);
        dNumber = getNextDocNumber(typeConfig ? typeConfig.prefix : 'DOC');
    }

    const newDoc: Document = {
      id: editFormData.id || Date.now().toString(),
      docNumber: dNumber,
      title: editFormData.title,
      type: editFormData.type,
      version: editFormData.version || 1.0,
      content: editFormData.content || '',
      isUploadedFile: editFormData.isUploadedFile || false,
      folderId: editFormData.folderId || currentFolderId,
      isRedline: false,
      authorId: editFormData.authorId || currentUser.id,
      approverIds: editFormData.approverIds || [],
      approvedByIds: [],
      status: status,
      isActive: true,
      trainingRequiredRoles: editFormData.trainingRequiredRoles || [],
      trainingRequiredSites: editFormData.trainingRequiredSites || [],
      createdAt: editFormData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      referenceDocIds: editFormData.referenceDocIds || []
    };

    let updatedDocs = [...docs];
    if (editFormData.id) {
       updatedDocs = docs.map(d => d.id === newDoc.id ? newDoc : d);
    } else {
       updatedDocs.push(newDoc);
    }

    setDocs(updatedDocs);
    updateDocuments(updatedDocs);
    setView('LIST');
  };

  const handleApprove = (docId: string) => {
    const doc = docs.find(d => d.id === docId);
    if (!doc) return;

    const newApprovedList = [...doc.approvedByIds, currentUser.id];
    const allApproved = doc.approverIds.every(id => newApprovedList.includes(id));

    if (allApproved) {
        // --- FINAL APPROVAL LOGIC ---
        
        const finalDoc: Document = {
            ...doc,
            approvedByIds: newApprovedList,
            status: DocStatus.APPROVED,
            isRedline: false, 
            updatedAt: new Date().toISOString()
        };

        // Update lists
        const updatedDocs = docs.map(d => {
            // Archive previous approved version if exists
            if (d.docNumber === doc.docNumber && d.id !== doc.id && d.status === DocStatus.APPROVED) {
                return { ...d, folderId: 'archive', status: DocStatus.OBSOLETE };
            }
            if (d.id === docId) return finalDoc;
            return d;
        });

        setDocs(updatedDocs);
        updateDocuments(updatedDocs);
        if (selectedDoc?.id === docId) setSelectedDoc(finalDoc);

    } else {
        // Just add approval to the current draft
        const updatedDoc = {
            ...doc,
            approvedByIds: newApprovedList,
            updatedAt: new Date().toISOString()
        };
        const updatedList = docs.map(d => d.id === docId ? updatedDoc : d);
        setDocs(updatedList);
        updateDocuments(updatedList);
        if (selectedDoc?.id === docId) setSelectedDoc(updatedDoc);
    }
  };

  const handleMoveDocument = () => {
    if (!movingDoc || !moveTargetFolderId) return;
    
    const updatedDocs = docs.map(d => 
        d.id === movingDoc.id ? { ...d, folderId: moveTargetFolderId } : d
    );
    
    setDocs(updatedDocs);
    updateDocuments(updatedDocs);
    setMovingDoc(null);
    setMoveTargetFolderId('');
  };

  const handleDownloadPDF = (doc: Document) => {
    if (!doc) return;

    // If it's an uploaded file (Data URL), download with correct extension
    if (doc.isUploadedFile && doc.content.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = doc.content;
        
        // Detect extension from mime type
        let extension = 'bin';
        if (doc.content.includes('application/pdf')) extension = 'pdf';
        else if (doc.content.includes('application/msword') || doc.content.includes('application/doc')) extension = 'doc';
        else if (doc.content.includes('wordprocessingml.document')) extension = 'docx';
        else if (doc.content.includes('image/jpeg')) extension = 'jpg';
        else if (doc.content.includes('image/png')) extension = 'png';
        
        link.download = `${doc.docNumber}_v${doc.version}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
    }

    // Otherwise generate PDF from content
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;

    // Header
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("FRANKSTON PACKAGING", margin, 20);
    
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Document: ${doc.docNumber}`, margin, 30);
    pdf.text(`Title: ${doc.title}`, margin, 35);
    pdf.text(`Version: ${doc.version.toFixed(1)}`, margin, 40);
    pdf.text(`Status: ${doc.status}`, margin, 45);

    pdf.line(margin, 50, pageWidth - margin, 50);

    // Content
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);

    // Strip HTML for PDF generation to basic text
    const cleanText = stripHtml(doc.content || "(No Content)");
    const splitText = pdf.splitTextToSize(cleanText, pageWidth - (margin * 2));
    pdf.text(splitText, margin, 60);

    // Reference Footer in PDF if exists
    if (doc.referenceDocIds && doc.referenceDocIds.length > 0) {
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.text("REFERENCE DOCUMENTS:", margin, 220);
        pdf.setFont("helvetica", "normal");
        doc.referenceDocIds.forEach((rid, idx) => {
            const rd = docs.find(d => d.id === rid);
            if (rd) pdf.text(`- ${rd.docNumber}: ${rd.title}`, margin + 5, 230 + (idx * 6));
        });
    }

    // Footer
    const dateStr = new Date().toLocaleDateString();
    pdf.setFontSize(8);
    pdf.setTextColor(0,0,0);
    pdf.text(`Generated on: ${dateStr}`, margin, pageHeight - 10);
    pdf.text("Simple-LMS System", pageWidth - margin - 30, pageHeight - 10);

    pdf.save(`${doc.docNumber}_v${doc.version}.pdf`);
  };

  const handleRequestChange = () => {
     if (!selectedDoc || !crReason) return;

     const request: DocChangeRequest = {
       id: Date.now().toString(),
       documentId: selectedDoc.id,
       requestedByUserId: currentUser.id,
       reason: crReason,
       assignedToUserId: selectedDoc.authorId,
       status: 'PENDING',
       createdAt: new Date().toISOString()
     };

     const updated = [...changeRequests, request];
     setChangeRequests(updated);
     updateChangeRequests(updated);
     setIsCRModalOpen(false);
     setCrReason('');
     alert('Change Request Submitted.');
  };

  const handleApproveCR = (cr: DocChangeRequest) => {
     const originalDoc = docs.find(d => d.id === cr.documentId);
     if (originalDoc) {
       const newVersionDoc: Document = {
         ...originalDoc,
         id: Date.now().toString(), 
         version: parseFloat((originalDoc.version + 0.1).toFixed(1)), 
         status: DocStatus.DRAFT,
         approvedByIds: [], 
         isRedline: false,
         folderId: originalDoc.folderId, // Stay in same folder
         updatedAt: new Date().toISOString()
       };
       
       const updatedDocs = [...docs, newVersionDoc];
       setDocs(updatedDocs);
       updateDocuments(updatedDocs);
       
       const updatedCRs = changeRequests.map(r => r.id === cr.id ? { ...r, status: 'APPROVED' } as DocChangeRequest : r);
       setChangeRequests(updatedCRs);
       updateChangeRequests(updatedCRs);
       alert(`New Draft Version ${newVersionDoc.version} Created.`);
     }
  };

  const handleAssignTraining = () => {
    if (!trainingDocId) return;
    const doc = docs.find(d => d.id === trainingDocId);
    if (doc) alert(`Training assigned to selected roles for ${doc.docNumber}`);
    setIsTrainingModalOpen(false);
  };

  const handleToggleActive = (doc: Document) => {
    if (!isSuperAdmin) return;
    const updated = docs.map(d => d.id === doc.id ? { ...d, isActive: !d.isActive } : d);
    setDocs(updated);
    updateDocuments(updated);
  };

  const handleToggleReference = (docId: string) => {
      const current = editFormData.referenceDocIds || [];
      const updated = current.includes(docId) 
        ? current.filter(id => id !== docId)
        : [...current, docId];
      setEditFormData({ ...editFormData, referenceDocIds: updated });
  };

  const handleToggleApprover = (userId: string) => {
      const current = editFormData.approverIds || [];
      const updated = current.includes(userId)
        ? current.filter(id => id !== userId)
        : [...current, userId];
      setEditFormData({ ...editFormData, approverIds: updated });
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
        setEditFormData({ ...editFormData, content: editorRef.current.innerHTML });
    }
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate || !editingTemplate.name) return;
    
    const newTpl: DocTemplate = {
      id: editingTemplate.id || Date.now().toString(),
      name: editingTemplate.name,
      content: editingTemplate.content || '',
      type: editingTemplate.type || 'TEXT',
      fileName: editingTemplate.fileName
    };

    let updated;
    if (editingTemplate.id) {
      updated = templates.map(t => t.id === newTpl.id ? newTpl : t);
    } else {
      updated = [...templates, newTpl];
    }

    setTemplates(updated);
    updateDocTemplates(updated);
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (id: string) => {
    if (!window.confirm("Delete this template?")) return;
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    updateDocTemplates(updated);
    if (editingTemplate?.id === id) setEditingTemplate(null);
  };

  const handleTemplateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingTemplate) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setEditingTemplate({
            ...editingTemplate,
            type: 'FILE',
            content: base64,
            fileName: file.name
        });
    };
    reader.readAsDataURL(file);
  };

  // --- Views ---

  const renderList = () => {
    // Filter docs by current folder AND search terms
    const filteredDocs = docs.filter(d => {
       const inFolder = d.folderId === currentFolderId || (!d.folderId && currentFolderId === 'root');
       const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) || d.docNumber.toLowerCase().includes(searchTerm.toLowerCase());
       const activeCheck = isSuperAdmin ? true : d.isActive;
       return inFolder && matchesSearch && activeCheck;
    });

    // Get subfolders for current folder
    const subFolders = folders.filter(f => f.parentId === currentFolderId);

    const breadcrumbs = getBreadcrumbs();

    return (
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search documents..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {isSuperAdmin && (
               <button onClick={() => setView('TEMPLATES')} className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium flex items-center gap-2 text-sm">
                  <File size={16} /> Templates
               </button>
            )}
            <button onClick={() => setView('CHANGE_REQUESTS')} className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium flex items-center gap-2 relative text-sm">
               <GitPullRequest size={16} /> Changes
               {changeRequests.filter(c => c.status === 'PENDING').length > 0 && (
                 <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
               )}
            </button>
            {canCreate && (
              <>
                <button onClick={() => setIsFolderModalOpen(true)} className="px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium flex items-center gap-2 text-sm">
                    <Plus size={16} /> Folder
                </button>
                <button onClick={handleStartCreate} className="px-3 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-medium flex items-center gap-2 text-sm">
                    <Plus size={16} /> Document
                </button>
              </>
            )}
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
            {breadcrumbs.map((f, i) => (
                <React.Fragment key={f.id}>
                    <button onClick={() => setCurrentFolderId(f.id)} className="hover:text-emerald-600 font-medium flex items-center gap-1">
                        {f.id === 'root' ? <FolderOpen size={16}/> : null} {f.name}
                    </button>
                    {i < breadcrumbs.length - 1 && <ChevronRight size={14} />}
                </React.Fragment>
            ))}
        </div>

        {/* Folders Grid */}
        {(subFolders.length > 0 || currentFolderId === 'root') && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {subFolders.map(f => (
                    <button 
                        key={f.id} 
                        onClick={() => setCurrentFolderId(f.id)}
                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${f.id === 'archive' ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-sm'}`}
                    >
                        {f.id === 'archive' ? <Archive size={32} className="text-slate-400" /> : 
                         <Folder size={32} className="text-emerald-500" />}
                        <span className={`text-sm font-semibold truncate w-full text-center text-slate-700`}>{f.name}</span>
                    </button>
                ))}
            </div>
        )}

        {/* Documents Table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-6 py-4 font-semibold">Doc #</th>
                  <th className="px-6 py-4 font-semibold">Title</th>
                  <th className="px-6 py-4 font-semibold">Ver</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-slate-400">No documents in this folder.</td></tr> :
                filteredDocs.map(doc => (
                  <tr key={doc.id} className={`hover:bg-slate-50 ${!doc.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4 font-mono text-slate-500">{doc.docNumber}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                        {doc.title}
                        {doc.isRedline && <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] rounded uppercase font-bold">Redline</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-500">v{doc.version.toFixed(1)}</td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600 font-bold">{doc.type}</span></td>
                    <td className="px-6 py-4">
                       <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(doc.status)}`}>
                         {doc.status.replace('_', ' ')}
                       </span>
                       {!doc.isActive && <span className="ml-2 text-xs text-red-500 font-bold">(INACTIVE)</span>}
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <button onClick={() => { setSelectedDoc(doc); setView('VIEWER'); }} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" title="View">
                        <Eye size={18} />
                      </button>
                      {canCreate && (
                        <>
                          <button onClick={() => { setMovingDoc(doc); setMoveTargetFolderId(doc.folderId || 'root'); }} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded" title="Move">
                            <FolderInput size={18} />
                          </button>
                          {doc.status === DocStatus.DRAFT && (
                            <button onClick={() => handleEditDraft(doc)} className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded" title="Edit Draft">
                              <Edit3 size={18} />
                            </button>
                          )}
                        </>
                      )}
                      {isSuperAdmin && (
                        <button onClick={() => handleToggleActive(doc)} className={`p-1.5 rounded ${doc.isActive ? 'text-green-600' : 'text-slate-400'}`} title="Toggle Active">
                          <Power size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderEditor = () => {
    // Filter out the current doc from reference options
    const otherDocs = docs.filter(d => d.id !== editFormData.id && d.status === DocStatus.APPROVED);
    const filteredLinks = otherDocs.filter(d => 
        d.title.toLowerCase().includes(linkSearchTerm.toLowerCase()) || 
        d.docNumber.toLowerCase().includes(linkSearchTerm.toLowerCase())
    );

    // Searchable approver list
    const filteredApprovers = USERS.filter(u => 
        (u.role === UserRole.ADMIN || u.role === UserRole.MANAGER) &&
        u.name.toLowerCase().includes(approverSearchTerm.toLowerCase())
    );

    return (
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col h-full max-h-[calc(100vh-180px)]">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl shrink-0">
          <div className="flex items-center gap-2">
             <button onClick={() => setView('LIST')} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><ArrowLeft size={20} /></button>
             <h2 className="text-lg font-bold text-slate-800">{editFormData.id ? 'Edit Document' : 'Create New Document'}</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleSaveDocument(DocStatus.DRAFT)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Save Draft</button>
            <button onClick={() => handleSaveDocument(DocStatus.PENDING_APPROVAL)} className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-medium">Submit for Approval</button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                <input type="text" className="w-full p-2 border border-slate-300 rounded outline-none focus:border-emerald-500 shadow-sm" value={editFormData.title} onChange={e => setEditFormData({...editFormData, title: e.target.value})} placeholder="Document Title" />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type (Prefix)</label>
                <select className="w-full p-2 border border-slate-300 rounded outline-none bg-white shadow-sm" value={editFormData.type} onChange={e => setEditFormData({...editFormData, type: e.target.value})}>
                   {docTypes.map(dt => (
                       <option key={dt.id} value={dt.prefix}>{dt.name} ({dt.prefix})</option>
                   ))}
                </select>
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Approvers</label>
                    <div className="p-3 border border-slate-300 rounded-lg bg-slate-50 text-sm flex flex-wrap gap-2 min-h-[44px] shadow-inner">
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded border border-emerald-200 flex items-center gap-1 font-medium"><CheckCircle size={12} /> Site Manager</span>
                        
                        {editFormData.approverIds?.map(id => {
                            const u = USERS.find(user => user.id === id);
                            return u ? (
                                <span key={id} className="px-2 py-1 bg-white border border-slate-300 rounded flex items-center gap-1 shadow-sm font-medium">
                                    {u.name}
                                    <button onClick={() => handleToggleApprover(id)} className="text-slate-400 hover:text-red-500 ml-1"><X size={12}/></button>
                                </span>
                            ) : null;
                        })}

                        <div className="relative group">
                            <div className="flex items-center gap-2 border border-slate-200 bg-white rounded px-2 py-1 shadow-sm group-focus-within:ring-2 group-focus-within:ring-emerald-500/20">
                                <Search size={12} className="text-slate-400" />
                                <input 
                                    type="text" 
                                    className="bg-transparent border-none outline-none text-xs w-24" 
                                    placeholder="Add..." 
                                    value={approverSearchTerm}
                                    onChange={e => setApproverSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-300 shadow-xl rounded-lg max-h-48 overflow-y-auto hidden group-focus-within:block z-30 p-1 animate-fadeIn">
                                {filteredApprovers.length === 0 ? <p className="p-2 text-[10px] text-slate-400 text-center">No matching users</p> : 
                                    filteredApprovers.map(u => (
                                        <button 
                                            key={u.id} 
                                            onClick={() => { handleToggleApprover(u.id); setApproverSearchTerm(''); }}
                                            className={`w-full text-left p-2 rounded text-xs hover:bg-slate-50 flex justify-between items-center ${editFormData.approverIds?.includes(u.id) ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600'}`}
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
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Connected/Reference Docs</label>
                    <div className="p-3 border border-slate-300 rounded-lg bg-slate-50 text-sm min-h-[44px] shadow-inner">
                        <div className="flex flex-wrap gap-2 mb-2">
                            {editFormData.referenceDocIds?.map(rid => {
                                const rd = docs.find(d => d.id === rid);
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
                            <div className="flex items-center gap-2 border border-slate-200 bg-white rounded px-2 py-1 shadow-sm group-focus-within:ring-2 group-focus-within:ring-emerald-500/20">
                                <Search size={12} className="text-slate-400" />
                                <input 
                                    type="text" 
                                    className="bg-transparent border-none outline-none text-xs w-full" 
                                    placeholder="Link Form or WI..." 
                                    value={linkSearchTerm}
                                    onChange={e => setLinkSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-300 shadow-xl rounded-lg max-h-48 overflow-y-auto hidden group-focus-within:block z-30 p-1 animate-fadeIn">
                                {filteredLinks.length === 0 ? <p className="p-2 text-[10px] text-slate-400 text-center">No approved docs found</p> : 
                                    filteredLinks.map(d => (
                                        <button 
                                            key={d.id} 
                                            onClick={() => { handleToggleReference(d.id); setLinkSearchTerm(''); }}
                                            className={`w-full text-left p-2 rounded text-[10px] hover:bg-slate-50 flex justify-between items-center ${editFormData.referenceDocIds?.includes(d.id) ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600'}`}
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

           {/* Content Switcher */}
           <div>
              <div className="flex gap-4 mb-2 border-b border-slate-200">
                 <button 
                   onClick={() => setEditFormData({...editFormData, isUploadedFile: false})}
                   className={`pb-2 text-sm font-bold ${!editFormData.isUploadedFile ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500'}`}
                 >
                   Write Content
                 </button>
                 <button 
                   onClick={() => setEditFormData({...editFormData, isUploadedFile: true})}
                   className={`pb-2 text-sm font-bold ${editFormData.isUploadedFile ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500'}`}
                 >
                   Upload File
                 </button>
                 {!editFormData.isUploadedFile && (
                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-xs text-slate-400">Apply Template:</span>
                        {templates.map(t => (
                            <button 
                                key={t.id}
                                onClick={() => {
                                    if (t.type === 'FILE') {
                                        setEditFormData({
                                            ...editFormData, 
                                            content: t.content, 
                                            isUploadedFile: true 
                                        });
                                    } else {
                                        setEditFormData({
                                            ...editFormData, 
                                            content: t.content, 
                                            isUploadedFile: false 
                                        });
                                        if(editorRef.current) editorRef.current.innerHTML = formatContentForDisplay(t.content);
                                    }
                                }}
                                className="text-xs text-cyan-600 hover:underline font-bold"
                            >
                                {t.name}
                            </button>
                        ))}
                    </div>
                 )}
              </div>

              {editFormData.isUploadedFile ? (
                 <div className="p-8 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 text-center">
                    <Upload size={32} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-slate-600 mb-4">Drag and drop or select a file (PDF/Word, Max 10MB)</p>
                    <input ref={fileInputRef} type="file" onChange={handleFileUpload} accept=".pdf,.doc,.docx" />
                    {fileError && <p className="text-red-500 text-sm mt-2">{fileError}</p>}
                    {(editFormData.content && (editFormData.content.startsWith('data:') || editFormData.content.startsWith('[FILE]'))) && (
                       <p className="text-green-600 font-bold mt-2"><CheckCircle size={16} className="inline" /> File ready for upload</p>
                    )}
                 </div>
              ) : (
                 <div className="border border-slate-300 rounded overflow-hidden flex flex-col min-h-[400px] shadow-sm">
                    {/* Rich Text Toolbar */}
                    <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-300 flex-wrap shrink-0">
                        <button onMouseDown={(e) => { e.preventDefault(); execCmd('bold'); }} className="p-1.5 hover:bg-slate-200 rounded text-slate-700" title="Bold"><Bold size={16}/></button>
                        <button onMouseDown={(e) => { e.preventDefault(); execCmd('italic'); }} className="p-1.5 hover:bg-slate-200 rounded text-slate-700" title="Italic"><Italic size={16}/></button>
                        <button onMouseDown={(e) => { e.preventDefault(); execCmd('underline'); }} className="p-1.5 hover:bg-slate-200 rounded text-slate-700" title="Underline"><Underline size={16}/></button>
                        <button onMouseDown={(e) => { e.preventDefault(); execCmd('strikeThrough'); }} className="p-1.5 hover:bg-slate-200 rounded text-slate-700" title="Strike Through"><Strikethrough size={16}/></button>
                        
                        <div className="w-px h-5 bg-slate-300 mx-1"></div>
                        
                        <div className="flex items-center gap-1">
                            <Palette size={16} className="text-slate-500 ml-1"/>
                            <select onChange={(e) => execCmd('foreColor', e.target.value)} className="text-xs bg-transparent border border-slate-300 rounded p-1 outline-none w-20">
                                <option value="black">Black</option>
                                <option value="red">Red (New)</option>
                                <option value="blue">Blue</option>
                                <option value="green">Green</option>
                            </select>
                        </div>

                        <div className="w-px h-5 bg-slate-300 mx-1"></div>

                        <div className="flex items-center gap-1">
                            <Type size={16} className="text-slate-500 ml-1"/>
                            <select onChange={(e) => execCmd('fontSize', e.target.value)} className="text-xs bg-transparent border border-slate-300 rounded p-1 outline-none w-20">
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
                        className="flex-1 p-4 outline-none overflow-y-auto font-sans text-sm"
                        contentEditable
                        onInput={(e) => setEditFormData({...editFormData, content: e.currentTarget.innerHTML})}
                        style={{ minHeight: '300px' }}
                    />
                 </div>
              )}
           </div>
        </div>
      </div>
    );
  };

  const renderViewer = () => {
     if (!selectedDoc) return null;
     
     const canApprove = currentUser.role !== UserRole.USER && 
                        selectedDoc.status === DocStatus.PENDING_APPROVAL && 
                        (selectedDoc.approverIds.includes(currentUser.id) || currentUser.role === UserRole.SUPER_ADMIN) &&
                        !selectedDoc.approvedByIds.includes(currentUser.id);

     const referencedDocs = selectedDoc.referenceDocIds?.map(rid => docs.find(d => d.id === rid)).filter(Boolean) || [];

     return (
       <div className="bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col h-full animate-fadeIn">
         {/* Header */}
         <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl shrink-0">
             <div className="flex items-center gap-3">
               <button onClick={() => setView('LIST')} className="p-2 hover:bg-slate-200 rounded-full"><ArrowLeft size={20} /></button>
               <div>
                  <h1 className="text-xl font-bold text-slate-800">{selectedDoc.docNumber}: {selectedDoc.title}</h1>
                  <p className="text-xs text-slate-500">Version {selectedDoc.version.toFixed(1)} • {selectedDoc.type}</p>
               </div>
             </div>
             <div className="flex gap-2">
                <button onClick={() => handleDownloadPDF(selectedDoc)} className="px-3 py-2 bg-white border border-slate-300 rounded hover:bg-slate-50 flex items-center gap-2 text-sm shadow-sm">
                   <Download size={16} /> {selectedDoc.isUploadedFile ? 'Download File' : 'Download PDF'}
                </button>
                <button 
                  onClick={() => { setTrainingDocId(selectedDoc.id); setIsTrainingModalOpen(true); }}
                  className="px-3 py-2 bg-white border border-slate-300 rounded hover:bg-slate-50 flex items-center gap-2 text-sm shadow-sm text-cyan-700"
                >
                   <GraduationCap size={16} /> Assign Training
                </button>
                {selectedDoc.status === DocStatus.APPROVED && canCreate && canApproveCR && (
                  <button onClick={() => setIsCRModalOpen(true)} className="px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 flex items-center gap-2 text-sm">
                     <GitPullRequest size={16} /> Request Revision
                  </button>
                )}
             </div>
         </div>

         {/* Content */}
         <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center">
            <div className="max-w-4xl w-full bg-white min-h-[800px] shadow-sm border border-slate-100 p-12 relative mb-8">
               {/* Watermark */}
               {selectedDoc.status !== DocStatus.APPROVED && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                     <span className="text-9xl font-bold -rotate-45 text-slate-900">{selectedDoc.status}</span>
                  </div>
               )}

               {/* Document Header (PDF Style) */}
               <div className="border-b-2 border-slate-900 pb-4 mb-8 flex justify-between items-end">
                  <div>
                     <h1 className="text-2xl font-bold text-slate-900 uppercase">Frankston Packaging</h1>
                     <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">{selectedDoc.type}</p>
                  </div>
                  <div className="text-right text-sm">
                     <p><strong>Doc #:</strong> {selectedDoc.docNumber}</p>
                     <p><strong>Rev:</strong> {selectedDoc.version.toFixed(1)}</p>
                     <p><strong>Date:</strong> {new Date(selectedDoc.updatedAt).toLocaleDateString()}</p>
                  </div>
               </div>

               {/* Body */}
               <div className="text-slate-800 font-sans min-h-[500px]">
                  {selectedDoc.isUploadedFile ? (
                     selectedDoc.content?.startsWith('data:application/pdf') ? (
                        <div className="w-full h-[800px] border border-slate-200 rounded-lg overflow-hidden">
                            <iframe 
                                src={selectedDoc.content} 
                                className="w-full h-full"
                                title="Document Preview"
                            />
                        </div>
                     ) : (
                         <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                            <FileText size={64} className="text-slate-300 mb-4" />
                            <h3 className="text-lg font-bold text-slate-700">Preview Not Available</h3>
                            <p className="text-slate-500 mb-6">This document format cannot be previewed in the browser.</p>
                            <button 
                                onClick={() => handleDownloadPDF(selectedDoc)} 
                                className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 shadow-sm flex items-center gap-2"
                            >
                                <Download size={18} /> Download File
                            </button>
                         </div>
                     )
                  ) : (
                     <div 
                        className="prose max-w-none" 
                        dangerouslySetInnerHTML={{ __html: formatContentForDisplay(selectedDoc.content) }} 
                     />
                  )}
               </div>

               {/* Footer (Revision control) */}
               <div className="mt-20 pt-4 border-t border-slate-300 text-xs text-slate-500 flex justify-between">
                  <span>Approved By: {selectedDoc.approvedByIds.map(id => USERS.find(u=>u.id===id)?.name).join(', ') || 'Pending'}</span>
                  <span>Page 1 of 1</span>
               </div>
            </div>

            {/* Reference Connections Section */}
            {referencedDocs.length > 0 && (
                <div className="max-w-4xl w-full bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-12">
                    <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Link size={16} className="text-emerald-600" /> Reference Forms & Instructions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {referencedDocs.map(rd => rd && (
                            <button 
                                key={rd.id} 
                                onClick={() => setSelectedDoc(rd)}
                                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all flex items-center gap-4 text-left group"
                            >
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <FileText size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{rd.type}</p>
                                    <p className="font-bold text-slate-800 text-sm truncate">{rd.docNumber}: {rd.title}</p>
                                </div>
                                <ExternalLink size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
         </div>

         {/* Approval Footer */}
         {canApprove && (
            <div className="p-4 bg-orange-50 border-t border-orange-200 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-2 text-orange-800">
                  <AlertTriangle size={20} />
                  <span className="font-bold">Approval Required</span>
                  <span className="text-sm">You are listed as an approver for this document.</span>
               </div>
               <div className="flex gap-2">
                  <button className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded hover:bg-red-50 font-medium">Reject</button>
                  <button onClick={() => handleApprove(selectedDoc.id)} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold shadow-sm">Approve Document</button>
               </div>
            </div>
         )}
       </div>
     );
  };

  const renderTemplates = () => (
      <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setView('LIST')} className="p-2 hover:bg-slate-100 rounded-full"><ArrowLeft size={20} /></button>
            <h2 className="text-xl font-bold text-slate-800">Template Manager</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* List */}
              <div className="col-span-1 bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                      <h3 className="font-bold text-slate-700">Templates</h3>
                      <button onClick={() => setEditingTemplate({name: '', content: ''})} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded"><Plus size={18} /></button>
                  </div>
                  <div className="divide-y divide-slate-100">
                      {templates.map(t => (
                          <div 
                            key={t.id} 
                            className={`p-3 cursor-pointer hover:bg-slate-50 flex justify-between items-center ${editingTemplate?.id === t.id ? 'bg-emerald-50 border-l-4 border-emerald-500' : ''}`}
                            onClick={() => setEditingTemplate(t)}
                          >
                              <span className="text-sm font-medium text-slate-800">{t.name}</span>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(t.id); }} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Editor */}
              <div className="col-span-2 bg-white border border-slate-200 rounded-lg p-6 flex flex-col h-[500px]">
                  {editingTemplate ? (
                      <>
                        <h3 className="font-bold text-slate-800 mb-4">{editingTemplate.id ? 'Edit Template' : 'New Template'}</h3>
                        <div className="space-y-4 flex-1 flex flex-col">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Template Name</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2 border border-slate-300 rounded" 
                                    value={editingTemplate.name || ''}
                                    onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                                />
                            </div>

                            {/* Template Source Toggle */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Template Source</label>
                                <div className="flex gap-4 border-b border-slate-200 mb-4">
                                    <button 
                                        className={`pb-2 text-sm font-bold border-b-2 transition-colors ${(!editingTemplate.type || editingTemplate.type === 'TEXT') ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400'}`}
                                        onClick={() => setEditingTemplate({...editingTemplate, type: 'TEXT'})}
                                    >
                                        Text Editor
                                    </button>
                                    <button 
                                        className={`pb-2 text-sm font-bold border-b-2 transition-colors ${editingTemplate.type === 'FILE' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400'}`}
                                        onClick={() => setEditingTemplate({...editingTemplate, type: 'FILE'})}
                                    >
                                        File Upload (Word/Excel/PPT)
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col min-h-0">
                                {(!editingTemplate.type || editingTemplate.type === 'TEXT') ? (
                                    <>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Default Content</label>
                                        <textarea 
                                            className="w-full flex-1 p-3 border border-slate-300 rounded font-mono text-sm resize-none"
                                            value={editingTemplate.content || ''}
                                            onChange={e => setEditingTemplate({...editingTemplate, content: e.target.value})}
                                        />
                                    </>
                                ) : (
                                    <div className="flex-1 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center bg-slate-50 relative">
                                        <input 
                                            type="file" 
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                            onChange={handleTemplateFileUpload}
                                        />
                                        {editingTemplate.fileName ? (
                                            <div className="text-center">
                                                <div className="mb-2 mx-auto w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center text-emerald-600">
                                                    {editingTemplate.fileName.endsWith('lsx') || editingTemplate.fileName.endsWith('xls') ? <FileSpreadsheet size={24} /> :
                                                     editingTemplate.fileName.endsWith('ptx') || editingTemplate.fileName.endsWith('ppt') ? <Presentation size={24} /> :
                                                     <FileText size={24} />}
                                                </div>
                                                <p className="font-bold text-slate-700 text-sm">{editingTemplate.fileName}</p>
                                                <p className="text-xs text-emerald-600 mt-1 font-bold">Change File</p>
                                            </div>
                                        ) : (
                                            <div className="text-center text-slate-400 p-8">
                                                <div className="flex justify-center gap-4 mb-4 opacity-50">
                                                    <FileText size={32} />
                                                    <FileSpreadsheet size={32} />
                                                    <Presentation size={32} />
                                                </div>
                                                <p className="font-bold text-sm">Drop Word, Excel, or PowerPoint file here</p>
                                                <p className="text-xs mt-1">or click to browse</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setEditingTemplate(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                                <button onClick={handleSaveTemplate} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">Save Template</button>
                            </div>
                        </div>
                      </>
                  ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                          <File size={48} className="mb-2 opacity-50" />
                          <p>Select a template to edit or create new</p>
                      </div>
                  )}
              </div>
          </div>
      </div>
  );

  const renderChangeRequests = () => (
     <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
           <button onClick={() => setView('LIST')} className="p-2 hover:bg-slate-100 rounded-full"><ArrowLeft size={20} /></button>
           <h2 className="text-xl font-bold text-slate-800">Change Requests</h2>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
           {changeRequests.length === 0 ? <div className="p-8 text-center text-slate-500">No active change requests.</div> : (
              <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 border-b">
                    <tr>
                       <th className="px-6 py-3">Doc ID</th>
                       <th className="px-6 py-3">Requested By</th>
                       <th className="px-6 py-3">Reason</th>
                       <th className="px-6 py-3">Status</th>
                       <th className="px-6 py-3">Action</th>
                    </tr>
                 </thead>
                 <tbody>
                    {changeRequests.map(cr => {
                       const doc = docs.find(d => d.id === cr.documentId);
                       const user = USERS.find(u => u.id === cr.requestedByUserId);
                       return (
                          <tr key={cr.id} className="border-b border-slate-50">
                             <td className="px-6 py-4 font-mono">{doc?.docNumber}</td>
                             <td className="px-6 py-4">{user?.name}</td>
                             <td className="px-6 py-4">{cr.reason}</td>
                             <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${cr.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{cr.status}</span></td>
                             <td className="px-6 py-4">
                                {cr.status === 'PENDING' && canApproveCR && (
                                   <button onClick={() => handleApproveCR(cr)} className="text-emerald-600 hover:underline font-bold">Approve & Draft</button>
                                )}
                             </td>
                          </tr>
                       );
                    })}
                 </tbody>
              </table>
           )}
        </div>
     </div>
  );

  const renderFolderModal = () => {
      if (!isFolderModalOpen) return null;
      return (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Create New Folder</h3>
                  <input 
                    autoFocus
                    type="text" 
                    className="w-full p-3 border border-slate-300 rounded mb-4"
                    placeholder="Folder Name"
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setIsFolderModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                      <button onClick={handleCreateFolder} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">Create</button>
                  </div>
              </div>
          </div>
      );
  };

  const renderCRModal = () => {
    if (!isCRModalOpen) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Request Change / Revision</h3>
                <p className="text-sm text-slate-500 mb-4">
                    Please provide a reason for this change request. This will be sent to the document owner for approval.
                </p>
                <textarea
                    className="w-full p-3 border border-slate-300 rounded mb-4 h-32 text-sm outline-none focus:border-emerald-500"
                    placeholder="Describe the reason for change..."
                    value={crReason}
                    onChange={(e) => setCrReason(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                    <button onClick={() => setIsCRModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                    <button onClick={handleRequestChange} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">Submit Request</button>
                </div>
            </div>
        </div>
    );
  };

  const renderTrainingModal = () => {
    if (!isTrainingModalOpen || !trainingDocId) return null;
    const doc = docs.find(d => d.id === trainingDocId);
    
    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
             <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Assign Training</h3>
                <p className="text-sm text-slate-500 mb-6">Select roles and locations that require training on <span className="font-semibold">{doc?.docNumber}</span>.</p>
                
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Roles</label>
                        <div className="grid grid-cols-2 gap-2">
                            {ROLES.map(role => (
                                <label key={role.id} className="flex items-center gap-2 text-sm p-2 border rounded hover:bg-slate-50 cursor-pointer">
                                    <input type="checkbox" className="rounded text-emerald-600" />
                                    {role.name}
                                </label>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Locations</label>
                        <div className="grid grid-cols-2 gap-2">
                            {LOCATIONS.map(loc => (
                                <label key={loc.id} className="flex items-center gap-2 text-sm p-2 border rounded hover:bg-slate-50 cursor-pointer">
                                    <input type="checkbox" className="rounded text-emerald-600" />
                                    {loc.name}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <button onClick={() => setIsTrainingModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                    <button onClick={handleAssignTraining} className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700">Assign Training</button>
                </div>
             </div>
        </div>
    );
  };

  const renderMoveModal = () => {
    if (!movingDoc) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Move Document</h3>
                <p className="text-sm text-slate-500 mb-4">Select the destination folder for <span className="font-bold">{movingDoc.docNumber}</span>.</p>
                
                <div className="space-y-4">
                    <select 
                        className="w-full p-3 border border-slate-300 rounded outline-none bg-white text-sm"
                        value={moveTargetFolderId}
                        onChange={e => setMoveTargetFolderId(e.target.value)}
                    >
                        <option value="root">General Docs (Root)</option>
                        {folders.filter(f => f.id !== 'root' && f.id !== movingDoc.folderId).map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={() => setMovingDoc(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                    <button onClick={handleMoveDocument} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Move Here</button>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fadeIn p-6">
       <div className="mb-2 shrink-0">
         <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><FileText className="text-orange-600" /> Document Control</h1>
         <p className="text-slate-500">Manage SOPs, Policies, and Procedures.</p>
       </div>

       <div className="flex-1 overflow-hidden min-h-0">
          {view === 'LIST' && renderList()}
          {view === 'EDITOR' && renderEditor()}
          {view === 'VIEWER' && renderViewer()}
          {view === 'CHANGE_REQUESTS' && renderChangeRequests()}
          {view === 'TEMPLATES' && renderTemplates()}
       </div>

       {/* Modals */}
       {renderCRModal()}
       {renderTrainingModal()}
       {renderFolderModal()}
       {renderMoveModal()}
    </div>
  );
};

export default DocumentModule;
