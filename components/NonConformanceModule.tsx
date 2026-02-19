
import React, { useState, useEffect } from 'react';
import { 
  User, 
  NCRRecord, 
  NCRStatus, 
  NCRAction, 
  QATicket, 
  ModuleId,
  UserRole,
  NCRGlobalConfig,
  NCRCategory
} from '../types';
import { 
  NCR_RECORDS, 
  QA_TICKETS, 
  QA_INSPECTION_RECORDS,
  QA_CONFIG,
  NCR_CONFIG,
  USERS, 
  updateNcrRecords,
  updateNCRConfig
} from '../mockData';
import { 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  ArrowLeft, 
  Filter, 
  ClipboardList, 
  ShieldAlert, 
  User as UserIcon,
  RefreshCw,
  Trash2,
  PackageCheck,
  DollarSign,
  CalendarClock,
  Settings,
  Save,
  Users as UsersIcon,
  Target,
  Tag,
  Plus,
  Send,
  XCircle,
  MessageSquare
} from 'lucide-react';

interface NonConformanceModuleProps {
  currentUser: User;
}

const NonConformanceModule: React.FC<NonConformanceModuleProps> = ({ currentUser }) => {
  const [view, setView] = useState<'LIST' | 'DETAIL' | 'CONFIG'>('LIST');
  const [ncrs, setNcrs] = useState<NCRRecord[]>(NCR_RECORDS);
  const [config, setConfig] = useState<NCRGlobalConfig>(NCR_CONFIG);
  const [selectedNcr, setSelectedNcr] = useState<NCRRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [searchTerm, setSearchTerm] = useState('');

  // Form States
  const [dispositionData, setDispositionData] = useState<{
    action: NCRAction | '';
    justification: string;
    qty: string;
    price: string;
    ncrOwnerId: string;
    category: string;
    subCategory: string;
  }>({ action: '', justification: '', qty: '', price: '', ncrOwnerId: '', category: '', subCategory: '' });

  const [rcaData, setRcaData] = useState<{
    rootCause: string;
    correctiveAction: string;
    assignedTo: string;
    dueDate: string;
  }>({ rootCause: '', correctiveAction: '', assignedTo: '', dueDate: '' });

  // Config UI State
  const [newCatName, setNewCatName] = useState('');
  const [newSubCatName, setNewSubCatName] = useState('');
  const [selectedCatIdForSub, setSelectedCatIdForSub] = useState('');

  // --- Auto-Discovery Logic ---
  useEffect(() => {
    const failedInspections = QA_INSPECTION_RECORDS.filter(i => i.isNcrTriggered);
    let hasUpdates = false;
    let currentNcrs = [...ncrs];

    failedInspections.forEach(insp => {
      const exists = currentNcrs.find(n => n.inspectionId === insp.id);
      if (!exists) {
        const formConfig = QA_CONFIG.forms.find(f => f.id === insp.formId);
        const newNcr: NCRRecord = {
          id: `NCR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          ticketId: insp.ticketId,
          inspectionType: formConfig?.name || 'Quality Inspection',
          inspectionId: insp.id,
          inspectorId: insp.inspectorId,
          detectedAt: insp.createdAt,
          status: NCRStatus.OPEN
        };
        currentNcrs.push(newNcr);
        hasUpdates = true;
      }
    });

    if (hasUpdates) {
      setNcrs(currentNcrs);
      updateNcrRecords(currentNcrs);
    }
  }, []);

  // --- Actions ---

  const handleSelectNcr = (ncr: NCRRecord) => {
    setSelectedNcr(ncr);
    setDispositionData({
        action: ncr.dispositionAction || '',
        justification: ncr.justification || '',
        qty: ncr.defectiveQuantity?.toString() || '',
        price: ncr.pricePerThousand?.toString() || '',
        ncrOwnerId: ncr.ncrOwnerId || '',
        category: ncr.category || '',
        subCategory: ncr.subCategory || ''
    });
    setRcaData({
        rootCause: ncr.rootCause || '',
        correctiveAction: ncr.correctiveAction || '',
        assignedTo: ncr.assignedToUserId || '',
        dueDate: ncr.rcaDueDate || ''
    });
    setView('DETAIL');
  };

  const submitDisposition = () => {
    if (!selectedNcr) return;
    if (!dispositionData.action || !dispositionData.justification || !dispositionData.qty || !dispositionData.price || !dispositionData.ncrOwnerId || !dispositionData.category) {
        alert("All disposition fields including Category and Owner are mandatory.");
        return;
    }

    const updatedNcr: NCRRecord = {
        ...selectedNcr,
        status: NCRStatus.PENDING_RCA,
        dispositionAction: dispositionData.action as NCRAction,
        justification: dispositionData.justification,
        defectiveQuantity: parseFloat(dispositionData.qty),
        pricePerThousand: parseFloat(dispositionData.price),
        ncrOwnerId: dispositionData.ncrOwnerId,
        category: dispositionData.category,
        subCategory: dispositionData.subCategory,
        dispositionedBy: currentUser.id,
        dispositionedAt: new Date().toISOString()
    };

    const updatedList = ncrs.map(n => n.id === selectedNcr.id ? updatedNcr : n);
    setNcrs(updatedList);
    updateNcrRecords(updatedList);
    setSelectedNcr(updatedNcr);
  };

  const submitForReview = () => {
    if (!selectedNcr) return;
    if (!rcaData.rootCause || !rcaData.correctiveAction) {
        alert("Root Cause and Corrective Action are mandatory to submit for review.");
        return;
    }

    const updatedNcr: NCRRecord = {
        ...selectedNcr,
        status: NCRStatus.PENDING_REVIEW,
        rootCause: rcaData.rootCause,
        correctiveAction: rcaData.correctiveAction,
        assignedToUserId: rcaData.assignedTo,
        rcaDueDate: rcaData.dueDate,
        submittedForReviewAt: new Date().toISOString()
    };

    const updatedList = ncrs.map(n => n.id === selectedNcr.id ? updatedNcr : n);
    setNcrs(updatedList);
    updateNcrRecords(updatedList);
    setSelectedNcr(updatedNcr);
    alert("RCA submitted to NCR Owner for review.");
  };

  const ownerCloseNcr = () => {
    if (!selectedNcr) return;
    const updatedNcr: NCRRecord = {
        ...selectedNcr,
        status: NCRStatus.CLOSED,
        resolvedByUserId: selectedNcr.assignedToUserId,
        closedAt: new Date().toISOString()
    };

    const updatedList = ncrs.map(n => n.id === selectedNcr.id ? updatedNcr : n);
    setNcrs(updatedList);
    updateNcrRecords(updatedList);
    setSelectedNcr(updatedNcr);
    alert("NCR has been officially closed.");
  };

  const ownerRejectRca = () => {
    if (!selectedNcr) return;
    const updatedNcr: NCRRecord = {
        ...selectedNcr,
        status: NCRStatus.PENDING_RCA // Revert to RCA phase
    };

    const updatedList = ncrs.map(n => n.id === selectedNcr.id ? updatedNcr : n);
    setNcrs(updatedList);
    updateNcrRecords(updatedList);
    setSelectedNcr(updatedNcr);
    alert("RCA rejected. It has been sent back for further investigation.");
  };

  const saveRcaAssignment = () => {
    if (!selectedNcr) return;
    const updatedNcr: NCRRecord = {
        ...selectedNcr,
        assignedToUserId: rcaData.assignedTo,
        rcaDueDate: rcaData.dueDate
    };
    const updatedList = ncrs.map(n => n.id === selectedNcr.id ? updatedNcr : n);
    setNcrs(updatedList);
    updateNcrRecords(updatedList);
    setSelectedNcr(updatedNcr);
    alert('Assignment and Due Date saved.');
  };

  const calculateTotalCost = () => {
    const qty = parseFloat(dispositionData.qty || '0');
    const price = parseFloat(dispositionData.price || '0');
    if (!qty || !price) return '0.00';
    return (qty * price).toFixed(2);
  };

  const setDueDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setRcaData({ ...rcaData, dueDate: date.toISOString().split('T')[0] });
  };

  const getRcaStatusLabel = () => {
    if (selectedNcr?.status === NCRStatus.CLOSED) return { text: 'COMPLETE', color: 'bg-green-100 text-green-700 border-green-200' };
    if (selectedNcr?.status === NCRStatus.PENDING_REVIEW) return { text: 'PENDING OWNER REVIEW', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' };
    if (!rcaData.dueDate) return null;
    
    const now = new Date();
    now.setHours(0,0,0,0);
    const due = new Date(rcaData.dueDate);
    due.setHours(0,0,0,0);

    const diffTime = due.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return { text: `OVERDUE (${Math.abs(daysLeft)} DAYS)`, color: 'bg-red-100 text-red-700 border-red-200' };
    return { text: `IN PROCESS (${daysLeft} DAYS LEFT)`, color: 'bg-blue-100 text-blue-700 border-blue-200' };
  };

  // --- Settings Handlers ---
  const toggleConfigUser = (userId: string, listKey: 'ownerUserIds' | 'rcaCompleterUserIds') => {
    const currentList = config[listKey];
    const newList = currentList.includes(userId) 
        ? currentList.filter(id => id !== userId)
        : [...currentList, userId];
    
    const updatedConfig = { ...config, [listKey]: newList };
    setConfig(updatedConfig);
    updateNCRConfig(updatedConfig);
  };

  const addCategory = () => {
      if (!newCatName) return;
      const newCat: NCRCategory = {
          id: `ncat-${Date.now()}`,
          name: newCatName,
          subCategories: []
      };
      const updatedConfig = { ...config, categories: [...config.categories, newCat] };
      setConfig(updatedConfig);
      updateNCRConfig(updatedConfig);
      setNewCatName('');
  };

  const addSubCategory = () => {
      if (!newSubCatName || !selectedCatIdForSub) return;
      const updatedCats = config.categories.map(c => {
          if (c.id === selectedCatIdForSub) {
              return { ...c, subCategories: [...c.subCategories, newSubCatName] };
          }
          return c;
      });
      const updatedConfig = { ...config, categories: updatedCats };
      setConfig(updatedConfig);
      updateNCRConfig(updatedConfig);
      setNewSubCatName('');
  };

  const deleteCategory = (id: string) => {
      const updatedCats = config.categories.filter(c => c.id !== id);
      const updatedConfig = { ...config, categories: updatedCats };
      setConfig(updatedConfig);
      updateNCRConfig(updatedConfig);
  };

  // --- Views ---

  const renderConfig = () => (
      <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-fadeIn">
          <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
              <button onClick={() => setView('LIST')} className="p-2 hover:bg-slate-200 rounded-full"><ArrowLeft size={24} /></button>
              <h1 className="text-2xl font-bold text-slate-800">NCR Settings</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Categories Manager */}
              <div className="md:col-span-2 lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2"><Tag size={20} className="text-purple-600" /> NCR Categories</h3>
                  
                  <div className="flex gap-4 mb-6">
                      <input 
                        type="text" 
                        className="flex-1 p-2 border border-slate-200 rounded-lg text-sm" 
                        placeholder="New Category Name"
                        value={newCatName}
                        onChange={e => setNewCatName(e.target.value)}
                      />
                      <button onClick={addCategory} className="px-4 py-2 bg-slate-800 text-white rounded-lg font-medium text-sm">Add Category</button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-slate-50 p-4 rounded-lg">
                      <select 
                        className="p-2 border border-slate-200 rounded-lg bg-white text-sm"
                        value={selectedCatIdForSub}
                        onChange={e => setSelectedCatIdForSub(e.target.value)}
                      >
                          <option value="">Select Category...</option>
                          {config.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <input 
                        type="text" 
                        className="flex-1 p-2 border border-slate-200 rounded-lg text-sm" 
                        placeholder="New Sub-Category"
                        value={newSubCatName}
                        onChange={e => setNewSubCatName(e.target.value)}
                      />
                      <button onClick={addSubCategory} className="px-4 py-2 bg-slate-800 text-white rounded-lg font-medium text-sm">Add Sub-Cat</button>
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {config.categories.map(cat => (
                          <div key={cat.id} className="border border-slate-200 rounded-lg p-4">
                              <div className="flex justify-between items-center mb-2">
                                  <h4 className="font-bold text-slate-800">{cat.name}</h4>
                                  <button onClick={() => deleteCategory(cat.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                  {cat.subCategories.length === 0 && <span className="text-xs text-slate-400 italic">No sub-categories</span>}
                                  {cat.subCategories.map((sub, idx) => (
                                      <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200">{sub}</span>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Users Lists */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-lg text-slate-800 mb-2 flex items-center gap-2"><Target size={20} className="text-blue-600" /> Authorized NCR Owners</h3>
                    <div className="space-y-1 max-h-64 overflow-y-auto pr-2">
                        {USERS.map(user => (
                            <label key={user.id} className="flex items-center gap-3 p-2 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={config.ownerUserIds.includes(user.id)}
                                  onChange={() => toggleConfigUser(user.id, 'ownerUserIds')}
                                  className="w-4 h-4 text-blue-600" 
                                />
                                <div className="text-xs">
                                    <p className="font-bold">{user.name}</p>
                                    <p className="text-slate-400 uppercase">{user.role}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-lg text-slate-800 mb-2 flex items-center gap-2"><ShieldAlert size={20} className="text-amber-600" /> Authorized RCA Completers</h3>
                    <div className="space-y-1 max-h-64 overflow-y-auto pr-2">
                        {USERS.map(user => (
                            <label key={user.id} className="flex items-center gap-3 p-2 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={config.rcaCompleterUserIds.includes(user.id)}
                                  onChange={() => toggleConfigUser(user.id, 'rcaCompleterUserIds')}
                                  className="w-4 h-4 text-amber-600" 
                                />
                                <div className="text-xs">
                                    <p className="font-bold">{user.name}</p>
                                    <p className="text-slate-400 uppercase">{user.role}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
              </div>
          </div>
      </div>
  );

  const renderList = () => {
    const filtered = ncrs.filter(n => {
        const ticket = QA_TICKETS.find(t => t.id === n.ticketId);
        const matchesSearch = ticket?.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) || n.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'OPEN' ? n.status !== NCRStatus.CLOSED : n.status === NCRStatus.CLOSED;
        return matchesSearch && matchesTab;
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex gap-2 w-full md:w-auto">
              <button 
                onClick={() => setActiveTab('OPEN')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'OPEN' ? 'bg-red-100 text-red-700 ring-1 ring-red-200' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                 <AlertTriangle size={16} /> Open NCRs
              </button>
              <button 
                onClick={() => setActiveTab('CLOSED')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'CLOSED' ? 'bg-green-100 text-green-700 ring-1 ring-green-200' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                 <CheckCircle size={16} /> Closed / Archived
              </button>
           </div>
           
           <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search NCR # or Job #..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>
              {currentUser.role === UserRole.SUPER_ADMIN && (
                <button onClick={() => setView('CONFIG')} className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 shadow-sm">
                   <Settings size={18} />
                </button>
              )}
           </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
           <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-xs">
                        <tr>
                            <th className="px-6 py-4">NCR ID</th>
                            <th className="px-6 py-4">Job Ticket</th>
                            <th className="px-6 py-4">Source</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-500 italic">No NCR records found.</td></tr>
                        ) : (
                            filtered.map(ncr => {
                                const ticket = QA_TICKETS.find(t => t.id === ncr.ticketId);
                                return (
                                <tr key={ncr.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold text-amber-600">{ncr.id.split('-').slice(0,3).join('-')}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800">{ticket?.ticketNumber || 'Unknown'}</div>
                                        <div className="text-[10px] text-slate-400 font-mono">{ncr.category || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{ncr.inspectionType}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border ${
                                            ncr.status === NCRStatus.OPEN ? 'bg-red-100 text-red-700 border-red-200' :
                                            ncr.status === NCRStatus.PENDING_RCA ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                            ncr.status === NCRStatus.PENDING_REVIEW ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                                            'bg-green-100 text-green-700 border-green-200'
                                        }`}>
                                            {ncr.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => handleSelectNcr(ncr)} className="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase tracking-wide">Review</button>
                                    </td>
                                </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
           </div>
        </div>
      </div>
    );
  };

  const renderDetail = () => {
    if (!selectedNcr) return null;
    const ticket = QA_TICKETS.find(t => t.id === selectedNcr.ticketId);
    
    const canDisposition = selectedNcr.status === NCRStatus.OPEN;
    const canSubmitForReview = selectedNcr.status === NCRStatus.PENDING_RCA && currentUser.id === selectedNcr.assignedToUserId;
    const isOwnerReviewing = selectedNcr.status === NCRStatus.PENDING_REVIEW && currentUser.id === selectedNcr.ncrOwnerId;
    const isClosed = selectedNcr.status === NCRStatus.CLOSED;
    
    const rcaStatus = getRcaStatusLabel();

    // List of users available for owner dropdown
    const availableOwners = USERS.filter(u => config.ownerUserIds.includes(u.id));
    // List of users available for RCA assignment
    const availableRcaCompleters = USERS.filter(u => config.rcaCompleterUserIds.includes(u.id));

    // Category filtering
    const selectedCatObj = config.categories.find(c => c.name === dispositionData.category);
    const subCategories = selectedCatObj ? selectedCatObj.subCategories : [];

    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
         <button onClick={() => setView('LIST')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium mb-4"><ArrowLeft size={18} /> Back to NCR List</button>
         
         {/* Header */}
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
               <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
                  <ShieldAlert size={32} />
               </div>
               <div>
                  <h1 className="text-2xl font-black text-slate-900">{selectedNcr.id.split('-').slice(0,3).join('-')}</h1>
                  <p className="text-slate-500 font-medium">Job: {ticket?.ticketNumber} • {selectedNcr.inspectionType}</p>
               </div>
            </div>
            <div className="text-right">
                <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border ${
                    selectedNcr.status === NCRStatus.OPEN ? 'bg-red-100 text-red-700 border-red-200' :
                    selectedNcr.status === NCRStatus.PENDING_RCA ? 'bg-orange-100 text-orange-700 border-orange-200' :
                    selectedNcr.status === NCRStatus.PENDING_REVIEW ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                    'bg-green-100 text-green-700 border-green-200'
                }`}>
                    {selectedNcr.status.replace('_', ' ')}
                </span>
                <p className="text-xs text-slate-400 mt-2 font-mono">Detected: {new Date(selectedNcr.detectedAt).toLocaleString()}</p>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Column: Disposition */}
            <div className={`p-6 rounded-2xl border transition-all ${isClosed || !canDisposition ? 'bg-slate-50 border-slate-200 opacity-80' : 'bg-white border-blue-200 shadow-md ring-1 ring-blue-100'}`}>
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-4 mb-6 flex items-center gap-2">
                  <ClipboardList size={18} className="text-blue-600" /> Stage 1: Disposition Review
               </h3>
               
               <div className="space-y-6">
                  {/* Category & Sub-Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Category</label>
                        <select 
                            disabled={!canDisposition}
                            className="w-full p-3 border border-slate-200 rounded-xl outline-none bg-white focus:ring-2 focus:ring-blue-500 text-sm"
                            value={dispositionData.category}
                            onChange={e => setDispositionData({...dispositionData, category: e.target.value, subCategory: ''})}
                        >
                            <option value="">Select Category...</option>
                            {config.categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Sub-Category</label>
                        <select 
                            disabled={!canDisposition || !dispositionData.category}
                            className="w-full p-3 border border-slate-200 rounded-xl outline-none bg-white focus:ring-2 focus:ring-blue-500 text-sm"
                            value={dispositionData.subCategory}
                            onChange={e => setDispositionData({...dispositionData, subCategory: e.target.value})}
                        >
                            <option value="">Select Sub-Category...</option>
                            {subCategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                        </select>
                    </div>
                  </div>

                  {/* NCR Owner Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Owner of NCR</label>
                    <div className="relative">
                        <UsersIcon size={18} className="absolute left-3 top-3.5 text-slate-400" />
                        <select 
                            disabled={!canDisposition}
                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none bg-white focus:ring-2 focus:ring-blue-500 text-sm"
                            value={dispositionData.ncrOwnerId}
                            onChange={e => setDispositionData({...dispositionData, ncrOwnerId: e.target.value})}
                        >
                            <option value="">Select NCR Owner...</option>
                            {availableOwners.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                            ))}
                        </select>
                    </div>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Action</label>
                     <div className="flex gap-2">
                        {[NCRAction.RELEASE, NCRAction.DISCARD, NCRAction.REWORK].map(action => (
                           <button 
                             key={action}
                             disabled={!canDisposition}
                             onClick={() => setDispositionData({...dispositionData, action})}
                             className={`flex-1 py-3 rounded-lg font-bold text-xs uppercase flex flex-col items-center gap-1 transition-all ${
                                dispositionData.action === action 
                                ? 'bg-slate-800 text-white shadow-lg' 
                                : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                             } ${!canDisposition && dispositionData.action !== action ? 'opacity-50' : ''}`}
                           >
                              {action === NCRAction.RELEASE && <PackageCheck size={18} />}
                              {action === NCRAction.DISCARD && <Trash2 size={18} />}
                              {action === NCRAction.REWORK && <RefreshCw size={18} />}
                              {action}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Defective Qty</label>
                        <input 
                          type="number" 
                          disabled={!canDisposition}
                          className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                          placeholder="0"
                          value={dispositionData.qty}
                          onChange={e => setDispositionData({...dispositionData, qty: e.target.value})}
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Price per unit ($)</label>
                        <div className="relative">
                           <DollarSign size={16} className="absolute left-3 top-3.5 text-slate-400" />
                           <input 
                             type="number" 
                             disabled={!canDisposition}
                             className="w-full pl-9 pr-3 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                             placeholder="0.00"
                             value={dispositionData.price}
                             onChange={e => setDispositionData({...dispositionData, price: e.target.value})}
                           />
                        </div>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Total Cost ($)</label>
                        <div className="relative">
                           <DollarSign size={16} className="absolute left-3 top-3.5 text-slate-400" />
                           <input 
                             type="text" 
                             disabled
                             className="w-full pl-9 pr-3 py-3 border border-slate-200 rounded-xl outline-none bg-slate-100 font-bold text-slate-700 cursor-not-allowed"
                             placeholder="0.00"
                             value={calculateTotalCost()}
                             readOnly
                           />
                        </div>
                     </div>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Justification / Notes</label>
                     <textarea 
                       disabled={!canDisposition}
                       className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm h-32 resize-none disabled:bg-slate-100"
                       placeholder="Explain the decision..."
                       value={dispositionData.justification}
                       onChange={e => setDispositionData({...dispositionData, justification: e.target.value})}
                     />
                  </div>

                  {canDisposition && (
                     <button 
                       onClick={submitDisposition}
                       className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
                     >
                        Confirm Disposition <CheckCircle size={20} />
                     </button>
                  )}
               </div>
            </div>

            {/* Right Column: RCA & Review */}
            <div className={`p-6 rounded-2xl border transition-all ${canDisposition ? 'opacity-50 pointer-events-none bg-slate-50 border-slate-200' : 'bg-white border-amber-200 shadow-md ring-1 ring-amber-100'}`}>
               <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-6">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                     <ShieldAlert size={18} className="text-amber-600" /> Stage 2: Root Cause (RCA)
                  </h3>
                  {rcaStatus && (
                     <span className={`px-2 py-1 rounded text-[10px] font-black border ${rcaStatus.color}`}>
                        {rcaStatus.text}
                     </span>
                  )}
               </div>

               <div className="space-y-6">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Root Cause Analysis</label>
                     <textarea 
                       disabled={!canSubmitForReview}
                       className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-sm h-32 resize-none disabled:bg-slate-100"
                       placeholder="Why did this happen? (5 Whys)"
                       value={rcaData.rootCause}
                       onChange={e => setRcaData({...rcaData, rootCause: e.target.value})}
                     />
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Corrective Action (CAPA)</label>
                     <textarea 
                       disabled={!canSubmitForReview}
                       className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-sm h-32 resize-none disabled:bg-slate-100"
                       placeholder="Steps taken to prevent recurrence..."
                       value={rcaData.correctiveAction}
                       onChange={e => setRcaData({...rcaData, correctiveAction: e.target.value})}
                     />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Assigned To (RCA User)</label>
                        <div className="relative">
                           <UserIcon size={18} className="absolute left-3 top-3.5 text-slate-400" />
                           <select 
                             disabled={!canSubmitForReview && selectedNcr.status !== NCRStatus.PENDING_RCA}
                             value={rcaData.assignedTo}
                             onChange={e => setRcaData({...rcaData, assignedTo: e.target.value})}
                             className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 bg-white disabled:bg-slate-100 text-sm"
                           >
                              <option value="">Select User...</option>
                              {availableRcaCompleters.map(u => (
                                 <option key={u.id} value={u.id}>{u.name}</option>
                              ))}
                           </select>
                        </div>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Due Date</label>
                        <div className="relative">
                           <CalendarClock size={18} className="absolute left-3 top-3.5 text-slate-400" />
                           <input 
                             type="date"
                             disabled={!canSubmitForReview && selectedNcr.status !== NCRStatus.PENDING_RCA}
                             value={rcaData.dueDate}
                             onChange={e => setRcaData({...rcaData, dueDate: e.target.value})}
                             className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 bg-white disabled:bg-slate-100 text-sm"
                           />
                        </div>
                        {(canSubmitForReview || selectedNcr.status === NCRStatus.PENDING_RCA) && (
                           <div className="flex gap-2 mt-2">
                              <button onClick={() => setDueDate(15)} className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-600 transition-colors">+15 Days</button>
                              <button onClick={() => setDueDate(30)} className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-600 transition-colors">+30 Days</button>
                           </div>
                        )}
                     </div>
                  </div>

                  {canSubmitForReview && (
                     <div className="flex gap-3">
                        <button 
                           onClick={saveRcaAssignment}
                           className="flex-1 py-4 bg-white border-2 border-amber-100 text-amber-700 rounded-xl font-bold hover:bg-amber-50 transition-all flex items-center justify-center gap-2"
                        >
                           Save Progress
                        </button>
                        <button 
                           onClick={submitForReview}
                           className="flex-[2] py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
                        >
                           Submit for Owner Review <Send size={20} />
                        </button>
                     </div>
                  )}

                  {isOwnerReviewing && (
                    <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-200 animate-fadeIn">
                       <h4 className="font-bold text-indigo-900 flex items-center gap-2 mb-4"><MessageSquare size={18} /> Owner's Verdict</h4>
                       <p className="text-xs text-indigo-700 mb-6">You are the assigned owner of this NCR. Review the root cause and corrective actions below and decide whether to close or reject.</p>
                       <div className="flex flex-col md:flex-row gap-3">
                          <button 
                            onClick={ownerRejectRca}
                            className="flex-1 py-3 bg-white border border-red-200 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-50"
                          >
                             <XCircle size={18} /> Reject & Reassign
                          </button>
                          <button 
                            onClick={ownerCloseNcr}
                            className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                          >
                             <CheckCircle size={18} /> Approve & Close NCR
                          </button>
                       </div>
                    </div>
                  )}

                  {!canSubmitForReview && !isOwnerReviewing && !canDisposition && !isClosed && (
                    <div className="p-4 bg-slate-100 rounded-lg text-xs text-slate-500 italic text-center">
                        Wait for {selectedNcr.status === NCRStatus.PENDING_REVIEW ? USERS.find(u=>u.id===selectedNcr.ncrOwnerId)?.name : USERS.find(u=>u.id===selectedNcr.assignedToUserId)?.name} to complete their stage.
                    </div>
                  )}
               </div>
            </div>

         </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fadeIn p-4 md:p-6 overflow-y-auto">
       <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
             <AlertTriangle size={28} />
          </div>
          <div>
             <h1 className="text-2xl font-bold text-slate-900">Non-Conformances (NCR)</h1>
             <p className="text-slate-500">Manage quality failures, dispositions, and corrective actions.</p>
          </div>
       </div>

       {view === 'LIST' && renderList()}
       {view === 'DETAIL' && renderDetail()}
       {view === 'CONFIG' && renderConfig()}
    </div>
  );
};

export default NonConformanceModule;
