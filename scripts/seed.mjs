import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civilworks';

const projectSchema = new mongoose.Schema({
  name: String,
  code: { type: String, unique: true },
  location: String,
  status: String,
  siteContact: String
}, { timestamps: true });

const workerSchema = new mongoose.Schema({
  projectId: mongoose.Schema.Types.ObjectId,
  workerIdCode: String,
  name: String,
  category: String,
  mobile: String,
  dailyRate: Number,
  overtimeRate: Number,
  status: String
}, { timestamps: true });

const Project = mongoose.models.SeedProject || mongoose.model('SeedProject', projectSchema, 'projects');
const Worker = mongoose.models.SeedWorker || mongoose.model('SeedWorker', workerSchema, 'workers');

await mongoose.connect(uri);

let project = await Project.findOne({ code: 'GH-001' });
if (!project) {
  project = await Project.create({
    name: 'Green Heights Apartment',
    code: 'GH-001',
    location: 'Sector 62, Site B',
    status: 'ACTIVE',
    siteContact: 'Rajesh Sharma (+91 9876543210)'
  });
}

const count = await Worker.countDocuments({ projectId: project._id });
if (count === 0) {
  await Worker.insertMany([
    { projectId: project._id, workerIdCode: 'W-001', name: 'Ramesh Kumar', category: 'Mason', mobile: '9876543201', dailyRate: 900, overtimeRate: 120, status: 'ACTIVE' },
    { projectId: project._id, workerIdCode: 'W-002', name: 'Suresh Yadav', category: 'Helper', mobile: '9876543202', dailyRate: 650, overtimeRate: 90, status: 'ACTIVE' },
    { projectId: project._id, workerIdCode: 'W-003', name: 'Mahesh Singh', category: 'Carpenter', mobile: '9876543203', dailyRate: 1100, overtimeRate: 150, status: 'ACTIVE' },
    { projectId: project._id, workerIdCode: 'W-004', name: 'Raj Kumar', category: 'Helper', mobile: '9876543204', dailyRate: 650, overtimeRate: 90, status: 'ACTIVE' },
    { projectId: project._id, workerIdCode: 'W-005', name: 'Sanjay Verma', category: 'Mason', mobile: '9876543205', dailyRate: 900, overtimeRate: 120, status: 'ACTIVE' }
  ]);
}

console.log(JSON.stringify({
  ok: true,
  projectId: project._id.toString(),
  projectName: project.name,
  workerCount: await Worker.countDocuments({ projectId: project._id })
}, null, 2));

await mongoose.disconnect();
