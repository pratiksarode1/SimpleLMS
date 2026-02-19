
import { LucideIcon } from 'lucide-react';

// --- APP CORE ---

export enum AppView {
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD'
}

export enum ModuleId {
  DASHBOARD = 'DASHBOARD',
  SYSTEM_CONFIG = 'SYSTEM_CONFIG',
  SAFETY = 'SAFETY',
  TRAINING = 'TRAINING',
  DOCUMENTS = 'DOCUMENTS',
  RECORDS = 'RECORDS',
  ORG_CHART = 'ORG_CHART',
  BACKUP = 'BACKUP',
  KPIS = 'KPIS',
  LOGOUT = 'LOGOUT'
}

export interface ModuleConfig {
  id: ModuleId;
  label: string;
  icon: LucideIcon;
  description: string;
  color: string;
}

// --- USER & SYSTEM ---

export enum UserRole {
  SUPER_ADMIN = 'Super Admin',
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  USER = 'User'
}

export enum UserStatus {
  PENDING = 'Pending',
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  OBSOLETE = 'Obsolete'
}

export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  role: UserRole;
  status: UserStatus;
  systemRoleId?: string;
  departmentId?: string;
  locationId?: string;
  managerId?: string;
  joinedDate?: string;
}

export interface SystemRole {
  id: string;
  name: string;
  description?: string;
  moduleAccess?: ModuleId[];
}

export interface Department {
  id: string;
  name: string;
}

export interface Location {
  id: string;
  name: string;
  address?: string;
}

// --- SAFETY MODULE ---

export enum IncidentStatus {
  SUBMITTED = 'SUBMITTED',
  ACTION_PENDING_REVIEW = 'ACTION_PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CLOSED = 'CLOSED'
}

export enum SeverityLevel {
  SEV_1_FATALITY = 1,
  SEV_2_SEVERE = 2,
  SEV_3_MODERATE = 3,
  SEV_4_MINOR = 4,
  SEV_5_INTERNAL = 5
}

export enum TreatmentType {
  FIRST_AID = 'FIRST_AID',
  MEDICAL_TREATMENT = 'MEDICAL_TREATMENT',
  ER = 'ER',
  HOSPITALIZATION = 'HOSPITALIZATION'
}

export interface SafetyIncident {
  id: string;
  reportNumber: string;
  injuredUserId?: string;
  reportedByUserId: string;
  locationId: string;
  incidentDate: string;
  incidentTime: string;
  severity: SeverityLevel;
  treatmentType: TreatmentType;
  wasTreatedInER: boolean;
  wasHospitalizedOvernight: boolean;
  isPrivacyCase: boolean;
  physicianName?: string;
  facilityName?: string;
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
}

export enum NearMissType {
  IFE = 'IFE', // Injury Free Event (Unsafe Condition)
  IFO = 'IFO'  // Injury Free Observation (Unsafe Act)
}

export interface NearMiss {
  id: string;
  reportNumber: string;
  type: NearMissType;
  reportedByUserId: string;
  eventPersonName?: string;
  eventDate: string;
  locationId: string;
  details: string;
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SafetyObservation {
  id: string;
  reportNumber: string;
  reportedByUserId: string;
  locationId: string;
  specificLocation?: string; // e.g., "Line 4"
  details: string;
  status: IncidentStatus;
  
  // Action tracking
  assignedActionUserId?: string;
  actionDueDate?: string;
  actionCompletedAt?: string;
  
  createdAt: string; // Used as Date Reported
  updatedAt: string;
}

export interface SafetyGlobalConfig {
  safetyApprovers: string[]; // User IDs who can approve incidents, near misses, and observations
  safetyGuide?: string; // Guide text for "How to use"
}

// --- DOCUMENT MODULE ---

export enum DocStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REVISION_REQUESTED = 'REVISION_REQUESTED',
  OBSOLETE = 'OBSOLETE'
}

export interface DocumentTypeConfig {
  id: string;
  name: string;
  prefix: string;
}

export interface DocumentFolder {
  id: string;
  name: string;
  parentId?: string | null; // For nesting, though we'll stick to 1 level for simplicity initially
  isSystem?: boolean; // If true, cannot be deleted (e.g. Archive, Redline)
}

export interface DocumentGlobalConfig {
  allowedCreators: string[]; // User IDs who can create folders and new documents
  changeRequestApprovers: string[]; // User IDs who can approve CRs
}

export interface Document {
  id: string;
  docNumber: string;
  title: string;
  type: string; // Prefix e.g. SOP, POL
  version: number;
  content: string;
  isUploadedFile: boolean;
  folderId?: string; // Which folder this lives in
  isRedline?: boolean; // If true, text should be displayed in red (draft mode)
  authorId: string;
  approverIds: string[];
  approvedByIds: string[];
  status: DocStatus;
  isActive: boolean;
  trainingRequiredRoles: string[]; // Role IDs or 'ALL'
  trainingRequiredSites: string[]; // Location IDs or 'ALL'
  createdAt: string;
  updatedAt: string;
  referenceDocIds?: string[]; // IDs of linked documents
}

export interface DocChangeRequest {
  id: string;
  documentId: string;
  requestedByUserId: string;
  reason: string;
  assignedToUserId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface DocTemplate {
  id: string;
  name: string;
  content: string;
  type?: 'TEXT' | 'FILE';
  fileName?: string;
}

// --- TRAINING MODULE ---

export interface TrainingRecord {
  id: string;
  userId: string;
  type: 'DOCUMENT' | 'VIDEO';
  referenceId: string; // Document ID or LearningResource ID
  version?: number; // Only for Documents
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
  assignedDate: string;
  completedDate?: string;
  dueDate: string;
}

export interface LearningResource {
  id: string;
  title: string;
  description: string;
  url: string; // YouTube or File URL
  thumbnailUrl?: string;
  assignedRoleIds: string[];
  isSelfAssignable: boolean;
  durationMinutes: number;
  createdAt: string;
}

// --- MASTER DATA ---

export interface MasterItem {
  id: string;
  itemNumber: string;
  description: string;
  manufacturingSite: string;
  customerName: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface MasterCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface MasterSupplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
}

// --- QA INSPECTION ---

export enum QATicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  LOCKED_NCR = 'LOCKED_NCR',
  COMPLETED = 'COMPLETED'
}

export interface QATicket {
  id: string;
  ticketNumber: string;
  itemNumber: string;
  description: string;
  customerName: string;
  processType: 'FLEXO' | 'CARTON';
  createdById: string;
  createdAt: string;
  status: QATicketStatus;
  isNewItemEntry?: boolean;
  applicableFormIds?: string[];
}

export enum QAInspectionStage {
  MAKE_READY = 'MAKE_READY',
  IN_PROCESS = 'IN_PROCESS',
  FINAL = 'FINAL'
}

export enum QAFieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  PASS_FAIL_NA = 'PASS_FAIL_NA',
  DROPDOWN = 'DROPDOWN',
  BUTTON_GROUP = 'BUTTON_GROUP',
  TEXTAREA = 'TEXTAREA'
}

export interface QAFieldConfig {
  id: string;
  label: string;
  type: QAFieldType;
  isMandatory: boolean;
  options?: string[]; // For Dropdown/Button Group
  failOptions?: string[]; // Options that trigger NCR
  helpText?: string;
}

export interface QAFormConfig {
  id: string;
  name: string;
  processType: 'FLEXO' | 'CARTON';
  fields: QAFieldConfig[];
  applicableStages: QAInspectionStage[];
}

export interface QAGlobalConfig {
  companyLogoUrl?: string;
  forms: QAFormConfig[];
  inspectionGuide?: string;
}

export interface QAInspectionRecord {
  id: string;
  ticketId: string;
  formId: string;
  inspectorId: string;
  stage: QAInspectionStage;
  createdAt: string;
  values: Record<string, any>; // Keyed by fieldId
  isNcrTriggered: boolean;
}

// --- NCR (NON-CONFORMANCE) ---

export enum NCRStatus {
  OPEN = 'OPEN',
  PENDING_RCA = 'PENDING_RCA',
  PENDING_REVIEW = 'PENDING_REVIEW',
  CLOSED = 'CLOSED'
}

export enum NCRAction {
  RELEASE = 'RELEASE',
  DISCARD = 'DISCARD',
  REWORK = 'REWORK'
}

