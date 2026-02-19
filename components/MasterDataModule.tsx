import React, { useState, useRef } from 'react';
import { User, UserRole, MasterItem, MasterCustomer, MasterSupplier } from '../types';
import { MASTER_ITEMS, MASTER_CUSTOMERS, MASTER_SUPPLIERS, updateMasterItems, updateMasterCustomers, updateMasterSuppliers } from '../mockData';
import { 
  Database, 
  Search, 
  Plus, 
  Download, 
  Upload, 
  Package, 
  Users, 
  Truck,
  Trash2,
  FileSpreadsheet,
  AlertCircle,
  Edit2,
  Power
} from 'lucide-react';

interface MasterDataModuleProps {
  currentUser: User;
}

type Tab = 'ITEMS' | 'CUSTOMERS' | 'SUPPLIERS';

const MasterDataModule: React.FC<MasterDataModuleProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<Tab>('ITEMS');
  const [items, setItems] = useState<MasterItem[]>(MASTER_ITEMS);
  const [customers, setCustomers] = useState<MasterCustomer[]>(MASTER_CUSTOMERS);
  const [suppliers, setSuppliers] = useState<MasterSupplier[]>(MASTER_SUPPLIERS);
  const [searchTerm, setSearchTerm] = useState('');
  
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importError, setImportError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [newItem, setNewItem] = useState<Partial<MasterItem>>({});
  const [newCustomer, setNewCustomer] = useState<Partial<MasterCustomer>>({});
  const [newSupplier, setNewSupplier] = useState<Partial<MasterSupplier>>({});

  const isAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN;

  // --- Handlers ---

  const handleDeleteItem = (id: string) => {
    if (!isAdmin) return;
    if (window.confirm('Are you sure you want to delete this item?')) {
      const updated = items.filter(i => i.id !== id);
      setItems(updated);
      updateMasterItems(updated);
    }
  };

  const handleDeleteCustomer = (id: string) => {
    if (!isAdmin) return;
    if (window.confirm('Are you sure you want to delete this customer?')) {
      const updated = customers.filter(c => c.id !== id);
      setCustomers(updated);
      updateMasterCustomers(updated);
    }
  };

  const handleDeleteSupplier = (id: string) => {
    if (!isAdmin) return;
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      const updated = suppliers.filter(s => s.id !== id);
      setSuppliers(updated);
      updateMasterSuppliers(updated);
    }
  };

  const handleToggleStatus = (id: string, type: 'ITEM' | 'CUSTOMER' | 'SUPPLIER') => {
    if (!isAdmin) return;
    if (type === 'ITEM') {
        const updated = items.map(i => i.id === id ? { ...i, status: (i.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE') as 'ACTIVE'|'INACTIVE' } : i);
        setItems(updated);
        updateMasterItems(updated);
    } else if (type === 'CUSTOMER') {
        const updated = customers.map(c => c.id === id ? { ...c, status: (c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE') as 'ACTIVE'|'INACTIVE' } : c);
        setCustomers(updated);
        updateMasterCustomers(updated);
    } else {
        const updated = suppliers.map(s => s.id === id ? { ...s, status: (s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE') as 'ACTIVE'|'INACTIVE' } : s);
        setSuppliers(updated);
        updateMasterSuppliers(updated);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setNewItem({});
    setNewCustomer({});
    setNewSupplier({});
    setIsModalOpen(true);
  };

  const openEditModal = (record: any) => {
    setEditingId(record.id);
    if (activeTab === 'ITEMS') {
        setNewItem({ ...record });
    } else if (activeTab === 'CUSTOMERS') {
        setNewCustomer({ ...record });
    } else {
        setNewSupplier({ ...record });
    }
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.itemNumber || !newItem.description) return;
    
    if (editingId) {
        const updated = items.map(item => item.id === editingId ? { ...item, ...newItem } as MasterItem : item);
        setItems(updated);
        updateMasterItems(updated);
        setSuccessMsg('Item updated successfully');
    } else {
        const item: MasterItem = {
          id: Date.now().toString(),
          itemNumber: newItem.itemNumber,
          description: newItem.description,
          manufacturingSite: newItem.manufacturingSite || '',
          customerName: newItem.customerName || '',
          status: 'ACTIVE'
        };
        const updated = [...items, item];
        setItems(updated);
        updateMasterItems(updated);
        setSuccessMsg('Item added successfully');
    }

    setNewItem({});
    setEditingId(null);
    setIsModalOpen(false);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name) return;

    if (editingId) {
        const updated = customers.map(cust => cust.id === editingId ? { ...cust, ...newCustomer } as MasterCustomer : cust);
        setCustomers(updated);
        updateMasterCustomers(updated);
        setSuccessMsg('Customer updated successfully');
    } else {
        const customer: MasterCustomer = {
          id: Date.now().toString(),
          name: newCustomer.name,
          email: newCustomer.email,
          phone: newCustomer.phone,
          status: 'ACTIVE'
        };
        const updated = [...customers, customer];
        setCustomers(updated);
        updateMasterCustomers(updated);
        setSuccessMsg('Customer added successfully');
    }

    setNewCustomer({});
    setEditingId(null);
    setIsModalOpen(false);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name) return;

    if (editingId) {
        const updated = suppliers.map(sup => sup.id === editingId ? { ...sup, ...newSupplier } as MasterSupplier : sup);
        setSuppliers(updated);
        updateMasterSuppliers(updated);
        setSuccessMsg('Supplier updated successfully');
    } else {
        const supplier: MasterSupplier = {
          id: Date.now().toString(),
          name: newSupplier.name,
          email: newSupplier.email,
          phone: newSupplier.phone,
          status: 'ACTIVE'
        };
        const updated = [...suppliers, supplier];
        setSuppliers(updated);
        updateMasterSuppliers(updated);
        setSuccessMsg('Supplier added successfully');
    }

    setNewSupplier({});
    setEditingId(null);
    setIsModalOpen(false);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // --- CSV Logic ---

  const handleDownloadTemplate = () => {
    let headers = [];
    let filename = '';

    if (activeTab === 'ITEMS') {
      headers = ['Item Number', 'Description', 'Manufacturing Site', 'Customer Name'];
      filename = 'item_master_template.csv';
    } else if (activeTab === 'CUSTOMERS') {
      headers = ['Customer Name', 'Email', 'Phone'];
      filename = 'customer_master_template.csv';
    } else {
      headers = ['Supplier Name', 'Email', 'Phone'];
      filename = 'supplier_master_template.csv';
    }

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const lines = text.split('\n');
        const dataRows = lines.slice(1).filter(line => line.trim() !== '');
        
        if (activeTab === 'ITEMS') {
          const newItems: MasterItem[] = dataRows.map((line, idx) => {
            const cols = line.split(',');
            return {
              id: `${Date.now()}-${idx}`,
              itemNumber: cols[0]?.trim() || 'UNKNOWN',
              description: cols[1]?.trim() || 'No Description',
              manufacturingSite: cols[2]?.trim() || '',
              customerName: cols[3]?.trim() || '',
              status: 'ACTIVE'
            };
          });
          const updated = [...items, ...newItems];
          setItems(updated);
          updateMasterItems(updated);
          setSuccessMsg(`Successfully imported ${newItems.length} items.`);
        } else if (activeTab === 'CUSTOMERS') {
          const newCusts: MasterCustomer[] = dataRows.map((line, idx) => {
            const cols = line.split(',');
            return {
              id: `${Date.now()}-${idx}`,
              name: cols[0]?.trim() || 'UNKNOWN',
              email: cols[1]?.trim() || '',
              phone: cols[2]?.trim() || '',
              status: 'ACTIVE'
            };
          });
          const updated = [...customers, ...newCusts];
          setCustomers(updated);
          updateMasterCustomers(updated);
          setSuccessMsg(`Successfully imported ${newCusts.length} customers.`);
        } else {
          const newSups: MasterSupplier[] = dataRows.map((line, idx) => {
            const cols = line.split(',');
            return {
              id: `${Date.now()}-${idx}`,
              name: cols[0]?.trim() || 'UNKNOWN',
              email: cols[1]?.trim() || '',
              phone: cols[2]?.trim() || '',
              status: 'ACTIVE'
            };
          });
          const updated = [...suppliers, ...newSups];
          setSuppliers(updated);
          updateMasterSuppliers(updated);
          setSuccessMsg(`Successfully imported ${newSups.length} suppliers.`);
        }
        setImportError('');
      } catch (err) {
        setImportError('Failed to parse CSV. Please ensure it matches the template format.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // --- Filtering ---
  
  const filteredItems = items.filter(i => 
    i.itemNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Rendering ---

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fadeIn p-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Database className="text-cyan-600" /> Master Data
          </h1>
          <p className="text-slate-500 mt-1">Manage core system data entities.</p>
        </div>
        
        {isAdmin && (
          <div className="flex gap-2">
            <button 
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium flex items-center gap-2 text-sm shadow-sm"
            >
              <FileSpreadsheet size={16} /> Template
            </button>
            <div className="relative">
              <input 
                type="file" 
                ref={fileInputRef}
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium flex items-center gap-2 text-sm shadow-sm"
              >
                <Upload size={16} /> Import CSV
              </button>
            </div>
            <button 
              onClick={openAddModal}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-medium flex items-center gap-2 text-sm shadow-sm"
            >
              <Plus size={16} /> Add New
            </button>
          </div>
        )}
      </div>

      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg flex items-center gap-2 text-sm animate-fadeIn">
          <AlertCircle size={16} /> {successMsg}
        </div>
      )}
      {importError && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-2 text-sm animate-fadeIn">
          <AlertCircle size={16} /> {importError}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        
        <div className="border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('ITEMS')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'ITEMS' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Package size={16} /> Items
            </button>
            <button 
              onClick={() => setActiveTab('CUSTOMERS')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'CUSTOMERS' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Users size={16} /> Customers
            </button>
            <button 
              onClick={() => setActiveTab('SUPPLIERS')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'SUPPLIERS' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Truck size={16} /> Suppliers
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search data..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0">
              <tr>
                {activeTab === 'ITEMS' ? (
                  <>
                    <th className="px-6 py-4 font-semibold">Item Number</th>
                    <th className="px-6 py-4 font-semibold">Description</th>
                    <th className="px-6 py-4 font-semibold">Manufacturing Site</th>
                    <th className="px-6 py-4 font-semibold">Customer</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </>
                ) : activeTab === 'CUSTOMERS' ? (
                  <>
                    <th className="px-6 py-4 font-semibold">Customer Name</th>
                    <th className="px-6 py-4 font-semibold">Email</th>
                    <th className="px-6 py-4 font-semibold">Phone</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4 font-semibold">Supplier Name</th>
                    <th className="px-6 py-4 font-semibold">Email</th>
                    <th className="px-6 py-4 font-semibold">Phone</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </>
                )}
                {isAdmin && <th className="px-6 py-4 font-semibold w-32">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeTab === 'ITEMS' ? (
                filteredItems.length > 0 ? filteredItems.map(item => (
                  <tr key={item.id} className={`hover:bg-slate-50 ${item.status === 'INACTIVE' ? 'opacity-60 bg-slate-50' : ''}`}>
                    <td className="px-6 py-3 font-mono text-slate-600">{item.itemNumber}</td>
                    <td className="px-6 py-3 text-slate-800 font-medium">{item.description}</td>
                    <td className="px-6 py-3 text-slate-600">{item.manufacturingSite}</td>
                    <td className="px-6 py-3 text-slate-600">{item.customerName}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                        {item.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-3 flex items-center gap-2">
                        <button onClick={() => openEditModal(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleToggleStatus(item.id, 'ITEM')} className={`p-1.5 rounded ${item.status === 'ACTIVE' ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-200'}`} title="Toggle Status">
                          <Power size={16} />
                        </button>
                        <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">No items found.</td></tr>
                )
              ) : activeTab === 'CUSTOMERS' ? (
                filteredCustomers.length > 0 ? filteredCustomers.map(cust => (
                  <tr key={cust.id} className={`hover:bg-slate-50 ${cust.status === 'INACTIVE' ? 'opacity-60 bg-slate-50' : ''}`}>
                    <td className="px-6 py-3 text-slate-800 font-medium">{cust.name}</td>
                    <td className="px-6 py-3 text-slate-600">{cust.email || '-'}</td>
                    <td className="px-6 py-3 text-slate-600">{cust.phone || '-'}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${cust.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                        {cust.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-3 flex items-center gap-2">
                        <button onClick={() => openEditModal(cust)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleToggleStatus(cust.id, 'CUSTOMER')} className={`p-1.5 rounded ${cust.status === 'ACTIVE' ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-200'}`} title="Toggle Status">
                          <Power size={16} />
                        </button>
                         <button onClick={() => handleDeleteCustomer(cust.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">No customers found.</td></tr>
                )
              ) : (
                filteredSuppliers.length > 0 ? filteredSuppliers.map(sup => (
                  <tr key={sup.id} className={`hover:bg-slate-50 ${sup.status === 'INACTIVE' ? 'opacity-60 bg-slate-50' : ''}`}>
                    <td className="px-6 py-3 text-slate-800 font-medium">{sup.name}</td>
                    <td className="px-6 py-3 text-slate-600">{sup.email || '-'}</td>
                    <td className="px-6 py-3 text-slate-600">{sup.phone || '-'}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${sup.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                        {sup.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-3 flex items-center gap-2">
                        <button onClick={() => openEditModal(sup)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleToggleStatus(sup.id, 'SUPPLIER')} className={`p-1.5 rounded ${sup.status === 'ACTIVE' ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-200'}`} title="Toggle Status">
                          <Power size={16} />
                        </button>
                         <button onClick={() => handleDeleteSupplier(sup.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">No suppliers found.</td></tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {editingId ? 'Edit' : 'Add New'} {activeTab === 'ITEMS' ? 'Item' : activeTab === 'CUSTOMERS' ? 'Customer' : 'Supplier'}
            </h3>
            
            {activeTab === 'ITEMS' ? (
              <form onSubmit={handleSaveItem} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Item Number</label>
                  <input required type="text" className="w-full p-2 border border-slate-300 rounded outline-none focus:border-cyan-500" value={newItem.itemNumber || ''} onChange={e => setNewItem({...newItem, itemNumber: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Description</label>
                  <input required type="text" className="w-full p-2 border border-slate-300 rounded outline-none focus:border-cyan-500" value={newItem.description || ''} onChange={e => setNewItem({...newItem, description: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Manufacturing Site</label>
                  <input type="text" className="w-full p-2 border border-slate-300 rounded outline-none focus:border-cyan-500" value={newItem.manufacturingSite || ''} onChange={e => setNewItem({...newItem, manufacturingSite: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Customer Name</label>
                  <input type="text" className="w-full p-2 border border-slate-300 rounded outline-none focus:border-cyan-500" value={newItem.customerName || ''} onChange={e => setNewItem({...newItem, customerName: e.target.value})} />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700">Save Item</button>
                </div>
              </form>
            ) : activeTab === 'CUSTOMERS' ? (
              <form onSubmit={handleSaveCustomer} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Customer Name</label>
                  <input required type="text" className="w-full p-2 border border-slate-300 rounded outline-none focus:border-cyan-500" value={newCustomer.name || ''} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email</label>
                  <input type="email" className="w-full p-2 border border-slate-300 rounded outline-none focus:border-cyan-500" value={newCustomer.email || ''} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} />
                </div>
                 <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Phone</label>
                  <input type="text" className="w-full p-2 border border-slate-300 rounded outline-none focus:border-cyan-500" value={newCustomer.phone || ''} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700">Save Customer</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSaveSupplier} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Supplier Name</label>
                  <input required type="text" className="w-full p-2 border border-slate-300 rounded outline-none focus:border-cyan-500" value={newSupplier.name || ''} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email</label>
                  <input type="email" className="w-full p-2 border border-slate-300 rounded outline-none focus:border-cyan-500" value={newSupplier.email || ''} onChange={e => setNewSupplier({...newSupplier, email: e.target.value})} />
                </div>
                 <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Phone</label>
                  <input type="text" className="w-full p-2 border border-slate-300 rounded outline-none focus:border-cyan-500" value={newSupplier.phone || ''} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700">Save Supplier</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterDataModule;