import { connectMongoDB } from '../mongodb';
import { VendorDocument } from '../models/VendorDocument';
import { logAuditAction } from './auditService';
import mongoose from 'mongoose';

export interface DocumentFilter {
  projectId?: string;
  vendorId?: string;
  type?: string;
  search?: string;
}

export async function getDocumentsList(filter: DocumentFilter) {
  await connectMongoDB();

  const query: any = {};
  if (filter.projectId) query.projectId = new (mongoose.Types.ObjectId as any)(filter.projectId);
  if (filter.vendorId) query.vendorId = new (mongoose.Types.ObjectId as any)(filter.vendorId);
  if (filter.type && filter.type !== 'ALL') query.documentType = filter.type;
  if (filter.search) {
    query.$or = [
      { documentName: new RegExp(filter.search, 'i') },
      { remarks: new RegExp(filter.search, 'i') },
      { uploadedBy: new RegExp(filter.search, 'i') }
    ];
  }

  const docs = await (VendorDocument as any).find(query).sort({ createdAt: -1 }).lean();
  return docs.map((d: any) => ({
    _id: d._id.toString(),
    vendorId: d.vendorId ? d.vendorId.toString() : undefined,
    projectId: d.projectId ? d.projectId.toString() : undefined,
    documentName: d.documentName,
    documentType: d.documentType,
    fileUrl: d.fileUrl,
    uploadedBy: d.uploadedBy,
    remarks: d.remarks,
    createdAt: d.createdAt
  }));
}

export async function addDocumentRecord(input: {
  documentName: string;
  documentType: string;
  fileUrl: string;
  projectId?: string;
  vendorId?: string;
  remarks?: string;
  user?: string;
}) {
  await connectMongoDB();

  if (!input.documentName || !input.fileUrl) {
    throw new Error('documentName and fileUrl are required.');
  }

  // Use a default system vendor ID if no vendor specified for general project documents
  const dummyVendorId = input.vendorId || new (mongoose.Types.ObjectId as any)();

  const doc = await (VendorDocument as any).create({
    vendorId: dummyVendorId,
    projectId: input.projectId ? new (mongoose.Types.ObjectId as any)(input.projectId) : undefined,
    documentName: input.documentName.trim(),
    documentType: input.documentType || 'OTHER',
    fileUrl: input.fileUrl.trim(),
    uploadedBy: input.user || 'Site Supervisor',
    remarks: input.remarks?.trim()
  });

  await logAuditAction({
    user: input.user || 'Site Supervisor',
    action: 'DOCUMENT_UPLOADED',
    entity: 'VendorDocument',
    entityId: doc._id.toString(),
    metadata: { documentName: input.documentName, documentType: input.documentType }
  });

  return doc.toObject ? doc.toObject() : doc;
}

export async function deleteDocumentRecord(id: string, user?: string) {
  await connectMongoDB();
  const doc = await (VendorDocument as any).findByIdAndDelete(id);
  if (doc) {
    await logAuditAction({
      user: user || 'Site Supervisor',
      action: 'DOCUMENT_DELETED',
      entity: 'VendorDocument',
      entityId: id,
      metadata: { documentName: doc.documentName }
    });
  }
  return { success: true };
}
