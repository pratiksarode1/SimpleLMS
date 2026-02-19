
import React, { useState, useRef } from 'react';
import { 
  User, 
  QATicket, 
  QATicketStatus, 
  QAInspectionStage,
  QAFieldType,
  QAFieldConfig,
  QAFormConfig,
  QAGlobalConfig,
  QAInspectionRecord,
  UserRole
} from '../types';
import { 
  QA_TICKETS, 
  MASTER_ITEMS, 
  USERS, 
  QA_CONFIG,
  QA_INSPECTION_RECORDS,
  updateQATickets,
  updateQAInspectionRecords,
  updateQAConfig
} from '../mockData';
import { 
  ClipboardCheck, 
  Plus, 
  Search, 
  ArrowLeft, 
  Printer, 
  Settings, 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  ShieldAlert, 
  History, 
  FileText, 
  Trash2,
  Lock,
  Unlock,
  Save,
  Image as ImageIcon,
  Layers,
  Layout,
  Type,
  Hash,
  List,
  MousePointer2,
  Download,
  Upload,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  BookOpen,
  Edit3
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface QAInspectionModuleProps {
  currentUser: User;
}

type ViewMode = 'LIST' | 'CREATE' | 'DETAIL' | 'INSPECTION_FORM' | 'CONFIG';

const QAInspectionModule: React.FC<QAInspectionModuleProps> = ({ currentUser }) => {
  const [view, setView] = useState<ViewMode>('LIST');
  const [tickets, setTickets] = useState<QATicket[]>(QA_TICKETS);
  const [records, setRecords] = useState<QAInspectionRecord[]>(QA_INSPECTION_RECORDS);
  const [config, setConfig] = useState<QAGlobalConfig>(QA_CONFIG);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<QATicket | null>(null);
  const [activeForm, setActiveForm] = useState<QAFormConfig | null>(null);
  const [activeStage, setActiveStage] = useState<QAInspectionStage>(QAInspectionStage.MAKE_READY);

  // Guide State
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isEditingGuide, setIsEditingGuide] = useState(false);
  const [tempGuideContent, setTempGuideContent] = useState(config.inspectionGuide || '');

  // Form Field State
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});

  // Ticket Creation State
  const [newItemMode, setNewItemMode] = useState(false);
  const [ticketFormData, setTicketFormData] = useState<Partial<QATicket>>({
    ticketNumber: '', itemNumber: '', description: '', customerName: '', processType: 'FLEXO'
  });

  // Config UI State
  const [newFormName, setNewFormName] = useState('');
  const [newFormProcess, setNewFormProcess] = useState<'FLEXO' | 'CARTON'>('FLEXO');
  const [newFormStages, setNewFormStages] = useState<QAInspectionStage[]>([QAInspectionStage.MAKE_READY, QAInspectionStage.IN_PROCESS, QAInspectionStage.FINAL]);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [newField, setNewField] = useState<Partial<QAFieldConfig>>({ type: QAFieldType.PASS_FAIL_NA, isMandatory: true, failOptions: [] });
  const [logoUrl, setLogoUrl] = useState(config.companyLogoUrl || '');
  const logoInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLogoUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateTicket = () => {
    if (!ticketFormData.ticketNumber || !ticketFormData.itemNumber || !ticketFormData.processType) return;
    
    // Auto-assign matching dynamic forms
    const matchingForms = config.forms.filter(f => f.processType === ticketFormData.processType).map(f => f.id);

    // FIX: Add createdById property to new ticket object
    const newTicket: QATicket = {
      id: `TKT-${Date.now()}`,
      ticketNumber: ticketFormData.ticketNumber!,
      itemNumber: ticketFormData.itemNumber!,
      description: ticketFormData.description || '',
      customerName: ticketFormData.customerName || 'Unknown',
      processType: ticketFormData.processType as any,
      createdById: currentUser.id,
      createdAt: new Date().toISOString(),
      status: QATicketStatus.OPEN,
      isNewItemEntry: newItemMode,
      applicableFormIds: matchingForms
    };
    const updated = [newTicket, ...tickets];
    setTickets(updated);
    updateQATickets(updated);
    setView('LIST');
  };

  const handleStartInspection = (ticket: QATicket, form: QAFormConfig, stage: QAInspectionStage) => {
    setSelectedTicket(ticket);
    setActiveForm(form);
    setActiveStage(stage);
    
    if (stage === QAInspectionStage.MAKE_READY || stage === QAInspectionStage.FINAL) {
        const existing = records.find(r => r.ticketId === ticket.id && r.formId === form.id && r.stage === stage);
        if (existing) {
            // FIX: Use string conversion for replace
            alert(`A ${String(stage).replace('_', ' ')} record already exists for this form.`);
            return;
        }
    }

    const initialValues: Record<string, any> = {};
    form.fields.forEach(f => {
        if (f.type === QAFieldType.PASS_FAIL_NA) initialValues[f.id] = 'PASS';
    });
    setFieldValues(initialValues);
    setView('INSPECTION_FORM');
  };

  const handleSubmitInspection = () => {
    if (!selectedTicket || !activeForm) return;

    for (const field of activeForm.fields) {
        if (field.isMandatory && !fieldValues[field.id]) {
            alert(`Field "${field.label}" is mandatory.`);
            return;
        }
    }

    const hasFail = activeForm.fields.some(field => {
        const val = fieldValues[field.id];
        if (field.type === QAFieldType.PASS_FAIL_NA) return val === 'FAIL';
        if (field.type === QAFieldType.BUTTON_GROUP && field.failOptions) return field.failOptions.includes(val);
        return false;
    });

    const newRecord: QAInspectionRecord = {
        id: `REC-${Date.now()}`,
        ticketId: selectedTicket.id,
        formId: activeForm.id,
        inspectorId: currentUser.id,
        stage: activeStage,
        createdAt: new Date().toISOString(),
        values: fieldValues,
        isNcrTriggered: hasFail
    };

    const updatedRecords = [...records, newRecord];
    setRecords(updatedRecords);
    updateQAInspectionRecords(updatedRecords);

    const updatedTickets = tickets.map(t => {
        if (t.id === selectedTicket.id) {
            if (hasFail) return { ...t, status: QATicketStatus.LOCKED_NCR };
            // FIX: Ensure QATicketStatus.IN_PROGRESS is used correctly
            return { ...t, status: QATicketStatus.IN_PROGRESS };
        }
        return t;
    });
    setTickets(updatedTickets);
    updateQATickets(updatedTickets);

    setSelectedTicket(updatedTickets.find(t => t.id === selectedTicket.id) || null);
    setView('DETAIL');
    if (hasFail) alert("QUALITY FAILURE: Job has been LOCKED for Non-Conformance Review.");
  };

  const generateCOA = (ticket: QATicket) => {
    const doc = new jsPDF();
    const margin = 20;
    let y = 20;

    if (config.companyLogoUrl) {
        try { doc.addImage(config.companyLogoUrl, 'JPEG', margin, 10, 40, 20); y = 40; } 
        catch (e) { doc.setFontSize(18); doc.text("FRANKSTON PACKAGING", margin, y); y += 10; }
    } else {
        doc.setFontSize(18); doc.text("FRANKSTON PACKAGING", margin, y); y += 10;
    }

    doc.setFontSize(14);
    doc.text("CERTIFICATE OF ANALYSIS (COA)", margin, y); y += 10;
    
    doc.setFontSize(10);
    doc.text(`Job Number: ${ticket.ticketNumber}`, margin, y); y += 6;
    doc.text(`Item: ${ticket.itemNumber} - ${ticket.description}`, margin, y); y += 6;
    doc.text(`Customer: ${ticket.customerName}`, margin, y); y += 6;
    doc.text(`Date Released: ${new Date().toLocaleDateString()}`, margin, y); y += 10;
    
    doc.line(margin, y, 190, y); y += 10;

    const finalRecords = records.filter(r => r.ticketId === ticket.id && r.stage === QAInspectionStage.FINAL);
    
    if (finalRecords.length === 0) {
        doc.text("No final inspection records found.", margin, y);
    } else {
        finalRecords.forEach(rec => {
            const form = config.forms.find(f => f.id === rec.formId);
            doc.setFont("helvetica", "bold");
            doc.text(`Verification Stage: ${form?.name || 'Unknown'}`, margin, y); y += 8;
            doc.setFont("helvetica", "normal");
            
            form?.fields.forEach(field => {
                const val = rec.values[field.id] || '-';
                doc.text(`${field.label}: ${val}`, margin + 5, y); y += 6;
                if (y > 270) { doc.addPage(); y = 20; }
            });
            y += 4;
        });
    }

    doc.save(`COA_${ticket.ticketNumber}.pdf`);
  };

  const handleReleaseJob = () => {
    if (!selectedTicket) return;
    
    const applicable = selectedTicket.applicableFormIds || [];
    const missingFinals = applicable.filter(formId => {
        const form = config.forms.find(f => f.id === formId);
        // Only require final for forms that are configured for the FINAL stage
        if (!form?.applicableStages.includes(QAInspectionStage.FINAL)) return false;
        return !records.some(r => r.ticketId === selectedTicket.id && r.formId === formId && r.stage === QAInspectionStage.FINAL);
    });

    if (missingFinals.length > 0) {
        alert("Cannot release job. All applicable forms configured for 'FINAL' must be completed.");
        return;
    }

    const updated = tickets.map(t => t.id === selectedTicket.id ? { ...t, status: QATicketStatus.COMPLETED } : t);
    setTickets(updated);
    updateQATickets(updated);
    alert("Job Released successfully.");
    setView('LIST');
  };

  const handleToggleFormApplicability = (formId: string) => {
    if (!selectedTicket) return;
    const current = selectedTicket.applicableFormIds || [];
    const updatedIds = current.includes(formId) 
        ? current.filter(id => id !== formId)
        : [...current, formId];
    
    const updatedTickets = tickets.map(t => t.id === selectedTicket.id ? { ...t, applicableFormIds: updatedIds } : t);
    setTickets(updatedTickets);
    updateQATickets(updatedTickets);
    setSelectedTicket(updatedTickets.find(t => t.id === selectedTicket.id) || null);
  };

  const saveGuide = () => {
    const updatedConfig = { ...config, inspectionGuide: tempGuideContent };
    setConfig(updatedConfig);
    updateQAConfig(updatedConfig);
    setIsEditingGuide(false);
    alert("Inspection Guide saved.");
  };

  // --- Config Handlers ---

  const toggleFormStage = (stage: QAInspectionStage) => {
      setNewFormStages(prev => prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]);
  };

  const handleAddForm = () => {
      if (!newFormName || newFormStages.length === 0) {
          alert("Form name and at least one stage required.");
          return;
      }
      const newForm: QAFormConfig = {
          id: `frm-${Date.now()}`,
          name: newFormName,
          processType: newFormProcess,
          fields: [],
          applicableStages: newFormStages
      };
      const updated = { ...config, forms: [...config.forms, newForm] };
      setConfig(updated);
      updateQAConfig(updated);
      setNewFormName('');
  };

  const handleAddField = () => {
      if (!editingFormId || !newField.label) return;
      const field: QAFieldConfig = {
          id: `fld-${Date.now()}`,
          label: newField.label,
          type: newField.type || QAFieldType.TEXT,
          isMandatory: newField.isMandatory ?? true,
          options: newField.options || [],
          failOptions: newField.failOptions || []
      };
      
      const updatedForms = config.forms.map(f => {
          if (f.id === editingFormId) return { ...f, fields: [...f.fields, field] };
          return f;
      });
      const updatedConfig = { ...config, forms: updatedForms };
      setConfig(updatedConfig);
      updateQAConfig(updatedConfig);
      setNewField({ type: QAFieldType.PASS_FAIL_NA, isMandatory: true, failOptions: [] });
  };

  const toggleFailOption = (opt: string) => {
    const current = newField.failOptions || [];
    const updated = current.includes(opt) ? current.filter(o => o !== opt) : [...current, opt];
    setNewField({ ...newField, failOptions: updated });
  };

  const deleteField = (formId: string, fieldId: string) => {
    const updatedForms = config.forms.map(f => {
        if (f.id === formId) return { ...f, fields: f.fields.filter(fld => fld.id !== fieldId) };
        return f;
    });
    const updatedConfig = { ...config, forms: updatedForms };
    setConfig(updatedConfig);
    updateQAConfig(updatedConfig);
  };

  const deleteForm = (id: string) => {
      const updated = { ...config, forms: config.forms.filter(f => f.id !== id) };
      setConfig(updated);
      updateQAConfig(updated);
  };

  // --- Views ---

  const renderConfig = () => (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-fadeIn">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-4">
                <button onClick={() => setView('LIST')} className="p-2 hover:bg-slate-200 rounded-full"><ArrowLeft size={24} /></button>
                <h1 className="text-2xl font-bold text-slate-800">QA Module Configuration</h1>
            </div>
            <button onClick={() => { setConfig({...config, companyLogoUrl: logoUrl}); updateQAConfig({...config, companyLogoUrl: logoUrl}); alert("Saved."); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold flex items-center gap-2">
                <Save size={18} /> Save Settings
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><ImageIcon size={18} /> COA Logo</h3>
                    <div className="space-y-4">
                        {logoUrl && (
                            <div className="h-20 w-full border rounded-lg bg-slate-50 flex items-center justify-center p-2">
                                <img src={logoUrl} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                            </div>
                        )}
                        <input 
                            type="file" 
                            accept="image/*" 
                            ref={logoInputRef} 
                            onChange={handleLogoUpload} 
                            className="hidden" 
                        />
                        <button 
                            onClick={() => logoInputRef.current?.click()}
                            className="w-full py-2 bg-slate-100 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-200 flex items-center justify-center gap-2"
                        >
                            <Upload size={16} /> {logoUrl ? 'Change Logo' : 'Upload Logo'}
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Layout size={18} /> Forms</h3>
                    <div className="space-y-4 mb-4">
                        <input 
                            type="text" 
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm" 
                            placeholder="New Form Name" 
                            value={newFormName} 
                            onChange={e => setNewFormName(e.target.value)} 
                        />
                        <div className="flex gap-2">
                            {['FLEXO', 'CARTON'].map(p => (
                                <button key={p} onClick={() => setNewFormProcess(p as any)} className={`flex-1 py-1 rounded text-xs font-bold border ${newFormProcess === p ? 'bg-slate-800 text-white' : 'bg-white'}`}>{p}</button>
                            ))}
                        </div>
                        <div className="space-y-2 py-2 border-y border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase">Applicable Stages</p>
                            <div className="flex flex-col gap-2">
                                {Object.values(QAInspectionStage).map(stage => (
                                    <label key={stage} className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                                        <input type="checkbox" checked={newFormStages.includes(stage)} onChange={() => toggleFormStage(stage)} className="rounded" />
                                        {stage.replace('_', ' ')}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <button onClick={handleAddForm} className="w-full py-2 bg-slate-100 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-200">+ Add Form</button>
                    </div>
                    <div className="space-y-2">
                        {config.forms.map(form => (
                            <div 
                                key={form.id} 
                                onClick={() => { setEditingFormId(form.id); setNewFormStages(form.applicableStages || []); }}
                                className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center group ${editingFormId === form.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}
                            >
                                <div>
                                    <p className="font-bold text-sm text-slate-800">{form.name}</p>
                                    <div className="flex gap-2">
                                        <p className="text-[9px] text-slate-400 uppercase font-black">{form.processType}</p>
                                        <p className="text-[9px] text-blue-500 uppercase font-bold">{form.applicableStages?.length || 0} Stages</p>
                                    </div>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); deleteForm(form.id); }} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2">
                {editingFormId ? (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[700px]">
                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">Fields for: {config.forms.find(f => f.id === editingFormId)?.name}</h3>
                            <span className="text-xs text-slate-400 uppercase font-black">{config.forms.find(f => f.id === editingFormId)?.fields.length} Fields</span>
                        </div>
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input 
                                    type="text" 
                                    className="p-2 border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" 
                                    placeholder="Field Label (e.g. Color Match)" 
                                    value={newField.label || ''} 
                                    onChange={e => setNewField({...newField, label: e.target.value})} 
                                />
                                <select 
                                    className="p-2 border border-slate-300 rounded text-sm bg-white outline-none focus:ring-1 focus:ring-blue-500" 
                                    value={newField.type} 
                                    onChange={e => setNewField({...newField, type: e.target.value as QAFieldType, failOptions: []})}
                                >
                                    {Object.values(QAFieldType).map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                                </select>
                            </div>

                            {(newField.type === QAFieldType.DROPDOWN || newField.type === QAFieldType.BUTTON_GROUP) && (
                                <div className="space-y-4 bg-white p-4 rounded-lg border border-slate-200">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Define Options</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-2 border border-slate-300 rounded text-sm" 
                                            placeholder="Options (comma separated: Good, Bad, Okay)" 
                                            value={newField.options?.join(',') || ''}
                                            onChange={e => setNewField({...newField, options: e.target.value.split(',').map(o => o.trim()).filter(o => o !== '')})}
                                        />
                                    </div>
                                    
                                    {newField.options && newField.options.length > 0 && (
                                        <div>
                                            <label className="block text-[10px] font-black text-red-400 uppercase mb-2 flex items-center gap-1">
                                                <AlertTriangle size={10} /> Mark options that trigger Failure (NCR)
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {newField.options.map(opt => (
                                                    <button 
                                                        key={opt}
                                                        type="button"
                                                        onClick={() => toggleFailOption(opt)}
                                                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${newField.failOptions?.includes(opt) ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                    <input type="checkbox" checked={newField.isMandatory} onChange={e => setNewField({...newField, isMandatory: e.target.checked})} />
                                    Mandatory?
                                </label>
                                <button onClick={handleAddField} className="px-4 py-2 bg-slate-800 text-white rounded font-bold text-xs uppercase tracking-widest">Add Field</button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {config.forms.find(f => f.id === editingFormId)?.fields.map(field => (
                                <div key={field.id} className="p-3 border border-slate-100 rounded-lg flex items-center justify-between bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded shadow-sm text-slate-400">
                                            {field.type === QAFieldType.TEXT && <Type size={16} />}
                                            {field.type === QAFieldType.NUMBER && <Hash size={16} />}
                                            {field.type === QAFieldType.PASS_FAIL_NA && <CheckCircle size={16} />}
                                            {field.type === QAFieldType.BUTTON_GROUP && <MousePointer2 size={16} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-800">{field.label} {field.isMandatory && <span className="text-red-500">*</span>}</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[10px] text-slate-400 uppercase font-black">{field.type}</p>
                                                {field.failOptions && field.failOptions.length > 0 && (
                                                    <p className="text-[10px] text-red-400 font-bold italic">Fails on: {field.failOptions.join(', ')}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => deleteField(editingFormId, field.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-slate-200 rounded-xl text-slate-400 p-20">
                        <Settings size={48} className="mb-4 opacity-20" />
                        <p>Select a form to manage its fields</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );

  const renderDetail = () => {
    if (!selectedTicket) return null;
    const isLocked = selectedTicket.status === QATicketStatus.LOCKED_NCR;
    const isCompleted = selectedTicket.status === QATicketStatus.COMPLETED;
    
    // Get all forms for this process type
    const processForms = config.forms.filter(f => f.processType === selectedTicket.processType);
    const applicableFormIds = selectedTicket.applicableFormIds || [];

    return (
      <div className="space-y-6 pb-20 animate-fadeIn">
        <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setView('LIST')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium">
                <ArrowLeft size={18} /> Back to Job List
            </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${isLocked ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}><Layout size={32} /></div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900">{selectedTicket.ticketNumber}</h2>
                    <p className="text-slate-500 font-medium">{selectedTicket.itemNumber} • {selectedTicket.description}</p>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                {isCompleted && (
                    <button onClick={() => generateCOA(selectedTicket)} className="w-full sm:w-auto px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg font-bold flex items-center justify-center gap-2">
                        <Download size={18} /> Generate COA PDF
                    </button>
                )}
                {isLocked && <div className="px-4 py-2 bg-red-600 text-white rounded-lg font-black animate-pulse w-full text-center sm:w-auto">LOCKED: QUALITY FAILURE</div>}
                {!isLocked && !isCompleted && (
                    <button onClick={handleReleaseJob} className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg font-black uppercase tracking-wider hover:bg-green-700 shadow-lg">
                        Release Job
                    </button>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processForms.map(form => {
                const formId = form.id;
                const isApplicable = applicableFormIds.includes(formId);
                const formRecords = records.filter(r => r.ticketId === selectedTicket.id && r.formId === formId);
                
                const showMakeReady = form.applicableStages?.includes(QAInspectionStage.MAKE_READY);
                const showInProcess = form.applicableStages?.includes(QAInspectionStage.IN_PROCESS);
                const showFinal = form.applicableStages?.includes(QAInspectionStage.FINAL);

                const hasMakeReady = formRecords.some(r => r.stage === QAInspectionStage.MAKE_READY);
                const hasFinal = formRecords.some(r => r.stage === QAInspectionStage.FINAL);
                
                return (
                    <div key={formId} className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all ${!isApplicable ? 'opacity-50 grayscale' : ''}`}>
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                            <div className="flex flex-col">
                                <h3 className="font-bold text-slate-800">{form.name}</h3>
                                {!isApplicable && <span className="text-[10px] font-bold text-slate-400 uppercase">Not Applicable for this job</span>}
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => handleToggleFormApplicability(formId)}
                                    className={`p-1 rounded-md transition-colors ${isApplicable ? 'text-blue-600 hover:bg-blue-50' : 'text-slate-400 hover:bg-slate-100'}`}
                                    title={isApplicable ? "Mark as Not Applicable" : "Mark as Applicable"}
                                >
                                    {isApplicable ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                </button>
                                {isApplicable && (
                                    <div className="flex gap-1">
                                        {showMakeReady && <span className={`w-2.5 h-2.5 rounded-full ${hasMakeReady ? 'bg-green-500' : 'bg-slate-200'}`} title="Make Ready"></span>}
                                        {showInProcess && <span className={`w-2.5 h-2.5 rounded-full ${formRecords.some(r => r.stage === QAInspectionStage.IN_PROCESS) ? 'bg-blue-500' : 'bg-slate-200'}`} title="In Process"></span>}
                                        {showFinal && <span className={`w-2.5 h-2.5 rounded-full ${hasFinal ? 'bg-green-500' : 'bg-slate-200'}`} title="Final"></span>}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-4 space-y-2 flex-1">
                            {isApplicable ? (
                                <>
                                    {showMakeReady && (
                                        <button 
                                            disabled={isLocked || isCompleted} 
                                            onClick={() => handleStartInspection(selectedTicket, form, QAInspectionStage.MAKE_READY)}
                                            className={`w-full p-3 rounded-lg border-2 text-sm font-bold flex justify-between items-center transition-all ${hasMakeReady ? 'border-green-100 bg-green-50 text-green-700' : 'border-slate-100 text-slate-600 hover:border-blue-500'}`}
                                        >
                                            <span>1. Make Ready</span>
                                            {hasMakeReady ? <CheckCircle size={16} /> : <ChevronRight size={16} />}
                                        </button>
                                    )}
                                    {showInProcess && (
                                        <button 
                                            disabled={isLocked || isCompleted || (showMakeReady && !hasMakeReady)} 
                                            onClick={() => handleStartInspection(selectedTicket, form, QAInspectionStage.IN_PROCESS)}
                                            className="w-full p-3 rounded-lg border-2 border-slate-100 text-slate-600 text-sm font-bold flex justify-between items-center hover:border-blue-500 transition-all disabled:opacity-50"
                                        >
                                            <span>2. In-Process ({formRecords.filter(r => r.stage === QAInspectionStage.IN_PROCESS).length})</span>
                                            <Plus size={16} />
                                        </button>
                                    )}
                                    {showFinal && (
                                        <button 
                                            disabled={isLocked || isCompleted || (showMakeReady && !hasMakeReady)} 
                                            onClick={() => handleStartInspection(selectedTicket, form, QAInspectionStage.FINAL)}
                                            className={`w-full p-3 rounded-lg border-2 text-sm font-bold flex justify-between items-center transition-all ${hasFinal ? 'border-green-100 bg-green-50 text-green-700' : 'border-slate-100 text-slate-600 hover:border-blue-500'}`}
                                        >
                                            <span>3. Final Inspection</span>
                                            {hasFinal ? <CheckCircle size={16} /> : <ChevronRight size={16} />}
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full py-4 text-slate-300">
                                    <XCircle size={24} className="mb-2" />
                                    <p className="text-xs font-bold uppercase">Disabled</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 flex items-center gap-2"><History size={16} /> Inspection History</div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead><tr className="bg-slate-50 text-slate-500 font-bold"><th className="px-6 py-4">Form</th><th className="px-6 py-4">Stage</th><th className="px-6 py-4">Inspector</th><th className="px-6 py-4">Result</th><th className="px-6 py-4">Time</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {records.filter(r => r.ticketId === selectedTicket.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(rec => (
                            <tr key={rec.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-bold text-slate-700">{config.forms.find(f => f.id === rec.formId)?.name}</td>
                                <td className="px-6 py-4 font-black uppercase text-[10px]"><span className="px-2 py-1 bg-slate-100 rounded">{String(rec.stage).replace('_', ' ')}</span></td>
                                <td className="px-6 py-4">{USERS.find(u => u.id === rec.inspectorId)?.name}</td>
                                <td className="px-6 py-4">{rec.isNcrTriggered ? <span className="text-red-600 font-bold">FAIL</span> : <span className="text-green-600 font-bold">PASS</span>}</td>
                                <td className="px-6 py-4 text-slate-400">{new Date(rec.createdAt).toLocaleTimeString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    );
  };

  const renderInspectionForm = () => {
      if (!selectedTicket || !activeForm) return null;
      return (
          <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-fadeIn">
              <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                  <button onClick={() => setView('DETAIL')} className="p-2 hover:bg-slate-200 rounded-full"><ArrowLeft size={24} /></button>
                  <div>
                      <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase">{activeForm.name}</h2>
                      <p className="text-slate-500 font-bold">Stage: {String(activeStage).replace('_', ' ')} • Job: {selectedTicket.ticketNumber}</p>
                  </div>
              </div>

              <div className="bg-white p-4 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  {activeForm.fields.map(field => (
                      <div key={field.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50/30">
                          <div className="max-w-md">
                              <label className="block text-sm font-black text-slate-800 uppercase tracking-tight">{field.label} {field.isMandatory && <span className="text-red-500">*</span>}</label>
                              {field.helpText && <p className="text-xs text-slate-400 italic">{field.helpText}</p>}
                          </div>
                          <div className="w-full md:w-64">
                              {field.type === QAFieldType.PASS_FAIL_NA && (
                                  <div className="flex bg-white p-1 rounded-lg border border-slate-200">
                                      {['PASS', 'FAIL', 'NA'].map(opt => (
                                          <button key={opt} onClick={() => setFieldValues({...fieldValues, [field.id]: opt})} className={`flex-1 py-2 rounded font-black text-xs transition-all ${fieldValues[field.id] === opt ? (opt === 'PASS' ? 'bg-green-600 text-white' : opt === 'FAIL' ? 'bg-red-600 text-white' : 'bg-slate-300 text-slate-800') : 'text-slate-400'}`}>{opt}</button>
                                      ))}
                                  </div>
                              )}
                              {field.type === QAFieldType.TEXT && <input type="text" className="w-full p-2 border rounded-lg text-sm" value={fieldValues[field.id] || ''} onChange={e => setFieldValues({...fieldValues, [field.id]: e.target.value})} />}
                              {field.type === QAFieldType.NUMBER && <input type="number" className="w-full p-2 border rounded-lg text-sm" value={fieldValues[field.id] || ''} onChange={e => setFieldValues({...fieldValues, [field.id]: parseFloat(e.target.value)})} />}
                              {field.type === QAFieldType.TEXTAREA && <textarea className="w-full p-2 border rounded-lg text-sm h-20" value={fieldValues[field.id] || ''} onChange={e => setFieldValues({...fieldValues, [field.id]: e.target.value})} />}
                              {field.type === QAFieldType.BUTTON_GROUP && (
                                  <div className="flex flex-wrap gap-1">
                                      {field.options?.map(opt => (
                                          <button key={opt} onClick={() => setFieldValues({...fieldValues, [field.id]: opt})} className={`px-3 py-1 rounded text-[10px] font-bold border transition-all ${fieldValues[field.id] === opt ? (field.failOptions?.includes(opt) ? 'bg-red-600 text-white border-red-600' : 'bg-blue-600 text-white border-blue-600') : 'bg-white text-slate-500'}`}>{opt}</button>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>
                  ))}
              </div>

              <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-slate-200 flex justify-end gap-4 shadow-2xl z-20">
                    <button onClick={() => setView('DETAIL')} className="px-8 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-50">Cancel</button>
                    <button onClick={handleSubmitInspection} className="px-10 py-3 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 shadow-xl shadow-blue-900/20 flex items-center gap-2">Submit {String(activeStage).replace('_', ' ')} <CheckCircle size={18} /></button>
              </div>
          </div>
      );
  };

  const renderCreate = () => (
    <div className="max-w-2xl mx-auto space-y-6">
       <div className="flex items-center gap-2 mb-4"><button onClick={() => setView('LIST')} className="p-2 hover:bg-slate-100 rounded-full"><ArrowLeft size={20} /></button><h2 className="text-xl font-bold text-slate-800">Create New Job Ticket</h2></div>
       <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div><label className="block text-sm font-bold text-slate-700 mb-1">Ticket / Job Number</label><input type="text" className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. JOB-12345" value={ticketFormData.ticketNumber} onChange={e => setTicketFormData({...ticketFormData, ticketNumber: e.target.value})} /></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">Select Item</label><select className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white" onChange={(e) => {
              const val = e.target.value;
              if (val === 'NEW') { setNewItemMode(true); setTicketFormData({...ticketFormData, itemNumber: '', description: '', customerName: ''}); }
              else {
                  const item = MASTER_ITEMS.find(i => i.itemNumber === val);
                  if (item) setTicketFormData({...ticketFormData, itemNumber: item.itemNumber, description: item.description, customerName: item.customerName});
              }
          }}><option value="">Select an Item...</option>{MASTER_ITEMS.map(item => <option key={item.id} value={item.itemNumber}>{item.itemNumber} - {item.description}</option>)}<option value="NEW">+ Create New Item</option></select></div>
          <div><label className="block text-sm font-bold text-slate-700 mb-1">Process Type</label><div className="grid grid-cols-2 gap-4">
              {['FLEXO', 'CARTON'].map(p => (
                  <button key={p} onClick={() => setTicketFormData({...ticketFormData, processType: p as any})} className={`p-4 rounded-lg border-2 font-bold transition-all ${ticketFormData.processType === p ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500'}`}>{p}</button>
              ))}
          </div></div>
          <div className="pt-6 flex justify-end"><button onClick={handleCreateTicket} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg">Create Ticket</button></div>
       </div>
    </div>
  );

  const renderList = () => {
    const filtered = tickets.filter(t => t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) || t.itemNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div><h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><ClipboardCheck className="text-green-600" /> QA Inspection</h1><p className="text-slate-500">Track manufacturing quality across multiple stages.</p></div>
            <div className="flex gap-2 w-full md:w-auto">
                <button 
                  onClick={() => { setTempGuideContent(config.inspectionGuide || ''); setIsGuideOpen(true); }}
                  className="flex-1 md:flex-none px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-50 shadow-sm"
                >
                    <BookOpen size={18} /> Guide
                </button>
                {currentUser.role === UserRole.SUPER_ADMIN && (
                    <button onClick={() => setView('CONFIG')} className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"><Settings size={20} /></button>
                )}
                <button onClick={() => setView('CREATE')} className="flex-1 md:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-md"><Plus size={20} /> Create Job</button>
            </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3"><Search size={18} className="text-slate-400" /><input type="text" placeholder="Search Jobs..." className="bg-transparent border-none outline-none text-sm w-full" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b"><tr><th className="px-6 py-4">Job #</th><th className="px-6 py-4">Process</th><th className="px-6 py-4">Item Details</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Action</th></tr></thead>
                    <tbody className="divide-y divide-slate-50">{filtered.map(t => (<tr key={t.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => { setSelectedTicket(t); setView('DETAIL'); }}><td className="px-6 py-4 font-mono font-bold text-blue-600">{t.ticketNumber}</td><td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${t.processType === 'FLEXO' ? 'bg-emerald-50 text-emerald-700' : 'bg-cyan-50 text-cyan-700'}`}>{t.processType}</span></td><td className="px-6 py-4"><b>{t.itemNumber}</b><div className="text-xs text-slate-500 truncate max-w-xs">{t.description}</div></td><td className="px-6 py-4"><span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${t.status === QATicketStatus.LOCKED_NCR ? 'bg-red-600 text-white' : 'bg-green-100 text-green-700'}`}>{t.status.replace('_', ' ')}</span></td><td className="px-6 py-4"><ChevronRight size={20} className="text-slate-300" /></td></tr>))}</tbody>
                </table>
            </div>
        </div>
      </div>
    );
  };

  const renderGuideModal = () => (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col h-[70vh]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-700 rounded-lg"><BookOpen size={20} /></div>
                    <h3 className="text-xl font-bold text-slate-800">Inspection Procedures Guide</h3>
                </div>
                <button onClick={() => { setIsGuideOpen(false); setIsEditingGuide(false); }} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full transition-colors"><XCircle size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-white">
                {isEditingGuide ? (
                    <textarea 
                        className="w-full h-full p-4 border border-slate-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        value={tempGuideContent}
                        onChange={(e) => setTempGuideContent(e.target.value)}
                        placeholder="Type inspection instructions here..."
                    />
                ) : (
                    <div className="prose prose-slate max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">
                            {config.inspectionGuide || "No guide instructions provided yet."}
                        </pre>
                    </div>
                )}
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-between items-center">
                {currentUser.role === UserRole.SUPER_ADMIN && !isEditingGuide && (
                    <button 
                        onClick={() => setIsEditingGuide(true)}
                        className="px-4 py-2 text-blue-600 hover:bg-blue-100 rounded-lg font-bold flex items-center gap-2 transition-colors"
                    >
                        <Edit3 size={18} /> Edit Guide
                    </button>
                )}
                {isEditingGuide ? (
                    <div className="flex gap-3 ml-auto">
                        <button 
                            onClick={() => { setIsEditingGuide(false); setTempGuideContent(config.inspectionGuide || ''); }}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-bold"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={saveGuide}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md"
                        >
                            <Save size={18} /> Save Changes
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsGuideOpen(false)}
                        className="px-8 py-2 ml-auto bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 transition-colors shadow-md"
                    >
                        Close
                    </button>
                )}
            </div>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fadeIn p-4 md:p-6 overflow-y-auto">
      {view === 'LIST' && renderList()}
      {view === 'CREATE' && renderCreate()}
      {view === 'DETAIL' && renderDetail()}
      {view === 'INSPECTION_FORM' && renderInspectionForm()}
      {view === 'CONFIG' && renderConfig()}
      
      {isGuideOpen && renderGuideModal()}
    </div>
  );
};

export default QAInspectionModule;
