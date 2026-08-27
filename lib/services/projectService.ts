import { connectMongoDB } from '../mongodb';
import { Project, IProject } from '../models/Project';
import { logAuditAction } from './auditService';

export async function getProjects(status?: string) {
  await connectMongoDB();
  const filter: any = {};
  if (status) {
    filter.status = status;
  }
  const projects = await Project.find(filter).sort({ createdAt: -1 }).exec();
  return JSON.parse(JSON.stringify(projects));
}

export async function getProjectById(id: string) {
  await connectMongoDB();
  const project = await (Project as any).findById(id).exec();
  return project ? JSON.parse(JSON.stringify(project)) : null;
}

export async function createProject(data: Partial<IProject>, user?: string) {
  await connectMongoDB();
  if (!data.name || !data.code) {
    throw new Error('Project name and code are required.');
  }

  const query: any = { code: data.code.trim().toUpperCase() };
  const existing = await Project.findOne(query).exec();
  if (existing) {
    throw new Error(`Project with code ${data.code} already exists.`);
  }

  const project = await Project.create({
    name: data.name.trim(),
    code: data.code.trim().toUpperCase(),
    location: data.location?.trim(),
    status: data.status || 'ACTIVE',
    startDate: data.startDate ? new Date(data.startDate) : new Date(),
    expectedEndDate: data.expectedEndDate ? new Date(data.expectedEndDate) : undefined,
    siteContact: data.siteContact?.trim(),
    managerName: data.managerName?.trim(),
    notes: data.notes?.trim()
  });

  await logAuditAction({
    user,
    action: 'PROJECT_CREATED',
    entity: 'Project',
    entityId: project._id.toString(),
    metadata: { name: project.name, code: project.code }
  });

  return JSON.parse(JSON.stringify(project));
}

export async function updateProject(id: string, data: Partial<IProject>, user?: string) {
  await connectMongoDB();
  const project = await (Project as any).findById(id).exec();
  if (!project) {
    throw new Error('Project not found.');
  }

  if (data.name) project.name = data.name.trim();
  if (data.location !== undefined) project.location = data.location.trim();
  if (data.status) project.status = data.status;
  if (data.startDate) project.startDate = new Date(data.startDate);
  if (data.expectedEndDate !== undefined) {
    project.expectedEndDate = data.expectedEndDate ? new Date(data.expectedEndDate) : undefined;
  }
  if (data.siteContact !== undefined) project.siteContact = data.siteContact.trim();
  if (data.managerName !== undefined) project.managerName = data.managerName.trim();
  if (data.notes !== undefined) project.notes = data.notes.trim();

  await project.save();

  await logAuditAction({
    user,
    action: 'PROJECT_UPDATED',
    entity: 'Project',
    entityId: project._id.toString(),
    metadata: { updates: data }
  });

  return JSON.parse(JSON.stringify(project));
}
