
import { 
  User, UserRole, UserStatus, SystemRole, Department, Location,
  SafetyIncident, IncidentStatus, SeverityLevel, TreatmentType,
  NearMiss, NearMissType, SafetyObservation, SafetyGlobalConfig,
  Document, DocStatus, DocChangeRequest, DocTemplate, DocumentTypeConfig, DocumentFolder, DocumentGlobalConfig,
  TrainingRecord, LearningResource,
  MasterItem, MasterCustomer, MasterSupplier,
  QATicket, QATicketStatus, QAInspectionRecord, QAInspectionStage, QAFieldType, QAGlobalConfig, QAFormConfig,
  NCRRecord, NCRStatus, NCRAction, NCRCategory, NCRGlobalConfig,
  CustomerComplaint, ComplaintStage, ComplaintGlobalConfig,
  QualityRecord, QualityRecordStatus, RecordTypeConfig, RecordTemplate, ModuleId, RecordGlobalConfig
} from './types';

// --- USER & SYSTEM MOCK DATA ---

export let LOCATIONS: Location[] = [
  { id: '1', name: 'Main Plant - Frankston' },
  { id: '2', name: 'Warehouse B' },
  { id: '3', name: 'Distribution Center' }
];
export const updateLocations = (data: Location[]) => { LOCATIONS = data; };

export let DEPARTMENTS: Department[] = [
  { id: '1', name: 'Quality Assurance' },
  { id: '2', name: 'Production' },
  { id: '3', name: 'Safety / EHS' },
  { id: '4', name: 'Management' },
  { id: '5', name: 'Warehouse' }
];
export const updateDepartments = (data: Department[]) => { DEPARTMENTS = data; };

export let ROLES: SystemRole[] = [
  { id: 'R1', name: 'Quality Manager', moduleAccess: [ModuleId.DASHBOARD, ModuleId.DOCUMENTS, ModuleId.TRAINING] },
  { id: 'R2', name: 'Production Supervisor', moduleAccess: [ModuleId.DASHBOARD, ModuleId.SAFETY, ModuleId.TRAINING] },
  { id: 'R3', name: 'Safety Officer', moduleAccess: [ModuleId.DASHBOARD, ModuleId.SAFETY, ModuleId.TRAINING, ModuleId.DOCUMENTS] },
  { id: 'R4', name: 'Operator', moduleAccess: [ModuleId.DASHBOARD, ModuleId.SAFETY, ModuleId.TRAINING] }
];
export const updateRoles = (data: SystemRole[]) => { ROLES = data; };

export let USERS: User[] = [
  { id: '100', name: 'Admin User', username: 'admin', role: UserRole.SUPER_ADMIN, status: UserStatus.ACTIVE, systemRoleId: 'R1', departmentId: '4', locationId: '1' },
  { id: '101', name: 'John Quality', username: 'jquality', role: UserRole.MANAGER, status: UserStatus.ACTIVE, systemRoleId: 'R1', departmentId: '1', locationId: '1' },
  { id: '102', name: 'Sarah Safety', username: 'ssafety', role: UserRole.MANAGER, status: UserStatus.ACTIVE, systemRoleId: 'R3', departmentId: '3', locationId: '1' },
  { id: '103', name: 'Mike Prod', username: 'mprod', role: UserRole.USER, status: UserStatus.ACTIVE, systemRoleId: 'R2', departmentId: '2', locationId: '1', managerId: '101' },
  { id: '104', name: 'Steve Operator', username: 'soperator', role: UserRole.USER, status: UserStatus.ACTIVE, systemRoleId: 'R4', departmentId: '2', locationId: '1', managerId: '103' },
  { id: '105', name: 'Jane Warehouse', username: 'jwarehouse', role: UserRole.USER, status: UserStatus.ACTIVE, systemRoleId: 'R4', departmentId: '5', locationId: '2', managerId: '103' }
];
export const updateUsers = (data: User[]) => { USERS = data; };

// --- SAFETY MOCK DATA ---

