
import React, { useState, useEffect } from 'react';
import { 
  User, 
  UserRole, 
  TrainingRecord, 
  LearningResource, 
  Document 
} from '../types';
import { 
  TRAINING_RECORDS, 
  LEARNING_RESOURCES, 
  DOCUMENTS, 
  ROLES,
  updateTrainingRecords, 
  updateLearningResources 
} from '../mockData';
import { 
  GraduationCap, 
  PlayCircle, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  BookOpen, 
  Search, 
  Video,
  XCircle,
  Eye,
  Calendar
} from 'lucide-react';

interface TrainingModuleProps {
  currentUser: User;
}

const TrainingModule: React.FC<TrainingModuleProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'ASSIGNMENTS' | 'LIBRARY'>('ASSIGNMENTS');
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>(TRAINING_RECORDS);
  const [resources, setResources] = useState<LearningResource[]>(LEARNING_RESOURCES);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [signDocId, setSignDocId] = useState<string | null>(null);
  const [watchVideoId, setWatchVideoId] = useState<string | null>(null);

  const isAdmin = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER].includes(currentUser.role);

  // --- Dynamic Assignment Logic ---
  // Calculates what the user SHOULD have assigned based on their Role
  const getMyAssignments = () => {
    // 1. Find Documents required for this user's role
    const requiredDocs = DOCUMENTS.filter(d => 
      d.isActive && 
      d.status === 'APPROVED' &&
      (d.trainingRequiredRoles.includes(currentUser.systemRoleId || '') || d.trainingRequiredRoles.includes('ALL'))
    );

    // 2. Find Learning Resources required for this user's role
    const requiredVideos = resources.filter(r => 
      r.assignedRoleIds.includes(currentUser.systemRoleId || '')
    );

    const assignments: Array<{
      id: string; // Composite ID
      title: string;
      type: 'DOCUMENT' | 'VIDEO';
      status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
      dueDate: string;
      sourceData: Document | LearningResource;
    }> = [];

    // Process Docs
    requiredDocs.forEach(doc => {
      // Check if a record exists for current version
      const record = trainingRecords.find(tr => 
        tr.userId === currentUser.id && 
        tr.type === 'DOCUMENT' && 
        tr.referenceId === doc.id &&
        tr.version === doc.version
      );

      const dueDate = record ? record.dueDate : new Date(new Date(doc.updatedAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const status = record ? record.status : (new Date(dueDate) < new Date() ? 'OVERDUE' : 'PENDING');

      assignments.push({
        id: `doc-${doc.id}-v${doc.version}`,
        title: `${doc.docNumber}: ${doc.title} (v${doc.version})`,
        type: 'DOCUMENT',
        status: status as any,
        dueDate: dueDate,
        sourceData: doc
      });
    });

    // Process Videos
    requiredVideos.forEach(vid => {
        const record = trainingRecords.find(tr => 
            tr.userId === currentUser.id && 
            tr.type === 'VIDEO' && 
            tr.referenceId === vid.id
        );

        // Videos usually due 30 days from creation or assignment. Mocking as creation + 30d
        const dueDate = record ? record.dueDate : new Date(new Date(vid.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const status = record ? record.status : (new Date(dueDate) < new Date() ? 'OVERDUE' : 'PENDING');

        assignments.push({
            id: `vid-${vid.id}`,
            title: vid.title,
            type: 'VIDEO',
            status: status as any,
            dueDate: dueDate,
            sourceData: vid
        });
    });

    return assignments.sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  };

  const assignments = getMyAssignments();
  
  // --- Actions ---

  const handleSignOff = (doc: Document) => {
      const record: TrainingRecord = {
          id: Date.now().toString(),
          userId: currentUser.id,
          type: 'DOCUMENT',
          referenceId: doc.id,
          status: 'COMPLETED',
          version: doc.version,
          assignedDate: new Date().toISOString(), // Should be earlier but good for mock
          completedDate: new Date().toISOString(),
          dueDate: new Date().toISOString()
      };
      
      // Remove old pending records if any (mock replacement)
      const updated = [...trainingRecords.filter(tr => !(tr.userId === currentUser.id && tr.referenceId === doc.id)), record];
      setTrainingRecords(updated);
      updateTrainingRecords(updated);
      setSignDocId(null);
  };

  const handleCompleteVideo = (vid: LearningResource) => {
      const record: TrainingRecord = {
          id: Date.now().toString(),
          userId: currentUser.id,
          type: 'VIDEO',
          referenceId: vid.id,
          status: 'COMPLETED',
          assignedDate: new Date().toISOString(),
          completedDate: new Date().toISOString(),
          dueDate: new Date().toISOString()
      };

      const updated = [...trainingRecords.filter(tr => !(tr.userId === currentUser.id && tr.referenceId === vid.id)), record];
      setTrainingRecords(updated);
      updateTrainingRecords(updated);
      setWatchVideoId(null);
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    
    // Robust Regex for YouTube ID extraction (handles watch?v=, embed/, youtu.be, etc.)
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    
    // Fallback if not a YouTube URL or regex fails (e.g., standard MP4 link)
    return url;
  };

  // --- Views ---

  const renderAssignments = () => (
      <div className="space-y-6">
          <div className="flex justify-between items-center">
             <h2 className="text-xl font-bold text-slate-800">My Training Assignments</h2>
             <div className="flex gap-2">
                 <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1">
                     <AlertCircle size={12} /> {assignments.filter(a => a.status === 'OVERDUE').length} Overdue
                 </div>
                 <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold flex items-center gap-1">
                     <Clock size={12} /> {assignments.filter(a => a.status === 'PENDING').length} Pending
                 </div>
             </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                          <th className="px-6 py-4 font-semibold">Training Title</th>
                          <th className="px-6 py-4 font-semibold">Type</th>
                          <th className="px-6 py-4 font-semibold">Due Date</th>
                          <th className="px-6 py-4 font-semibold">Status</th>
                          <th className="px-6 py-4 font-semibold">Action</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {assignments.length === 0 ? (
                          <tr><td colSpan={5} className="p-8 text-center text-slate-500">No pending training found. Great job!</td></tr>
                      ) : (
                          assignments.map(a => (
                              <tr key={a.id} className="hover:bg-slate-50">
                                  <td className="px-6 py-4 font-medium text-slate-800">{a.title}</td>
                                  <td className="px-6 py-4">
                                      {a.type === 'DOCUMENT' ? (
                                          <span className="inline-flex items-center gap-1 text-slate-600"><FileText size={14} /> SOP/Doc</span>
                                      ) : (
                                          <span className="inline-flex items-center gap-1 text-purple-600"><Video size={14} /> Video</span>
                                      )}
                                  </td>
                                  <td className="px-6 py-4 text-slate-600">
                                      <div className="flex items-center gap-2">
                                         <Calendar size={14} />
                                         {new Date(a.dueDate).toLocaleDateString()}
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      {a.status === 'COMPLETED' && <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded">Completed</span>}
                                      {a.status === 'PENDING' && <span className="text-orange-600 font-bold text-xs bg-orange-50 px-2 py-1 rounded">Pending</span>}
                                      {a.status === 'OVERDUE' && <span className="text-red-600 font-bold text-xs bg-red-50 px-2 py-1 rounded">Overdue</span>}
                                  </td>
                                  <td className="px-6 py-4">
                                      {a.status !== 'COMPLETED' && (
                                          <button 
                                            onClick={() => {
                                                if (a.type === 'DOCUMENT') setSignDocId((a.sourceData as Document).id);
                                                else setWatchVideoId((a.sourceData as LearningResource).id);
                                            }}
                                            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700"
                                          >
                                              {a.type === 'DOCUMENT' ? 'Read & Sign' : 'Watch Now'}
                                          </button>
                                      )}
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const renderLibrary = () => (
      <div className="space-y-6">
          <div className="flex justify-between items-center">
              <div>
                  <h2 className="text-xl font-bold text-slate-800">Learning Library</h2>
                  <p className="text-slate-500 text-sm">Browse self-paced learning modules and videos.</p>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.filter(r => r.isSelfAssignable || r.assignedRoleIds.includes(currentUser.systemRoleId || '')).map(res => (
                  <div key={res.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                      <div className="h-40 bg-slate-100 flex items-center justify-center relative group cursor-pointer" onClick={() => setWatchVideoId(res.id)}>
                          {res.thumbnailUrl ? (
                              <img src={res.thumbnailUrl} alt={res.title} className="w-full h-full object-cover" />
                          ) : (
                              <Video size={48} className="text-slate-300" />
                          )}
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                              <PlayCircle size={48} className="text-white drop-shadow-lg opacity-80 group-hover:opacity-100 transform group-hover:scale-110 transition-all" />
                          </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                          <h3 className="font-bold text-slate-800 mb-1">{res.title}</h3>
                          <p className="text-sm text-slate-500 line-clamp-2 mb-4">{res.description}</p>
                          <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                              <span className="text-xs text-slate-400 font-medium">{res.durationMinutes} mins</span>
                              <button onClick={() => setWatchVideoId(res.id)} className="text-emerald-600 text-sm font-bold hover:underline">Start Learning</button>
                          </div>
                      </div>
                  </div>
              ))}
              
              {resources.length === 0 && (
                  <div className="col-span-3 text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                      <BookOpen size={48} className="mx-auto mb-2 opacity-50" />
                      <p>No learning resources available yet.</p>
                  </div>
              )}
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fadeIn p-6">
        {/* Header Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
                 <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><GraduationCap className="text-emerald-600" /> Training & Learning</h1>
                 <p className="text-slate-500">Manage your mandatory training and explore learning content.</p>
            </div>
            
            <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                <button 
                  onClick={() => setActiveTab('ASSIGNMENTS')}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'ASSIGNMENTS' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    <CheckCircle size={16} /> My Assignments
                </button>
                <button 
                  onClick={() => setActiveTab('LIBRARY')}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'LIBRARY' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    <BookOpen size={16} /> Learning Library
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto">
            {activeTab === 'ASSIGNMENTS' && renderAssignments()}
            {activeTab === 'LIBRARY' && renderLibrary()}
        </div>

        {/* Read & Sign Modal */}
        {signDocId && (
            <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full h-[80vh] flex flex-col">
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="font-bold text-lg">Read & Sign Document</h3>
                        <button onClick={() => setSignDocId(null)}><XCircle className="text-slate-400 hover:text-slate-600" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                        <div className="bg-white border p-8 shadow-sm min-h-full">
                            <pre className="whitespace-pre-wrap font-sans text-sm">{DOCUMENTS.find(d => d.id === signDocId)?.content}</pre>
                        </div>
                    </div>
                    <div className="p-4 border-t border-slate-200 bg-slate-50">
                        <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer mb-4">
                            <input type="checkbox" className="w-5 h-5 text-emerald-600" id="acknowledge" />
                            <span className="text-sm font-medium text-slate-700">I acknowledge that I have read and understood this document.</span>
                        </label>
                        <button 
                            onClick={() => {
                                // In real app, check checkbox state
                                const doc = DOCUMENTS.find(d => d.id === signDocId);
                                if(doc) handleSignOff(doc);
                            }}
                            className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700"
                        >
                            Sign Off Training
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Video Modal */}
        {watchVideoId && (
            <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center z-50 p-4">
                <div className="bg-black rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col">
                     <div className="flex justify-between items-center p-4 bg-slate-900 text-white">
                        <h3 className="font-bold">{resources.find(r => r.id === watchVideoId)?.title}</h3>
                        <button onClick={() => setWatchVideoId(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors"><XCircle /></button>
                     </div>
                     <div className="relative w-full aspect-video bg-black">
                         <iframe 
                           width="100%" 
                           height="100%" 
                           src={getEmbedUrl(resources.find(r => r.id === watchVideoId)?.url || '')} 
                           title="Video player" 
                           frameBorder="0" 
                           allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                           allowFullScreen
                           className="absolute inset-0"
                         ></iframe>
                     </div>
                     <div className="p-4 bg-slate-900 flex justify-end border-t border-slate-800">
                         <button 
                           onClick={() => {
                               const vid = resources.find(r => r.id === watchVideoId);
                               if(vid) handleCompleteVideo(vid);
                           }}
                           className="px-6 py-2 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-700 flex items-center gap-2"
                         >
                             <CheckCircle size={18} /> Mark as Completed
                         </button>
                     </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default TrainingModule;
