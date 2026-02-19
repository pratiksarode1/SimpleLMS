
import React, { useState } from 'react';
import { 
  SafetyIncident, 
  SeverityLevel, 
  TreatmentType, 
  IncidentStatus, 
  User, 
  UserRole,
  NearMiss,
  NearMissType,
  SafetyObservation,
  SafetyGlobalConfig
} from '../types';
import { 
  SAFETY_INCIDENTS, 
  NEAR_MISSES,
  SAFETY_OBSERVATIONS,
  SAFETY_CONFIG,
  USERS, 
  LOCATIONS, 
  updateSafetyIncidents,
  updateNearMisses,
  updateSafetyObservations,
  updateSafetyConfig
} from '../mockData';
import { 
  AlertTriangle, 
  Plus, 
  FileText, 
  Activity, 
  Calendar, 
  MapPin, 
  User as UserIcon, 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  EyeOff, 
  Search, 
  Siren, 
  Clock, 
  ArrowLeft, 
  Filter, 
  Eye, 
  Megaphone, 
  AlertCircle, 
  Settings, 
  ShieldCheck, 
  Target, 
  Send, 
  Stethoscope, 
  Flame, 
  CheckSquare,
  BookOpen, 
  Edit3,
  Save
} from 'lucide-react';

interface SafetyModuleProps {
  currentUser: User;
}

type SafetyView = 'DASHBOARD' | 'FORM_INCIDENT' | 'FORM_NEARMISS' | 'FORM_OBSERVATION' | 'DETAIL_INCIDENT' | 'DETAIL_NEARMISS' | 'DETAIL_OBSERVATION';

