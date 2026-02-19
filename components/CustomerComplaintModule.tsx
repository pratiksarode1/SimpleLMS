
import React, { useState } from 'react';
import { 
  User, 
  CustomerComplaint, 
  ComplaintStage, 
  ContainmentAction, 
  QATicket, 
  QATicketStatus,
  UserRole,
  ComplaintGlobalConfig,
  ComplaintCategory,
  ReturnAddress
} from '../types';
import { 
  CUSTOMER_COMPLAINTS, 
  QA_TICKETS, 
  USERS, 
  COMPLAINT_CONFIG,
  updateCustomerComplaints,
  updateComplaintConfig
} from '../mockData';
import { 
  MessageSquareWarning, 
  Search, 
  Plus, 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  ShieldAlert, 
  User as UserIcon, 
  Calendar,
  Download,
  Trash2,
  RefreshCcw,
  DollarSign,
  Settings,
  Image as ImageIcon,
  MapPin,
  Save,
  Tag,
  Target,
  Users as UsersIcon,
  ShieldCheck,
  Send,
  XCircle,
  Clock,
  RotateCcw,
  CheckSquare,
  Ban,
  FileCheck
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface CustomerComplaintModuleProps {
  currentUser: User;
}

const CustomerComplaintModule: React.FC<CustomerComplaintModuleProps> = ({ currentUser }) => {
  const [view, setView] = useState<'LIST' | 'CREATE_SEARCH' | 'DETAIL' | 'CONFIG'>('LIST');
  const [complaints, setComplaints] = useState<CustomerComplaint[]>(CUSTOMER_COMPLAINTS);
  const [config, setConfig] = useState<ComplaintGlobalConfig>(COMPLAINT_CONFIG);
  const [selectedComplaint, setSelectedComplaint] = useState<CustomerComplaint | null>(null);
  
  // Search State for Creating New
  const [ticketSearch, setTicketSearch] = useState('');
  
  // Form State
  const [detailsData, setDetailsData] = useState<{
    ownerId: string;
    invoiceNumber: string;
    category: string;
    subCategory: string;
    description: string;
    qty: string;
    price: string;
  }>({ ownerId: '', invoiceNumber: '', category: '', subCategory: '', description: '', qty: '', price: '' });

  const [containmentData, setContainmentData] = useState<{
    action: ContainmentAction | null;
    returnAddressId: string;
    isMaterialReturned: boolean;
    isReworkPossible: string; // 'YES' | 'NO' | ''
    reworkTicketNumber: string;
    isMaterialDiscarded: boolean;
    isEvidenceSubmitted: boolean;
  }>({ 
    action: null, 
    returnAddressId: '', 
    isMaterialReturned: false, 
    isReworkPossible: '', 
    reworkTicketNumber: '',
    isMaterialDiscarded: false,
    isEvidenceSubmitted: false
  });

  const [rcaData, setRcaData] = useState<{
    rootCause: string;
    correctiveAction: string;
    assignedTo: string;
    dueDate: string;
  }>({ rootCause: '', correctiveAction: '', assignedTo: '', dueDate: '' });

  // Config Form State
  const [newCatName, setNewCatName] = useState('');
  const [newSubCatName, setNewSubCatName] = useState('');
  const [selectedCatIdForSub, setSelectedCatIdForSub] = useState('');
  const [newAddress, setNewAddress] = useState({ label: '', address: '' });
  const [logoUrl, setLogoUrl] = useState(config.companyLogoUrl || '');

  // --- Actions ---

  const handleCreateComplaint = (ticket: QATicket) => {
    const newComplaint: CustomerComplaint = {
      id: `CC-${Date.now()}`,
      ticketId: ticket.id,
      customerId: ticket.customerName,
      loggedByUserId: currentUser.id,
      createdAt: new Date().toISOString(),
      stage: ComplaintStage.DETAILS,
      revision: 1
    };
    
    const updated = [newComplaint, ...complaints];
    setComplaints(updated);
    updateCustomerComplaints(updated);
    
    setSelectedComplaint(newComplaint);
    setDetailsData({ ownerId: '', invoiceNumber: '', category: '', subCategory: '', description: '', qty: '', price: '' });
    setContainmentData({ action: null, returnAddressId: '', isMaterialReturned: false, isReworkPossible: '', reworkTicketNumber: '', isMaterialDiscarded: false, isEvidenceSubmitted: false });
    setRcaData({ rootCause: '', correctiveAction: '', assignedTo: '', dueDate: '' });
    setView('DETAIL');
  };

  const handleSelectComplaint = (complaint: CustomerComplaint) => {
    setSelectedComplaint(complaint);
    setDetailsData({
      ownerId: complaint.ownerId || '',
      invoiceNumber: complaint.invoiceNumber || '',
      category: complaint.category || '',
      subCategory: complaint.subCategory || '',
      description: complaint.issueDescription || '',
      qty: complaint.defectiveQuantity?.toString() || '',
      price: complaint.pricePerUnit?.toString() || ''
    });
    setContainmentData({
      action: complaint.containmentAction || null,
      returnAddressId: complaint.selectedReturnAddressId || '',
      isMaterialReturned: complaint.isMaterialReturned || false,
      isReworkPossible: complaint.isReworkPossible === undefined ? '' : (complaint.isReworkPossible ? 'YES' : 'NO'),
      reworkTicketNumber: complaint.reworkTicketNumber || '',
      isMaterialDiscarded: complaint.isMaterialDiscarded || false,
      isEvidenceSubmitted: complaint.isEvidenceSubmitted || false
    });
    setRcaData({
      rootCause: complaint.rootCause || '',
      correctiveAction: complaint.correctiveAction || '',
      assignedTo: complaint.assignedToUserId || '',
      dueDate: complaint.dueDate || ''
    });
    setView('DETAIL');
  };

  const submitDetails = () => {
    if (!selectedComplaint) return;
    if (!detailsData.ownerId || !detailsData.category || !detailsData.subCategory || !detailsData.description || !detailsData.qty || !detailsData.price) {
      alert("Please complete all mandatory details including Owner and Category.");
      return;
    }

    const qty = parseFloat(detailsData.qty);
    const price = parseFloat(detailsData.price);
    const total = qty * price;

    const updated: CustomerComplaint = {
      ...selectedComplaint,
      ownerId: detailsData.ownerId,
      invoiceNumber: detailsData.invoiceNumber,
      category: detailsData.category,
      subCategory: detailsData.subCategory,
      issueDescription: detailsData.description,
      defectiveQuantity: qty,
      pricePerUnit: price,
      totalCost: total,
      stage: ComplaintStage.CONTAINMENT
    };

    const updatedList = complaints.map(c => c.id === updated.id ? updated : c);
    setComplaints(updatedList);
    updateCustomerComplaints(updatedList);
    setSelectedComplaint(updated);
  };

  const generatePDF = () => {
    if (!selectedComplaint || !containmentData.action) return;
    
    let selectedAddress = config.returnAddresses[0];
    if (containmentData.action !== ContainmentAction.NA) {
        if (!containmentData.returnAddressId) {
            // alert("Please select a return address.");
            // return;
        }
        const found = config.returnAddresses.find(a => a.id === containmentData.returnAddressId);
        if (found) selectedAddress = found;
    }

    const ticket = QA_TICKETS.find(t => t.id === selectedComplaint.ticketId);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    let yPos = 20;
    
    // Header
    if (config.companyLogoUrl) {
        try {
            doc.addImage(config.companyLogoUrl, 'JPEG', 20, 10, 40, 20); 
            yPos = 40;
        } catch (e) {
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("FRANKSTON PACKAGING", 20, 30);
            yPos = 45;
        }
    } else {
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("FRANKSTON PACKAGING", 20, 30);
        yPos = 45;
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("123 Packaging Way, Frankston, TX 75763", 20, yPos);
    yPos += 15;

    doc.setLineWidth(0.5);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 15;

    // Document Info
    doc.setFontSize(11);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPos);
    doc.text(`Reference Job: ${ticket?.ticketNumber || 'N/A'}`, 120, yPos);
    yPos += 6;
    doc.text(`Customer: ${selectedComplaint.customerId}`, 20, yPos);
    doc.text(`Complaint ID: ${selectedComplaint.id}`, 120, yPos);
    yPos += 6;
    if (selectedComplaint.invoiceNumber) {
        doc.text(`Invoice #: ${selectedComplaint.invoiceNumber}`, 20, yPos);
    }
    yPos += 15;

    doc.save(`Complaint_${selectedComplaint.id}.pdf`);
  };

  const renderList = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <MessageSquareWarning className="text-purple-600" /> Customer Complaints
        </h1>
        <div className="flex gap-2">
           <button onClick={() => setView('CONFIG')} className="p-2 border rounded-lg hover:bg-slate-50"><Settings size={20}/></button>
           <button onClick={() => setView('CREATE_SEARCH')} className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-purple-700"><Plus size={20}/> Log Complaint</button>
        </div>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-600">ID</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Customer</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Job Ticket</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Stage</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {complaints.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-slate-500">No complaints found.</td></tr> : 
              complaints.map(c => {
                 const ticket = QA_TICKETS.find(t => t.id === c.ticketId);
                 return (
                   <tr key={c.id} className="hover:bg-slate-50">
                     <td className="px-6 py-4 font-mono font-bold text-purple-600">{c.id}</td>
                     <td className="px-6 py-4">{c.customerId}</td>
                     <td className="px-6 py-4">{ticket?.ticketNumber || 'N/A'}</td>
                     <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold">{c.stage}</span></td>
                     <td className="px-6 py-4"><button onClick={() => handleSelectComplaint(c)} className="text-blue-600 hover:underline font-medium">Manage</button></td>
                   </tr>
                 );
              })
            }
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCreateSearch = () => (
    <div className="max-w-2xl mx-auto space-y-6">
        <button onClick={() => setView('LIST')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800"><ArrowLeft size={18}/> Back</button>
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Select Job Ticket</h2>
            <div className="relative mb-6">
                <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search Ticket Number..." 
                  className="w-full pl-10 p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                  value={ticketSearch}
                  onChange={e => setTicketSearch(e.target.value)}
                />
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
                {QA_TICKETS.filter(t => t.ticketNumber.toLowerCase().includes(ticketSearch.toLowerCase())).map(t => (
                    <div key={t.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50">
                        <div>
                            <p className="font-bold">{t.ticketNumber}</p>
                            <p className="text-xs text-slate-500">{t.customerName} - {t.description}</p>
                        </div>
                        <button onClick={() => handleCreateComplaint(t)} className="px-3 py-1 bg-purple-600 text-white rounded text-sm font-bold">Select</button>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );

  const renderDetail = () => {
      if (!selectedComplaint) return null;
      return (
          <div className="max-w-4xl mx-auto space-y-6">
              <button onClick={() => setView('LIST')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800"><ArrowLeft size={18}/> Back</button>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-800 mb-6">Complaint Details: {selectedComplaint.id}</h2>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                      <div><label className="block text-xs font-bold text-slate-500 uppercase">Owner</label>
                      <select className="w-full p-2 border rounded" value={detailsData.ownerId} onChange={e => setDetailsData({...detailsData, ownerId: e.target.value})}>
                          <option value="">Select...</option>
                          {USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select></div>
                      <div><label className="block text-xs font-bold text-slate-500 uppercase">Category</label>
                      <select className="w-full p-2 border rounded" value={detailsData.category} onChange={e => setDetailsData({...detailsData, category: e.target.value})}>
                          <option value="">Select...</option>
                          {config.categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select></div>
                  </div>
                  <div className="mb-4">
                      <label className="block text-xs font-bold text-slate-500 uppercase">Description</label>
                      <textarea className="w-full p-2 border rounded" value={detailsData.description} onChange={e => setDetailsData({...detailsData, description: e.target.value})}></textarea>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                      <div><label className="block text-xs font-bold text-slate-500 uppercase">Qty</label><input type="number" className="w-full p-2 border rounded" value={detailsData.qty} onChange={e => setDetailsData({...detailsData, qty: e.target.value})} /></div>
                      <div><label className="block text-xs font-bold text-slate-500 uppercase">Price</label><input type="number" className="w-full p-2 border rounded" value={detailsData.price} onChange={e => setDetailsData({...detailsData, price: e.target.value})} /></div>
                  </div>
                  <div className="flex justify-end gap-2">
                      <button onClick={submitDetails} className="px-4 py-2 bg-purple-600 text-white rounded font-bold">Save Details</button>
                      <button onClick={generatePDF} className="px-4 py-2 bg-slate-800 text-white rounded font-bold">PDF</button>
                  </div>
              </div>
          </div>
      )
  };

  const renderConfig = () => (
      <div className="max-w-4xl mx-auto space-y-6">
          <button onClick={() => setView('LIST')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800"><ArrowLeft size={18}/> Back</button>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Settings</h2>
              <p className="text-slate-500">Categories and Return Addresses can be managed here.</p>
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fadeIn p-4 md:p-6 overflow-y-auto">
        {view === 'LIST' && renderList()}
        {view === 'CREATE_SEARCH' && renderCreateSearch()}
        {view === 'DETAIL' && renderDetail()}
        {view === 'CONFIG' && renderConfig()}
    </div>
  );
};

export default CustomerComplaintModule;