export interface NCRRecord {
  id: string;
  ticketId?: string;
  inspectionType: string; // e.g. "Line Clearance"
  inspectionId?: string;
  inspectorId: string;
  detectedAt: string;
  status: NCRStatus;
  
  // Disposition
  dispositionAction?: NCRAction;
  justification?: string;
  defectiveQuantity?: number;
  pricePerThousand?: number;
  ncrOwnerId?: string; // Assigned User ID
  category?: string;
  subCategory?: string;
  dispositionedBy?: string;
  dispositionedAt?: string;

  // RCA
  rootCause?: string;
  correctiveAction?: string;
  assignedToUserId?: string; // User assigned to complete RCA
  rcaDueDate?: string;
  submittedForReviewAt?: string;
  
  // Closure
  resolvedByUserId?: string;
  closedAt?: string;
}

export interface NCRCategory {
  id: string;
  name: string;
  subCategories: string[];
}

export interface NCRGlobalConfig {
  ownerUserIds: string[]; // Users allowed to own NCRs
  rcaCompleterUserIds: string[]; // Users allowed to be assigned RCA
  categories: NCRCategory[];
}

// --- CUSTOMER COMPLAINTS ---

export enum ComplaintStage {
  DETAILS = 'DETAILS',
  CONTAINMENT = 'CONTAINMENT',
  RCA = 'RCA',
  CLOSED = 'CLOSED'
}

export enum ContainmentAction {
  RETURN_FOR_CREDIT = 'RETURN_FOR_CREDIT',
  RETURN_FOR_REPLACEMENT = 'RETURN_FOR_REPLACEMENT',
  SORT_AT_CUSTOMER = 'SORT_AT_CUSTOMER',
  REWORK_AT_CUSTOMER = 'REWORK_AT_CUSTOMER',
  DISCARD_AT_CUSTOMER = 'DISCARD_AT_CUSTOMER',
  NA = 'NA'
}

export interface ReturnAddress {
  id: string;
  label: string;
  address: string;
}

export interface ComplaintCategory {
  id: string;
  name: string;
  subCategories: string[];
}

export interface ComplaintGlobalConfig {
  companyLogoUrl?: string;
  returnAddresses: ReturnAddress[];
  categories: ComplaintCategory[];
}

export interface CustomerComplaint {
  id: string;
  ticketId?: string; // Linked Job Ticket
  customerId: string; // Customer Name
  loggedByUserId: string;
  createdAt: string;
  stage: ComplaintStage;
  revision: number;

  // Details
  ownerId?: string; // Assigned owner
  invoiceNumber?: string;
  category?: string;
  subCategory?: string;
  issueDescription?: string;
  defectiveQuantity?: number;
  pricePerUnit?: number;
  totalCost?: number;

  // Containment
  containmentAction?: ContainmentAction;
  selectedReturnAddressId?: string;
  isMaterialReturned?: boolean;
  isReworkPossible?: boolean;
  reworkTicketNumber?: string;
  isMaterialDiscarded?: boolean;
  isEvidenceSubmitted?: boolean;

  // RCA (Similar to NCR)
  rootCause?: string;
  correctiveAction?: string;
  assignedToUserId?: string;
  dueDate?: string;
  
  // Closure
  closedAt?: string;
}

// --- QUALITY RECORDS ---

export enum QualityRecordStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED'
}

export interface RecordTypeConfig {
  id: string;
  name: string;
  prefix: string;
}

export interface RecordTemplate {
  id: string;
  name: string;
  content: string;
}

export interface RecordGlobalConfig {
  allowedCreators: string[]; // User IDs who can log new records
  templateManagers: string[]; // User IDs who can manage templates
}

export interface QualityRecord {
  id: string;
  recordNumber: string;
  title: string;
  type: string; // Type Prefix
  content: string;
  isUploadedFile: boolean;
  creatorId: string;
  locationId: string;
  departmentId: string;
  status: QualityRecordStatus;
  retentionYears: number;
  createdAt: string;
  updatedAt: string;
  referenceDocIds?: string[]; // IDs of linked documents
  approverIds?: string[]; // Optional approvers for records
}