export let SAFETY_INCIDENTS: SafetyIncident[] = [
  {
    id: 'inc-001',
    reportNumber: 'INC-2024-001',
    reportedByUserId: '103',
    injuredUserId: '104',
    locationId: '1',
    incidentDate: '2024-05-15',
    incidentTime: '14:30',
    severity: SeverityLevel.SEV_4_MINOR,
    treatmentType: TreatmentType.FIRST_AID,
    wasTreatedInER: false,
    wasHospitalizedOvernight: false,
    isPrivacyCase: false,
    status: IncidentStatus.CLOSED,
    createdAt: '2024-05-15T15:00:00Z',
    updatedAt: '2024-05-16T09:00:00Z'
  },
  {
    id: 'inc-002',
    reportNumber: 'INC-2024-002',
    reportedByUserId: '102',
    injuredUserId: '105',
    locationId: '2',
    incidentDate: '2024-06-02',
    incidentTime: '08:15',
    severity: SeverityLevel.SEV_3_MODERATE,
    treatmentType: TreatmentType.MEDICAL_TREATMENT,
    wasTreatedInER: true,
    wasHospitalizedOvernight: false,
    isPrivacyCase: false,
    status: IncidentStatus.APPROVED,
    createdAt: '2024-06-02T10:00:00Z',
    updatedAt: '2024-06-03T11:00:00Z'
  }
];
export const updateSafetyIncidents = (data: SafetyIncident[]) => { SAFETY_INCIDENTS = data; };

export let NEAR_MISSES: NearMiss[] = [
  {
    id: 'nm-001',
    reportNumber: 'NM-2024-010',
    type: NearMissType.IFE,
    reportedByUserId: '104',
    eventPersonName: 'Team A',
    eventDate: '2024-06-10',
    locationId: '1',
    details: 'Spill on aisle 4 not marked.',
    status: IncidentStatus.SUBMITTED,
    createdAt: '2024-06-10T12:00:00Z',
    updatedAt: '2024-06-10T12:00:00Z'
  }
];
export const updateNearMisses = (data: NearMiss[]) => { NEAR_MISSES = data; };

export let SAFETY_OBSERVATIONS: SafetyObservation[] = [
  {
    id: 'obs-001',
    reportNumber: 'OBS-2024-012',
    reportedByUserId: '101',
    locationId: '2',
    specificLocation: 'Loading Dock B',
    details: 'Observed operator not wearing high-vis vest in traffic zone.',
    status: IncidentStatus.APPROVED,
    assignedActionUserId: '103',
    actionDueDate: '2024-06-25T00:00:00Z',
    createdAt: '2024-05-25T09:00:00Z',
    updatedAt: '2024-05-26T10:00:00Z'
  },
  {
    id: 'obs-002',
    reportNumber: 'OBS-2024-015',
    reportedByUserId: '102',
    locationId: '1',
    specificLocation: 'Line 4',
    details: 'Guard rail loose near conveyor belt.',
    status: IncidentStatus.SUBMITTED,
    createdAt: '2024-06-12T08:30:00Z',
    updatedAt: '2024-06-12T08:30:00Z'
  }
];
export const updateSafetyObservations = (data: SafetyObservation[]) => { SAFETY_OBSERVATIONS = data; };

export let SAFETY_CONFIG: SafetyGlobalConfig = {
  safetyApprovers: ['100', '101', '102'],
  safetyGuide: "Welcome to the Safety Module.\n\n1. Report Incidents: Use this form for any injury or medical event.\n2. Near Misses: Log events that could have caused harm but didn't.\n3. Observations: Note unsafe behaviors or conditions to improve safety culture.\n\nFor critical emergencies, call 911 immediately before logging in the system."
};
export const updateSafetyConfig = (data: SafetyGlobalConfig) => { SAFETY_CONFIG = data; };

// --- DOCUMENTS MOCK DATA ---

export let DOC_TYPES: DocumentTypeConfig[] = [
  { id: 'dt-1', name: 'Standard Operating Procedure', prefix: 'SOP' },
  { id: 'dt-2', name: 'Policy', prefix: 'POL' },
  { id: 'dt-3', name: 'Work Instruction', prefix: 'WI' },
  { id: 'dt-4', name: 'Form', prefix: 'FRM' }
];
export const updateDocTypes = (data: DocumentTypeConfig[]) => { DOC_TYPES = data; };

