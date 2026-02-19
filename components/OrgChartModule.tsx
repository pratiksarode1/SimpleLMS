import React, { useState, useMemo } from 'react';
import { User, UserRole } from '../types';
import { USERS, LOCATIONS } from '../mockData';
import { COMPANY_NAME } from '../constants';
import { 
  Network, 
  MapPin, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface OrgChartModuleProps {
  currentUser: User;
}

interface TreeNode {
  user: User;
  reports: TreeNode[];
}

const OrgChartModule: React.FC<OrgChartModuleProps> = ({ currentUser }) => {
  const [locationFilter, setLocationFilter] = useState<string>('ALL');
  const users = USERS;
  const [zoom, setZoom] = useState(1);
  
  // --- Logic ---

  const buildTree = (userList: User[]): TreeNode[] => {
    const userMap = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // Initialize nodes
    userList.forEach(u => {
      userMap.set(u.id, { user: u, reports: [] });
    });

    // Connect nodes
    userList.forEach(u => {
      const node = userMap.get(u.id);
      if (!node) return;

      // If manager exists in the list, attach. Otherwise root.
      if (u.managerId && userMap.has(u.managerId)) {
        const managerNode = userMap.get(u.managerId);
        managerNode?.reports.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const filteredUsers = useMemo(() => {
    if (locationFilter === 'ALL') return users;
    return users.filter(u => u.locationId === locationFilter);
  }, [users, locationFilter]);

  const treeData = useMemo(() => buildTree(filteredUsers), [filteredUsers]);

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    let y = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY_NAME, margin, y);
    y += 8;
    
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text("Organizational Chart", margin, y);
    y += 10;

    // Content - Simple list for PDF as drawing tree is complex
    doc.setFontSize(10);
    doc.setTextColor(0);
    filteredUsers.forEach(u => {
        doc.text(`${u.name} - ${u.role}`, margin, y);
        y += 6;
        if (y > 280) {
            doc.addPage();
            y = 20;
        }
    });

    doc.save('OrgChart.pdf');
  };

  const renderNode = (node: TreeNode, level: number = 0) => (
    <div key={node.user.id} className="flex flex-col items-center mx-4">
      <div className={`
        relative p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all
        flex flex-col items-center gap-2 min-w-[200px] z-10 mb-8
        ${level === 0 ? 'border-t-4 border-t-violet-600' : ''}
      `}>
        {/* Connector Line Top */}
        {level > 0 && <div className="absolute -top-8 left-1/2 w-px h-8 bg-slate-300"></div>}
        
        <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-lg mb-1">
          {node.user.name.charAt(0)}
        </div>
        <div className="text-center">
          <p className="font-bold text-slate-800 text-sm">{node.user.name}</p>
          <p className="text-xs text-slate-500 font-medium">{node.user.role}</p>
          {node.user.locationId && (
             <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-center gap-1">
               <MapPin size={10} />
               {LOCATIONS.find(l => l.id === node.user.locationId)?.name || 'Unknown'}
             </p>
          )}
        </div>
        
        {/* Connector Line Bottom */}
        {node.reports.length > 0 && <div className="absolute -bottom-8 left-1/2 w-px h-8 bg-slate-300"></div>}
      </div>

      {node.reports.length > 0 && (
        <div className="flex justify-center relative pt-4 border-t border-slate-300">
           {node.reports.map(child => renderNode(child, level + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fadeIn p-4 md:p-6 overflow-hidden">
       {/* Header */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 gap-4">
          <div>
             <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Network className="text-violet-600" /> Organization Chart</h1>
             <p className="text-sm text-slate-500">Visual hierarchy of {COMPANY_NAME}.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
             <select 
               className="p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 outline-none flex-1 md:flex-none"
               value={locationFilter}
               onChange={e => setLocationFilter(e.target.value)}
             >
                <option value="ALL">All Locations</option>
                {LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
             </select>
             <button onClick={handleGeneratePDF} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"><Download size={20} /></button>
          </div>
       </div>

       {/* Canvas */}
       <div className="flex-1 overflow-auto bg-slate-100 rounded-xl border border-slate-200 shadow-inner p-8 relative">
          <div className="flex justify-center min-w-max" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}>
             {treeData.length > 0 ? (
                 <div className="flex gap-16">
                    {treeData.map(root => renderNode(root))}
                 </div>
             ) : (
                 <div className="text-slate-400 font-medium mt-20">No users found for selected filter.</div>
             )}
          </div>
          
          {/* Zoom Controls */}
          <div className="fixed bottom-8 right-8 flex flex-col gap-2 bg-white p-2 rounded-lg shadow-lg border border-slate-200 z-50">
              <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="p-2 hover:bg-slate-100 rounded" title="Zoom In"><ZoomIn size={20} /></button>
              <button onClick={() => setZoom(1)} className="p-2 hover:bg-slate-100 rounded" title="Reset Zoom"><RotateCcw size={20} /></button>
              <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))} className="p-2 hover:bg-slate-100 rounded" title="Zoom Out"><ZoomOut size={20} /></button>
          </div>
       </div>
    </div>
  );
};

export default OrgChartModule;