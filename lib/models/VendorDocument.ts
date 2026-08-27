import mongoose, { Schema } from 'mongoose';

export type DocumentType = 'BILL' | 'QUOTATION' | 'AGREEMENT' | 'RECEIPT' | 'OTHER';

export interface IVendorDocument {
  _id?: string;
  vendorId: string | mongoose.Types.ObjectId;
  projectId?: string | mongoose.Types.ObjectId;
  documentName: string;
  documentType: DocumentType;
  fileUrl: string;
  uploadedBy?: string;
  remarks?: string;
  createdAt?: Date;
}

const VendorDocumentSchema = new Schema(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    documentName: { type: String, required: true, trim: true },
    documentType: {
      type: String,
      enum: ['BILL', 'QUOTATION', 'AGREEMENT', 'RECEIPT', 'OTHER'],
      default: 'OTHER'
    },
    fileUrl: { type: String, required: true, trim: true },
    uploadedBy: { type: String, default: 'Site Supervisor', trim: true },
    remarks: { type: String, trim: true }
  },
  { timestamps: true }
);

VendorDocumentSchema.index({ vendorId: 1, documentType: 1 });

export const VendorDocument =
  mongoose.models.VendorDocument || mongoose.model('VendorDocument', VendorDocumentSchema);