export let DOC_FOLDERS: DocumentFolder[] = [
  { id: 'root', name: 'General Docs', isSystem: true },
  { id: 'archive', name: 'Archive', isSystem: true, parentId: 'root' },
  { id: 'sop', name: 'Standard Operating Procedures', parentId: 'root' },
  { id: 'policies', name: 'Company Policies', parentId: 'root' }
];
export const updateDocFolders = (data: DocumentFolder[]) => { DOC_FOLDERS = data; };

export let DOC_CONFIG: DocumentGlobalConfig = {
  allowedCreators: ['100', '101'], // Admin, John Quality
  changeRequestApprovers: ['100', '101', '102']
};
export const updateDocConfig = (data: DocumentGlobalConfig) => { DOC_CONFIG = data; };

export let DOCUMENTS: Document[] = [
  {
    id: 'doc-1',
    docNumber: 'SOP-001',
    title: 'Document Control Procedure',
    type: 'SOP',
    version: 1.0,
    content: '1. PURPOSE\nTo define the process for controlling documents.\n\n2. SCOPE\nAll quality system documents.\n\n3. PROCEDURE\n...',
    isUploadedFile: false,
    folderId: 'sop',
    authorId: '101',
    approverIds: ['100', '102'],
    approvedByIds: ['100', '102'],
    status: DocStatus.APPROVED,
    isActive: true,
    trainingRequiredRoles: ['ALL'],
    trainingRequiredSites: ['ALL'],
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    referenceDocIds: ['doc-fr-1', 'doc-wi-1']
  },
  {
    id: 'doc-fr-1',
    docNumber: 'FRM-001',
    title: 'Document Revision Log',
    type: 'FRM',
    version: 1.0,
    content: 'Standard revision log form...',
    isUploadedFile: false,
    folderId: 'root',
    authorId: '100',
    approverIds: ['101'],
    approvedByIds: ['101'],
    status: DocStatus.APPROVED,
    isActive: true,
    trainingRequiredRoles: [],
    trainingRequiredSites: [],
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-10T09:00:00Z'
  },
  {
    id: 'doc-wi-1',
    docNumber: 'WI-005',
    title: 'Archiving Instructions',
    type: 'WI',
    version: 1.2,
    content: 'Detailed instructions on how to move physical boxes to storage...',
    isUploadedFile: false,
    folderId: 'sop',
    authorId: '101',
    approverIds: ['100'],
    approvedByIds: ['100'],
    status: DocStatus.APPROVED,
    isActive: true,
    trainingRequiredRoles: [],
    trainingRequiredSites: [],
    createdAt: '2024-02-10T09:00:00Z',
    updatedAt: '2024-02-15T09:00:00Z'
  },
  {
    id: 'doc-2',
    docNumber: 'POL-005',
    title: 'Quality Policy',
    type: 'POL',
    version: 2.0,
    content: 'Frankston Packaging is committed to quality...',
    isUploadedFile: false,
    folderId: 'policies',
    authorId: '100',
    approverIds: ['101'],
    approvedByIds: [],
    status: DocStatus.PENDING_APPROVAL,
    isActive: true,
    trainingRequiredRoles: ['ALL'],
    trainingRequiredSites: ['ALL'],
    createdAt: '2024-06-01T09:00:00Z',
    updatedAt: '2024-06-01T09:00:00Z'
  },
  // --- ARCHIVE DUMMY ---
  {
    id: 'doc-archive-1',
    docNumber: 'SOP-001',
    title: 'Document Control Procedure (v0.9)',
    type: 'SOP',
    version: 0.9,
    content: '1. PURPOSE\nDraft procedure for doc control.\n\n2. SCOPE\nInternal only.\n\n[ARCHIVED VERSION]',
    isUploadedFile: false,
    folderId: 'archive',
    authorId: '101',
    approverIds: [],
    approvedByIds: [],
    status: DocStatus.OBSOLETE,
    isActive: false,
    trainingRequiredRoles: [],
    trainingRequiredSites: [],
    createdAt: '2023-12-01T09:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z'
  }
];
export const updateDocuments = (data: Document[]) => { DOCUMENTS = data; };

export let CHANGE_REQUESTS: DocChangeRequest[] = [];
export const updateChangeRequests = (data: DocChangeRequest[]) => { CHANGE_REQUESTS = data; };