const StatusBadge = ({ status }: { status: string }) => {
  let color = 'bg-slate-100 text-slate-700 border-slate-200';
  if (status === IncidentStatus.APPROVED || status === IncidentStatus.CLOSED) color = 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (status === IncidentStatus.SUBMITTED) color = 'bg-blue-100 text-blue-700 border-blue-200';
  if (status === IncidentStatus.ACTION_PENDING_REVIEW) color = 'bg-orange-100 text-orange-700 border-orange-200';
  if (status === IncidentStatus.REJECTED) color = 'bg-red-100 text-red-700 border-red-200';

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${color}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

const SafetyModule: React.FC<SafetyModuleProps> = ({ currentUser }) => {
  const [view, setView] = useState<SafetyView>('DASHBOARD');
  const [config, setConfig] = useState<SafetyGlobalConfig>(SAFETY_CONFIG);
  
  // Guide State
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isEditingGuide, setIsEditingGuide] = useState(false);
  const [tempGuideContent, setTempGuideContent] = useState('');

  // Data States
  const [incidents, setIncidents] = useState<SafetyIncident[]>(SAFETY_INCIDENTS);
  const [nearMisses, setNearMisses] = useState<NearMiss[]>(NEAR_MISSES);
  const [observations, setObservations] = useState<SafetyObservation[]>(SAFETY_OBSERVATIONS);
  
  // Selection States
  const [selectedIncident, setSelectedIncident] = useState<SafetyIncident | null>(null);
  const [selectedNearMiss, setSelectedNearMiss] = useState<NearMiss | null>(null);
  const [selectedObservation, setSelectedObservation] = useState<SafetyObservation | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('ALL');
  
  // Form States
  const [incidentForm, setIncidentForm] = useState<Partial<SafetyIncident>>({});
  const [nearMissForm, setNearMissForm] = useState<Partial<NearMiss>>({});
  const [observationForm, setObservationForm] = useState<Partial<SafetyObservation>>({});
  
  const [formError, setFormError] = useState('');

  // Permissions based on Config
  const canApprove = config.safetyApprovers.includes(currentUser.id) || currentUser.role === UserRole.SUPER_ADMIN;

  // --- Helpers ---

  const getSeverityBadge = (level: SeverityLevel) => {
    switch (level) {
      case SeverityLevel.SEV_1_FATALITY:
        return { bg: 'bg-black text-white', label: '1 - CRITICAL', icon: Siren };
      case SeverityLevel.SEV_2_SEVERE:
        return { bg: 'bg-red-600 text-white', label: '2 - SEVERE', icon: ShieldAlert };
      case SeverityLevel.SEV_3_MODERATE:
        return { bg: 'bg-orange-500 text-white', label: '3 - MODERATE', icon: Activity };
      case SeverityLevel.SEV_4_MINOR:
        return { bg: 'bg-yellow-500 text-white', label: '4 - MINOR', icon: FileText };
      default:
        return { bg: 'bg-slate-500 text-white', label: '5 - INTERNAL', icon: CheckCircle };
    }
  };

  const isOshaRecordable = (severity: SeverityLevel) => severity !== SeverityLevel.SEV_5_INTERNAL;

  const getAlertMessage = (data: Partial<SafetyIncident>) => {
    if (data.severity === SeverityLevel.SEV_1_FATALITY) {
      return { type: 'URGENT', msg: 'URGENT: REPORT TO OSHA WITHIN 8 HOURS (FATALITY)' };
    }
    if (data.severity === SeverityLevel.SEV_2_SEVERE && 
       (data.wasHospitalizedOvernight || data.treatmentType === TreatmentType.HOSPITALIZATION)) {
      return { type: 'URGENT', msg: 'URGENT: REPORT TO OSHA WITHIN 24 HOURS (IN-PATIENT HOSPITALIZATION)' };
    }
    return null;
  };

  const saveGuide = () => {
    const updatedConfig = { ...config, safetyGuide: tempGuideContent };
    setConfig(updatedConfig);
    updateSafetyConfig(updatedConfig);
    setIsEditingGuide(false);
  };

  // --- Actions ---

  // Incident Actions
  const handleStartReport = () => {
    setIncidentForm({
      reportedByUserId: currentUser.id,
      incidentDate: new Date().toISOString().split('T')[0],
      incidentTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      severity: SeverityLevel.SEV_5_INTERNAL, // Default
      treatmentType: TreatmentType.FIRST_AID,
      wasTreatedInER: false,
      wasHospitalizedOvernight: false,
      isPrivacyCase: false
    });
    setFormError('');
    setView('FORM_INCIDENT');
  };

  const submitIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (incidentForm.injuredUserId === currentUser.id) {
      setFormError('Self-filing is not allowed. Please ask your supervisor to file this report.');
      return;
    }
    if (!incidentForm.injuredUserId || !incidentForm.locationId) {
      setFormError('Please complete all required fields.');
      return;
    }

    const newIncident: SafetyIncident = {
      id: Date.now().toString(),
      reportNumber: `INC-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: IncidentStatus.SUBMITTED,
      ...incidentForm as SafetyIncident
    };

    const updated = [newIncident, ...incidents];
    setIncidents(updated);
    updateSafetyIncidents(updated);
    setView('DASHBOARD');
  };

  const handleIncidentStatus = (id: string, newStatus: IncidentStatus) => {
    const updated = incidents.map(inc => inc.id === id ? { ...inc, status: newStatus, updatedAt: new Date().toISOString() } : inc);
    setIncidents(updated);
    updateSafetyIncidents(updated);
    if (selectedIncident) setSelectedIncident({ ...selectedIncident, status: newStatus });
  };

  // Near Miss Actions
  const handleStartNearMiss = () => {
    setNearMissForm({
        reportedByUserId: currentUser.id,
        eventDate: new Date().toISOString().split('T')[0],
        type: NearMissType.IFE
    });
    setFormError('');
    setView('FORM_NEARMISS');
  };

  const submitNearMiss = (e: React.FormEvent) => {
      e.preventDefault();
      if (!nearMissForm.eventPersonName || !nearMissForm.locationId || !nearMissForm.details) {
          setFormError('Please fill in all fields.');
          return;
      }
      
      const newNM: NearMiss = {
          id: `nm-${Date.now()}`,
          reportNumber: `NM-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
          type: nearMissForm.type || NearMissType.IFE,
          reportedByUserId: currentUser.id,
          eventPersonName: nearMissForm.eventPersonName!,
          eventDate: nearMissForm.eventDate!,
          locationId: nearMissForm.locationId!,
          details: nearMissForm.details!,
          status: IncidentStatus.SUBMITTED,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
      };

      const updated = [newNM, ...nearMisses];
      setNearMisses(updated);
      updateNearMisses(updated);
      setView('DASHBOARD');
  };

  const handleNearMissStatus = (id: string, newStatus: IncidentStatus) => {
      const updated = nearMisses.map(nm => nm.id === id ? { ...nm, status: newStatus, updatedAt: new Date().toISOString() } : nm);
      setNearMisses(updated);
      updateNearMisses(updated);
      if (selectedNearMiss) setSelectedNearMiss({ ...selectedNearMiss, status: newStatus });
  };

  // Observation Actions
  const handleStartObservation = () => {
      setObservationForm({
          reportedByUserId: currentUser.id,
          createdAt: new Date().toISOString() // Date Reported (Auto)
      });
      setFormError('');
      setView('FORM_OBSERVATION');
  };

  const submitObservation = (e: React.FormEvent) => {
      e.preventDefault();
      if (!observationForm.locationId || !observationForm.details) {
          setFormError('Please fill in plant/location and details.');
          return;
      }

      const newObs: SafetyObservation = {
          id: `obs-${Date.now()}`,
          reportNumber: `OBS-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
          reportedByUserId: currentUser.id,
          locationId: observationForm.locationId!,
          specificLocation: observationForm.specificLocation || '',
          details: observationForm.details!,
          status: IncidentStatus.SUBMITTED,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
      };

      const updated = [newObs, ...observations];
      setObservations(updated);
      updateSafetyObservations(updated);
      setView('DASHBOARD');
  };

  const handleObservationStatus = (id: string, newStatus: IncidentStatus) => {
      const updated = observations.map(obs => obs.id === id ? { ...obs, status: newStatus, updatedAt: new Date().toISOString() } : obs);
      setObservations(updated);
      updateSafetyObservations(updated);
      if (selectedObservation) setSelectedObservation({ ...selectedObservation, status: newStatus });
  };

  const handleActionSubmit = () => {
      if (!selectedObservation) return;
      const updatedObs: SafetyObservation = {
          ...selectedObservation,
          status: IncidentStatus.ACTION_PENDING_REVIEW,
          actionCompletedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
      };
      const updatedList = observations.map(o => o.id === selectedObservation.id ? updatedObs : o);
      setObservations(updatedList);
      updateSafetyObservations(updatedList);
      setSelectedObservation(updatedObs);
  };

  const assignAction = (userId: string) => {
      if (!selectedObservation) return;
      const date = new Date();
      date.setDate(date.getDate() + 30); // Add 30 days
      
      const updatedObs: SafetyObservation = {
          ...selectedObservation,
          assignedActionUserId: userId,
          actionDueDate: date.toISOString(),
          updatedAt: new Date().toISOString()
      };

      const updatedList = observations.map(o => o.id === selectedObservation.id ? updatedObs : o);
      setObservations(updatedList);
      updateSafetyObservations(updatedList);
      setSelectedObservation(updatedObs);
  };

  // --- Views ---

  const renderDashboard = () => {
    // Filter Logic
    const filteredIncidents = selectedLocationId === 'ALL' ? incidents : incidents.filter(i => i.locationId === selectedLocationId);
    const filteredNM = selectedLocationId === 'ALL' ? nearMisses : nearMisses.filter(nm => nm.locationId === selectedLocationId);
    const filteredObs = selectedLocationId === 'ALL' ? observations : observations.filter(o => o.locationId === selectedLocationId);

    // Stats Logic
    const openCases = filteredIncidents.filter(i => i.status !== IncidentStatus.CLOSED).length;
    const recordables = filteredIncidents.filter(i => isOshaRecordable(i.severity)).length;
    
    const lastRecordable = filteredIncidents
      .filter(i => isOshaRecordable(i.severity))
      .sort((a, b) => new Date(b.incidentDate).getTime() - new Date(a.incidentDate).getTime())[0];
    
    const daysFree = lastRecordable 
      ? Math.floor((new Date().getTime() - new Date(lastRecordable.incidentDate).getTime()) / (1000 * 60 * 60 * 24))
      : 365;

    return (
      <div className="space-y-8 pb-10">
        {/* Header & Filter */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
            <div>
                 <h2 className="text-2xl font-bold text-slate-900">Safety Dashboard</h2>
                 <p className="text-slate-500 mt-1">Monitor safety performance across the organization.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
               <button 
                 onClick={() => { setTempGuideContent(config.safetyGuide || ''); setIsGuideOpen(true); }}
                 className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 shadow-sm flex items-center gap-2" 
                 title="How to use"
               >
                   <BookOpen size={20} /> <span className="hidden sm:inline text-sm font-medium">Guide</span>
               </button>
               
               <div className="flex items-center gap-3 bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex-1 md:flex-none">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-3 hidden sm:inline">Filter by Site</span>
                  <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
                  <div className="relative group w-full sm:w-auto">
                      <MapPin size={16} className="absolute left-2.5 top-2.5 text-slate-400 group-hover:text-blue-500 transition-colors pointer-events-none" />
                      <select 
                          value={selectedLocationId}
                          onChange={(e) => setSelectedLocationId(e.target.value)}
                          className="w-full sm:w-auto pl-9 pr-8 py-2 bg-transparent text-sm font-semibold text-slate-700 focus:ring-0 outline-none cursor-pointer hover:text-blue-600 transition-colors min-w-[140px]"
                      >
                          <option value="ALL">All Locations</option>
                          {LOCATIONS.map(loc => (
                              <option key={loc.id} value={loc.id}>{loc.name}</option>
                          ))}
                      </select>
                  </div>
               </div>
            </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-600 to-green-700 text-white rounded-xl p-6 shadow-sm relative overflow-hidden">
            <div className="relative z-10">
                <p className="text-green-100 font-medium mb-1">Days Incident Free</p>
                <div className="flex items-end gap-2">
                <span className="text-4xl font-bold">{daysFree}</span>
                <span className="text-sm opacity-80 mb-1">days</span>
                </div>
            </div>
            <Activity className="absolute right-[-20px] bottom-[-20px] text-green-500 opacity-20" size={120} />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-slate-500 font-medium mb-1">Open Cases</p>
                <span className="text-4xl font-bold text-slate-800">{openCases}</span>
            </div>
            <div className="p-4 bg-blue-50 text-blue-600 rounded-full">
                <FileText size={24} />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-slate-500 font-medium mb-1">OSHA Recordables (YTD)</p>
                <span className="text-4xl font-bold text-slate-800">{recordables}</span>
            </div>
             <div className="p-4 bg-orange-50 text-orange-600 rounded-full">
                <ShieldAlert size={24} />
            </div>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button onClick={handleStartNearMiss} className="bg-amber-500 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-amber-600 font-bold flex items-center justify-center gap-2 shadow-sm transition-all text-sm"><AlertCircle size={18} /> Report Near Miss</button>
            <button onClick={handleStartObservation} className="bg-teal-500 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-teal-600 font-bold flex items-center justify-center gap-2 shadow-sm transition-all text-sm"><Eye size={18} /> Report Observation</button>
            <button onClick={handleStartReport} className="bg-blue-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-blue-700 font-bold flex items-center justify-center gap-2 shadow-sm transition-all text-sm"><Siren size={18} /> Report Incident</button>
        </div>

        {/* 1. Incident Log */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2 font-bold text-slate-700"><Siren size={18} className="text-red-500" /> Incident Log</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                    <th className="px-6 py-3">Report #</th>
                    <th className="px-6 py-3">Severity</th>
                    <th className="px-6 py-3">Injured Person</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {filteredIncidents.length === 0 ? <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">No incidents found.</td></tr> : 
                    filteredIncidents.map(inc => {
                        const injured = USERS.find(u => u.id === inc.injuredUserId);
                        const badge = getSeverityBadge(inc.severity);
                        return (
                        <tr key={inc.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-mono text-slate-500">{inc.reportNumber}</td>
                            <td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${badge.bg}`}><badge.icon size={12} /> {badge.label}</span></td>
                            <td className="px-6 py-4">{inc.isPrivacyCase ? <span className="flex items-center gap-2 text-slate-500 italic"><EyeOff size={16} /> Privacy Case</span> : <span className="font-medium text-slate-800">{injured?.name || 'Unknown'}</span>}</td>
                            <td className="px-6 py-4 text-slate-600">{inc.incidentDate}</td>
                            <td className="px-6 py-4"><StatusBadge status={inc.status} /></td>
                            <td className="px-6 py-4"><button onClick={() => { setSelectedIncident(inc); setView('DETAIL_INCIDENT'); }} className="text-blue-600 hover:text-blue-800 font-medium">View</button></td>
                        </tr>
                        );
                    })
                }
                </tbody>
            </table>
          </div>
        </div>

        {/* 2. Near Miss Log */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2 font-bold text-slate-700"><AlertCircle size={18} className="text-amber-500" /> Near Miss Log</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                    <th className="px-6 py-3">Report #</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Event Person</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Details</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {filteredNM.length === 0 ? <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400">No near misses reported.</td></tr> : 
                    filteredNM.map(nm => (
                        <tr key={nm.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-mono text-slate-500">{nm.reportNumber}</td>
                            <td className="px-6 py-4"><span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-bold">{nm.type}</span></td>
                            <td className="px-6 py-4 font-medium text-slate-800">{nm.eventPersonName}</td>
                            <td className="px-6 py-4 text-slate-600">{nm.eventDate}</td>
                            <td className="px-6 py-4 text-slate-600 truncate max-w-xs" title={nm.details}>{nm.details}</td>
                            <td className="px-6 py-4"><StatusBadge status={nm.status} /></td>
                            <td className="px-6 py-4"><button onClick={() => { setSelectedNearMiss(nm); setView('DETAIL_NEARMISS'); }} className="text-blue-600 hover:text-blue-800 font-medium">View</button></td>
                        </tr>
                    ))
                }
                </tbody>
            </table>
          </div>
        </div>

        {/* 3. Safety Observations Log */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2 font-bold text-slate-700"><Eye size={18} className="text-teal-500" /> Safety Observations Log</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                    <th className="px-6 py-3">Report #</th>
                    <th className="px-6 py-3">Location</th>
                    <th className="px-6 py-3">Reported By</th>
                    <th className="px-6 py-3">Assigned To</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Action</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {filteredObs.length === 0 ? <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">No observations reported.</td></tr> : 
                    filteredObs.map(obs => (
                        <tr key={obs.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-mono text-slate-500">{obs.reportNumber}</td>
                            <td className="px-6 py-4 font-medium text-slate-800">{LOCATIONS.find(l=>l.id===obs.locationId)?.name} {obs.specificLocation && `(${obs.specificLocation})`}</td>
                            <td className="px-6 py-4 text-slate-600">{USERS.find(u=>u.id===obs.reportedByUserId)?.name}</td>
                            <td className="px-6 py-4 text-slate-600">{USERS.find(u=>u.id===obs.assignedActionUserId)?.name || '-'}</td>
                            <td className="px-6 py-4"><StatusBadge status={obs.status} /></td>
                            <td className="px-6 py-4"><button onClick={() => { setSelectedObservation(obs); setView('DETAIL_OBSERVATION'); }} className="text-blue-600 hover:text-blue-800 font-medium">View</button></td>
                        </tr>
                    ))
                }
                </tbody>
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
                    <h3 className="text-xl font-bold text-slate-800">Safety Module Guide</h3>
                </div>
                <button onClick={() => { setIsGuideOpen(false); setIsEditingGuide(false); }} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full transition-colors"><XCircle size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-white">
                {isEditingGuide ? (
                    <textarea 
                        className="w-full h-full p-4 border border-slate-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        value={tempGuideContent}
                        onChange={(e) => setTempGuideContent(e.target.value)}
                        placeholder="Type guide instructions here..."
                    />
                ) : (
                    <div className="prose prose-slate max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">
                            {config.safetyGuide || "No guide instructions provided yet."}
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
                            onClick={() => { setIsEditingGuide(false); setTempGuideContent(config.safetyGuide || ''); }}
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

  // ... (Config and other helpers)

  const renderIncidentForm = () => {
    const alert = getAlertMessage(incidentForm);
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={() => setView('DASHBOARD')} className="mb-6 text-slate-500 hover:text-slate-800 flex items-center gap-2"><ArrowLeft size={18} /> Back to Dashboard</button>
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-slate-900 text-white p-6 border-b border-slate-800">
            <h2 className="text-xl font-bold">New Incident Report</h2>
            <p className="text-slate-400 text-sm mt-1">Complete all fields accurately. False reporting is a violation of company policy.</p>
          </div>
          
          <form onSubmit={submitIncident} className="p-8 space-y-8">
            {formError && <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-3"><AlertTriangle size={20} /><span className="font-medium">{formError}</span></div>}
            {alert && <div className="p-4 bg-red-600 text-white rounded-lg flex items-start gap-3 shadow-md animate-pulse"><Siren size={24} className="mt-1 shrink-0" /><div><h4 className="font-bold text-lg">IMMEDIATE ACTION REQUIRED</h4><p>{alert.msg}</p></div></div>}
            
            {/* Section 1: Employee Information */}
            <div className="space-y-4">
               <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <UserIcon className="text-blue-600" size={20} /> Employee Information
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1">Injured Person</label>
                      <select 
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700" 
                        value={incidentForm.injuredUserId || ''} 
                        onChange={e => setIncidentForm({...incidentForm, injuredUserId: e.target.value})} 
                        required
                      >
                          <option value="">Select Employee...</option>
                          {USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                      <p className="text-xs text-slate-400 mt-1">You cannot report an injury for yourself.</p>
                  </div>
                  <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1">Location</label>
                      <select 
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700" 
                        value={incidentForm.locationId || ''} 
                        onChange={e => setIncidentForm({...incidentForm, locationId: e.target.value})} 
                        required
                      >
                          <option value="">Select Location...</option>
                          {LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1">Date of Incident</label>
                      <input 
                        type="date" 
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700" 
                        value={incidentForm.incidentDate} 
                        onChange={e => setIncidentForm({...incidentForm, incidentDate: e.target.value})} 
                        required 
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1">Time of Incident</label>
                      <input 
                        type="time" 
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700" 
                        value={incidentForm.incidentTime} 
                        onChange={e => setIncidentForm({...incidentForm, incidentTime: e.target.value})} 
                        required 
                      />
                  </div>
               </div>
            </div>

            {/* Section 2: Classification */}
            <div className="space-y-4">
               <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <ShieldCheck className="text-blue-600" size={20} /> Classification
               </h3>
               
               <div>
                   <label className="block text-sm font-semibold text-slate-600 mb-3">Severity Level</label>
                   <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {[
                        { lvl: 1, label: 'CRITICAL', icon: Siren },
                        { lvl: 2, label: 'SEVERE', icon: ShieldAlert },
                        { lvl: 3, label: 'MODERATE', icon: Activity },
                        { lvl: 4, label: 'MINOR', icon: FileText },
                        { lvl: 5, label: 'INTERNAL', icon: CheckCircle },
                      ].map(({ lvl, label, icon: Icon }) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setIncidentForm({...incidentForm, severity: lvl as SeverityLevel})}
                            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                                incidentForm.severity === lvl 
                                ? 'bg-slate-700 text-white border-slate-700 shadow-lg scale-105' 
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                              <Icon size={24} />
                              <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
                          </button>
                      ))}
                   </div>
                   <p className="text-xs text-slate-400 mt-2">Severity 1-4 are OSHA Recordable. Severity 5 is internal only.</p>
               </div>

               <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                   <label className="flex items-start gap-3 cursor-pointer">
                       <input 
                         type="checkbox" 
                         className="mt-1 w-5 h-5 rounded text-blue-600 focus:ring-blue-500" 
                         checked={incidentForm.isPrivacyCase || false}
                         onChange={e => setIncidentForm({...incidentForm, isPrivacyCase: e.target.checked})}
                       />
                       <div>
                           <span className="block font-bold text-slate-700">Privacy Case</span>
                           <span className="text-xs text-slate-500">Check this for sensitive injuries (reproductive, mental health, etc.). The employee name will be masked in general logs.</span>
                       </div>
                   </label>
               </div>
            </div>

            {/* Section 3: Medical Treatment */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Stethoscope className="text-blue-600" size={20} /> Medical Treatment
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                       <label className="block text-sm font-semibold text-slate-600 mb-1">Treatment Type</label>
                       <select 
                         className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
                         value={incidentForm.treatmentType}
                         onChange={e => setIncidentForm({...incidentForm, treatmentType: e.target.value as TreatmentType})}
                       >
                           <option value={TreatmentType.FIRST_AID}>First Aid</option>
                           <option value={TreatmentType.MEDICAL_TREATMENT}>Medical Treatment</option>
                           <option value={TreatmentType.ER}>Emergency Room</option>
                           <option value={TreatmentType.HOSPITALIZATION}>Hospitalization</option>
                       </select>
                   </div>
                   <div>
                       <label className="block text-sm font-semibold text-slate-600 mb-1">Physician Name</label>
                       <input 
                         type="text" 
                         className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
                         value={incidentForm.physicianName || ''}
                         onChange={e => setIncidentForm({...incidentForm, physicianName: e.target.value})}
                       />
                   </div>
                   <div className="md:col-span-2">
                       <label className="block text-sm font-semibold text-slate-600 mb-1">Facility Name & Address</label>
                       <input 
                         type="text" 
                         placeholder="e.g. City General, 123 Main St"
                         className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
                         value={incidentForm.facilityName || ''}
                         onChange={e => setIncidentForm({...incidentForm, facilityName: e.target.value})}
                       />
                   </div>
               </div>

               <div className="flex flex-col sm:flex-row gap-6 mt-4">
                   <label className="flex items-center gap-2 cursor-pointer">
                       <input 
                         type="checkbox" 
                         className="w-4 h-4 text-blue-600 rounded" 
                         checked={incidentForm.wasTreatedInER || false}
                         onChange={e => setIncidentForm({...incidentForm, wasTreatedInER: e.target.checked})}
                       />
                       <span className="text-sm font-medium text-slate-700">Treated in ER?</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer">
                       <input 
                         type="checkbox" 
                         className="w-4 h-4 text-blue-600 rounded" 
                         checked={incidentForm.wasHospitalizedOvernight || false}
                         onChange={e => setIncidentForm({...incidentForm, wasHospitalizedOvernight: e.target.checked})}
                       />
                       <span className="text-sm font-medium text-slate-700">Hospitalized Overnight?</span>
                   </label>
               </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setView('DASHBOARD')} 
                  className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all"
                >
                    Submit Report
                </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderNearMissForm = () => (
    <div className="max-w-4xl mx-auto">
        <button onClick={() => setView('DASHBOARD')} className="mb-6 text-slate-500 hover:text-slate-800 flex items-center gap-2"><ArrowLeft size={18} /> Back to Dashboard</button>
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-amber-500 text-white p-6 border-b border-amber-600">
                <h2 className="text-xl font-bold">Report Near Miss</h2>
                <p className="text-amber-100 text-sm mt-1">Reporting hazards helps prevent future accidents.</p>
            </div>
            <form onSubmit={submitNearMiss} className="p-8 space-y-6">
                {formError && <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-3"><AlertTriangle size={20} /><span className="font-medium">{formError}</span></div>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Type</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="nmType" checked={nearMissForm.type === NearMissType.IFE} onChange={() => setNearMissForm({...nearMissForm, type: NearMissType.IFE})} className="text-amber-500 focus:ring-amber-500" />
                                <span>Unsafe Condition (IFE)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="nmType" checked={nearMissForm.type === NearMissType.IFO} onChange={() => setNearMissForm({...nearMissForm, type: NearMissType.IFO})} className="text-amber-500 focus:ring-amber-500" />
                                <span>Unsafe Act (IFO)</span>
                            </label>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Date of Event</label>
                        <input type="date" className="w-full p-2.5 border border-slate-300 rounded-lg" value={nearMissForm.eventDate} onChange={e => setNearMissForm({...nearMissForm, eventDate: e.target.value})} required />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Person Involved (Optional)</label>
                        <input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg" placeholder="Name" value={nearMissForm.eventPersonName || ''} onChange={e => setNearMissForm({...nearMissForm, eventPersonName: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Location</label>
                        <select className="w-full p-2.5 border border-slate-300 rounded-lg" value={nearMissForm.locationId || ''} onChange={e => setNearMissForm({...nearMissForm, locationId: e.target.value})} required>
                            <option value="">Select Location...</option>
                            {LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Description</label>
                        <textarea className="w-full p-2.5 border border-slate-300 rounded-lg h-32" placeholder="Describe what happened..." value={nearMissForm.details || ''} onChange={e => setNearMissForm({...nearMissForm, details: e.target.value})} required></textarea>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                    <button type="button" onClick={() => setView('DASHBOARD')} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg">Cancel</button>
                    <button type="submit" className="px-8 py-2.5 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 shadow-lg">Submit Report</button>
                </div>
            </form>
        </div>
    </div>
  );

  const renderObservationForm = () => (
    <div className="max-w-4xl mx-auto">
        <button onClick={() => setView('DASHBOARD')} className="mb-6 text-slate-500 hover:text-slate-800 flex items-center gap-2"><ArrowLeft size={18} /> Back to Dashboard</button>
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-teal-600 text-white p-6 border-b border-teal-700">
                <h2 className="text-xl font-bold">Safety Observation</h2>
                <p className="text-teal-100 text-sm mt-1">See something? Say something.</p>
            </div>
            <form onSubmit={submitObservation} className="p-8 space-y-6">
                {formError && <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-3"><AlertTriangle size={20} /><span className="font-medium">{formError}</span></div>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Plant / Location</label>
                        <select className="w-full p-2.5 border border-slate-300 rounded-lg" value={observationForm.locationId || ''} onChange={e => setObservationForm({...observationForm, locationId: e.target.value})} required>
                            <option value="">Select Location...</option>
                            {LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Specific Area</label>
                        <input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg" placeholder="e.g. Line 4, Warehouse A" value={observationForm.specificLocation || ''} onChange={e => setObservationForm({...observationForm, specificLocation: e.target.value})} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Details</label>
                        <textarea className="w-full p-2.5 border border-slate-300 rounded-lg h-32" placeholder="Describe the observation..." value={observationForm.details || ''} onChange={e => setObservationForm({...observationForm, details: e.target.value})} required></textarea>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                    <button type="button" onClick={() => setView('DASHBOARD')} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg">Cancel</button>
                    <button type="submit" className="px-8 py-2.5 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 shadow-lg">Submit Observation</button>
                </div>
            </form>
        </div>
    </div>
  );

  const renderDetailIncident = () => {
      if (!selectedIncident) return null;
      const injured = USERS.find(u => u.id === selectedIncident.injuredUserId);
      const reporter = USERS.find(u => u.id === selectedIncident.reportedByUserId);
      const badge = getSeverityBadge(selectedIncident.severity);
      const BadgeIcon = badge.icon;

      return (
          <div className="max-w-4xl mx-auto space-y-6">
              <button onClick={() => setView('DASHBOARD')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold"><ArrowLeft size={18} /> Back</button>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50">
                      <div>
                          <h2 className="text-2xl font-bold text-slate-800">{selectedIncident.reportNumber}</h2>
                          <div className="flex items-center gap-2 mt-2">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${badge.bg}`}><BadgeIcon size={12} /> {badge.label}</span>
                              <StatusBadge status={selectedIncident.status} />
                          </div>
                      </div>
                      {canApprove && selectedIncident.status === IncidentStatus.SUBMITTED && (
                          <div className="flex gap-2">
                              <button onClick={() => handleIncidentStatus(selectedIncident.id, IncidentStatus.REJECTED)} className="px-4 py-2 border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50">Reject</button>
                              <button onClick={() => handleIncidentStatus(selectedIncident.id, IncidentStatus.APPROVED)} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-sm">Approve Incident</button>
                          </div>
                      )}
                      {canApprove && selectedIncident.status === IncidentStatus.APPROVED && (
                          <button onClick={() => handleIncidentStatus(selectedIncident.id, IncidentStatus.CLOSED)} className="px-4 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 shadow-sm">Close Case</button>
                      )}
                  </div>
                  <div className="p-8 space-y-8">
                      <div className="grid grid-cols-2 gap-8">
                          <div>
                              <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Injured Person</h4>
                              <p className="text-lg font-medium text-slate-800">{selectedIncident.isPrivacyCase ? 'Redacted (Privacy Case)' : injured?.name}</p>
                          </div>
                          <div>
                              <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Date & Time</h4>
                              <p className="text-lg font-medium text-slate-800">{new Date(selectedIncident.incidentDate).toLocaleDateString()} at {selectedIncident.incidentTime}</p>
                          </div>
                          <div>
                              <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Location</h4>
                              <p className="text-lg font-medium text-slate-800">{LOCATIONS.find(l => l.id === selectedIncident.locationId)?.name}</p>
                          </div>
                          <div>
                              <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Reported By</h4>
                              <p className="text-lg font-medium text-slate-800">{reporter?.name}</p>
                          </div>
                      </div>
                      <div className="border-t border-slate-100 pt-6">
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Medical Details</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                              <p><span className="font-semibold">Treatment:</span> {selectedIncident.treatmentType.replace('_', ' ')}</p>
                              <p><span className="font-semibold">Facility:</span> {selectedIncident.facilityName || 'N/A'}</p>
                              <p><span className="font-semibold">ER Visit:</span> {selectedIncident.wasTreatedInER ? 'Yes' : 'No'}</p>
                              <p><span className="font-semibold">Hospitalized:</span> {selectedIncident.wasHospitalizedOvernight ? 'Yes' : 'No'}</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  const renderDetailNearMiss = () => {
      if (!selectedNearMiss) return null;
      return (
          <div className="max-w-4xl mx-auto space-y-6">
              <button onClick={() => setView('DASHBOARD')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold"><ArrowLeft size={18} /> Back</button>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                      <div>
                          <h2 className="text-2xl font-bold text-slate-800">{selectedNearMiss.reportNumber}</h2>
                          <div className="flex items-center gap-2 mt-2">
                              <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-md text-xs font-bold">{selectedNearMiss.type}</span>
                              <StatusBadge status={selectedNearMiss.status} />
                          </div>
                      </div>
                      {canApprove && selectedNearMiss.status === IncidentStatus.SUBMITTED && (
                          <div className="flex gap-2">
                              <button onClick={() => handleNearMissStatus(selectedNearMiss.id, IncidentStatus.REJECTED)} className="px-4 py-2 border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50">Reject</button>
                              <button onClick={() => handleNearMissStatus(selectedNearMiss.id, IncidentStatus.APPROVED)} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-sm">Acknowledge</button>
                          </div>
                      )}
                  </div>
                  <div className="p-8 space-y-6">
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Description of Event</h4>
                          <p className="text-slate-800">{selectedNearMiss.details}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-6 text-sm">
                          <div>
                              <span className="block text-slate-400 text-xs font-bold uppercase">Person Involved</span>
                              <span className="font-medium">{selectedNearMiss.eventPersonName}</span>
                          </div>
                          <div>
                              <span className="block text-slate-400 text-xs font-bold uppercase">Location</span>
                              <span className="font-medium">{LOCATIONS.find(l=>l.id===selectedNearMiss.locationId)?.name}</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  const renderDetailObservation = () => {
      if (!selectedObservation) return null;
      return (
          <div className="max-w-4xl mx-auto space-y-6">
              <button onClick={() => setView('DASHBOARD')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold"><ArrowLeft size={18} /> Back</button>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                      <div>
                          <h2 className="text-2xl font-bold text-slate-800">{selectedObservation.reportNumber}</h2>
                          <div className="mt-2"><StatusBadge status={selectedObservation.status} /></div>
                      </div>
                      {canApprove && selectedObservation.status !== IncidentStatus.CLOSED && (
                          <button onClick={() => handleObservationStatus(selectedObservation.id, IncidentStatus.CLOSED)} className="px-4 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 shadow-sm">Close Observation</button>
                      )}
                  </div>
                  <div className="p-8 space-y-8">
                      <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Observation Details</h4>
                          <p className="text-lg text-slate-800">{selectedObservation.details}</p>
                      </div>
                      
                      <div className="border-t border-slate-100 pt-6">
                          <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><CheckSquare size={18} /> Action Tracking</h4>
                          {selectedObservation.assignedActionUserId ? (
                              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex justify-between items-center">
                                  <div>
                                      <p className="text-sm font-bold text-slate-700">Assigned to: {USERS.find(u=>u.id===selectedObservation.assignedActionUserId)?.name}</p>
                                      <p className="text-xs text-slate-500">Due: {new Date(selectedObservation.actionDueDate!).toLocaleDateString()}</p>
                                  </div>
                                  {currentUser.id === selectedObservation.assignedActionUserId && selectedObservation.status !== IncidentStatus.ACTION_PENDING_REVIEW && selectedObservation.status !== IncidentStatus.CLOSED && (
                                      <button onClick={handleActionSubmit} className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700">Mark Completed</button>
                                  )}
                                  {selectedObservation.actionCompletedAt && <span className="text-green-600 font-bold text-xs flex items-center gap-1"><CheckCircle size={14}/> Completed</span>}
                              </div>
                          ) : (
                              <div className="flex gap-2">
                                  <select className="p-2 border border-slate-300 rounded text-sm" onChange={(e) => { if(e.target.value) assignAction(e.target.value); }}>
                                      <option value="">Assign Action To...</option>
                                      {USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                  </select>
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
        {view === 'DASHBOARD' && renderDashboard()}
        {view === 'FORM_INCIDENT' && renderIncidentForm()}
        {view === 'FORM_NEARMISS' && renderNearMissForm()}
        {view === 'FORM_OBSERVATION' && renderObservationForm()}
        {view === 'DETAIL_INCIDENT' && renderDetailIncident()}
        {view === 'DETAIL_NEARMISS' && renderDetailNearMiss()}
        {view === 'DETAIL_OBSERVATION' && renderDetailObservation()}
        {isGuideOpen && renderGuideModal()}
    </div>
  );
};

export default SafetyModule;