export let DOC_TEMPLATES: DocTemplate[] = [
  { id: 'tpl-1', name: 'Standard SOP', content: '1. PURPOSE\n\n2. SCOPE\n\n3. DEFINITIONS\n\n4. RESPONSIBILITIES\n\n5. PROCEDURE\n\n6. REFERENCES' }
];
export const updateDocTemplates = (data: DocTemplate[]) => { DOC_TEMPLATES = data; };

// --- TRAINING MOCK DATA ---

export let TRAINING_RECORDS: TrainingRecord[] = [
  {
    id: 'tr-1',
    userId: '103',
    type: 'DOCUMENT',
    referenceId: 'doc-1',
    version: 1.0,
    status: 'COMPLETED',
    assignedDate: '2024-02-01T00:00:00Z',
    completedDate: '2024-02-05T14:00:00Z',
    dueDate: '2024-03-01T00:00:00Z'
  },
  {
    id: 'tr-2',
    userId: '104',
    type: 'DOCUMENT',
    referenceId: 'doc-1',
    version: 1.0,
    status: 'PENDING',
    assignedDate: '2024-06-01T00:00:00Z',
    dueDate: '2024-07-01T00:00:00Z'
  }
];
export const updateTrainingRecords = (data: TrainingRecord[]) => { TRAINING_RECORDS = data; };

export let LEARNING_RESOURCES: LearningResource[] = [
  {
    id: 'lr-1',
    title: 'GMP Basics',
    description: 'Introduction to Good Manufacturing Practices.',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
    assignedRoleIds: ['R4', 'R2'],
    isSelfAssignable: true,
    durationMinutes: 15,
    createdAt: '2024-01-01T00:00:00Z'
  }
];
export const updateLearningResources = (data: LearningResource[]) => { LEARNING_RESOURCES = data; };

// --- MASTER DATA MOCK ---

export let MASTER_ITEMS: MasterItem[] = [
  { id: 'mi-1', itemNumber: 'ITEM-1001', description: 'Standard Widget Box', manufacturingSite: 'Main Plant', customerName: 'Acme Corp', status: 'ACTIVE' },
  { id: 'mi-2', itemNumber: 'ITEM-2005', description: 'Luxury Gift Box', manufacturingSite: 'Main Plant', customerName: 'GiftCo', status: 'ACTIVE' }
];
export const updateMasterItems = (data: MasterItem[]) => { MASTER_ITEMS = data; };

export let MASTER_CUSTOMERS: MasterCustomer[] = [
  { id: 'cust-1', name: 'Acme Corp', email: 'contact@acme.com', phone: '555-0101', status: 'ACTIVE' },
  { id: 'cust-2', name: 'GiftCo', email: 'procurement@giftco.com', phone: '555-0102', status: 'ACTIVE' }
];
export const updateMasterCustomers = (data: MasterCustomer[]) => { MASTER_CUSTOMERS = data; };

export let MASTER_SUPPLIERS: MasterSupplier[] = [
  { id: 'sup-1', name: 'Paper Mill Inc', email: 'sales@papermill.com', phone: '555-0201', status: 'ACTIVE' }
];
export const updateMasterSuppliers = (data: MasterSupplier[]) => { MASTER_SUPPLIERS = data; };

// --- QA INSPECTION MOCK ---

export let QA_TICKETS: QATicket[] = [
  {
    id: 'tkt-1',
    ticketNumber: 'JOB-5501',
    itemNumber: 'ITEM-1001',
    description: 'Run of 5000 Widget Boxes',
    customerName: 'Acme Corp',
    processType: 'CARTON',
    createdById: '103',
    createdAt: '2024-06-14T08:00:00Z',
    status: QATicketStatus.IN_PROGRESS,
    applicableFormIds: ['frm-1']
  }
];
export const updateQATickets = (data: QATicket[]) => { QA_TICKETS = data; };

export let QA_CONFIG: QAGlobalConfig = {
  forms: [
    {
      id: 'frm-1',
      name: 'Carton Glue Line Inspection',
      processType: 'CARTON',
      applicableStages: [QAInspectionStage.MAKE_READY, QAInspectionStage.IN_PROCESS, QAInspectionStage.FINAL],
      fields: [
        { id: 'f1', label: 'Glue Adhesion Test', type: QAFieldType.PASS_FAIL_NA, isMandatory: true, failOptions: ['FAIL'] },
        { id: 'f2', label: 'Barcode Scan', type: QAFieldType.PASS_FAIL_NA, isMandatory: true, failOptions: ['FAIL'] },
        { id: 'f3', label: 'Visual Appearance', type: QAFieldType.PASS_FAIL_NA, isMandatory: true, failOptions: ['FAIL'] }
      ]
    }
  ],
  inspectionGuide: 'Ensure all safety guards are in place before starting inspection.'
};
export const updateQAConfig = (data: QAGlobalConfig) => { QA_CONFIG = data; };

export let QA_INSPECTION_RECORDS: QAInspectionRecord[] = [
  {
    id: 'rec-qa-1',
    ticketId: 'tkt-1',
    formId: 'frm-1',
    inspectorId: '104',
    stage: QAInspectionStage.MAKE_READY,
    createdAt: '2024-06-14T08:30:00Z',
    values: { 'f1': 'PASS', 'f2': 'PASS', 'f3': 'PASS' },
    isNcrTriggered: false
  }
];
export const updateQAInspectionRecords = (data: QAInspectionRecord[]) => { QA_INSPECTION_RECORDS = data; };

// --- NCR MOCK ---

export let NCR_RECORDS: NCRRecord[] = [];
export const updateNcrRecords = (data: NCRRecord[]) => { NCR_RECORDS = data; };

export let NCR_CONFIG: NCRGlobalConfig = {
  ownerUserIds: ['101', '102'],
  rcaCompleterUserIds: ['103', '104'],
  categories: [
    { id: 'cat-1', name: 'Material Defect', subCategories: ['Paper Quality', 'Ink Issue'] },
    { id: 'cat-2', name: 'Process Error', subCategories: ['Wrong Setup', 'Operator Error'] }
  ]
};
export const updateNCRConfig = (data: NCRGlobalConfig) => { NCR_CONFIG = data; };

// --- COMPLAINTS MOCK ---

export let CUSTOMER_COMPLAINTS: CustomerComplaint[] = [];
export const updateCustomerComplaints = (data: CustomerComplaint[]) => { CUSTOMER_COMPLAINTS = data; };

export let COMPLAINT_CONFIG: ComplaintGlobalConfig = {
  returnAddresses: [
    { id: 'addr-1', label: 'Main Warehouse', address: '123 Packaging Way, Frankston, TX 75763' }
  ],
  categories: [
    { id: 'ccat-1', name: 'Product Quality', subCategories: ['Damaged', 'Wrong Print'] },
    { id: 'ccat-2', name: 'Logistics', subCategories: ['Late Delivery', 'Short Shipment'] }
  ]
};
export const updateComplaintConfig = (data: ComplaintGlobalConfig) => { COMPLAINT_CONFIG = data; };

// --- RECORDS MOCK ---

export let RECORD_TYPES: RecordTypeConfig[] = [
  { id: 'rt-1', name: 'Cleaning Log', prefix: 'CLN' },
  { id: 'rt-2', name: 'Maintenance Log', prefix: 'MNT' }
];
export const updateRecordTypes = (data: RecordTypeConfig[]) => { RECORD_TYPES = data; };

export let RECORD_CONFIG: RecordGlobalConfig = {
  allowedCreators: ['100', '104'], // Admin, Steve Operator
  templateManagers: ['100', '101'] // Admin, John Quality
};
export const updateRecordConfig = (data: RecordGlobalConfig) => { RECORD_CONFIG = data; };

export let QUALITY_RECORDS: QualityRecord[] = [
  {
    id: 'qrec-1',
    recordNumber: 'CLN-001',
    title: 'Daily Line 1 Cleaning',
    type: 'CLN',
    content: 'Cleaned rollers and surrounding area.',
    isUploadedFile: false,
    creatorId: '104',
    locationId: '1',
    departmentId: '2',
    status: QualityRecordStatus.ACTIVE,
    retentionYears: 1,
    createdAt: '2024-06-14T17:00:00Z',
    updatedAt: '2024-06-14T17:00:00Z'
  }
];
export const updateQualityRecords = (data: QualityRecord[]) => { QUALITY_RECORDS = data; };

export let RECORD_TEMPLATES: RecordTemplate[] = [];
export const updateRecordTemplates = (data: RecordTemplate[]) => { RECORD_TEMPLATES = data; };
