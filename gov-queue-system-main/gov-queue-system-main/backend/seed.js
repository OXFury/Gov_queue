const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectDB = require('./config/db');
const User = require('./models/User');
const ServiceType = require('./models/ServiceType');
const Counter = require('./models/Counter');
const Token = require('./models/Token');

async function seedData() {
  console.log('[Seed] Starting database seeding process...');
  await connectDB();

  // Clear existing collections
  await User.deleteMany({});
  await ServiceType.deleteMany({});
  await Counter.deleteMany({});
  await Token.deleteMany({});

  console.log('[Seed] Cleared existing data.');

  // 1. Create Default Users
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const staffPassword = await bcrypt.hash('staff123', salt);
  const citizenPassword = await bcrypt.hash('citizen123', salt);

  const admin = await User.create({
    name: 'Regional Officer Admin',
    email: 'admin@gov.in',
    password: adminPassword,
    role: 'admin',
    phone: '+91 9876543210'
  });

  const staff1 = await User.create({
    name: 'Officer Rajesh Kumar (Counter 1)',
    email: 'staff1@gov.in',
    password: staffPassword,
    role: 'staff',
    phone: '+91 9876543211'
  });

  const staff2 = await User.create({
    name: 'Officer Sunita Sharma (Counter 2)',
    email: 'staff2@gov.in',
    password: staffPassword,
    role: 'staff',
    phone: '+91 9876543212'
  });

  const citizen = await User.create({
    name: 'Amit Verma',
    email: 'citizen@gov.in',
    password: citizenPassword,
    role: 'citizen',
    phone: '+91 9876543213'
  });

  console.log('[Seed] Created default users.');

  // 2. Create Service Types
  const passportService = await ServiceType.create({
    code: 'PAS',
    name: 'Passport Services & Renewal',
    description: 'Fresh passport application, reissue, renewal, and document verification',
    avgDurationMinutes: 10,
    priorityRatio: 2,
    isActive: true
  });

  const licenseService = await ServiceType.create({
    code: 'LIC',
    name: 'Driving License & RTO Counters',
    description: 'Learner license, permanent DL issuance, vehicle RC registration',
    avgDurationMinutes: 8,
    priorityRatio: 2,
    isActive: true
  });

  const taxService = await ServiceType.create({
    code: 'TAX',
    name: 'Property Tax & Municipal Utility',
    description: 'Property tax filing, water tax, trade license, municipal bill clearance',
    avgDurationMinutes: 6,
    priorityRatio: 3,
    isActive: true
  });

  const docService = await ServiceType.create({
    code: 'REG',
    name: 'Aadhaar & Citizen ID Verification',
    description: 'Biometric update, address change, birth/death certificate registration',
    avgDurationMinutes: 7,
    priorityRatio: 2,
    isActive: true
  });

  console.log('[Seed] Created Service Types.');

  // 3. Create Counters
  const counter1 = await Counter.create({
    counterNumber: 1,
    name: 'Counter 1 - Passport & RTO Desk',
    supportedServices: [passportService._id, licenseService._id],
    assignedStaff: staff1._id,
    status: 'active',
    tokensServedToday: 14
  });

  const counter2 = await Counter.create({
    counterNumber: 2,
    name: 'Counter 2 - Express Passport Desk',
    supportedServices: [passportService._id],
    assignedStaff: staff2._id,
    status: 'active',
    tokensServedToday: 18
  });

  const counter3 = await Counter.create({
    counterNumber: 3,
    name: 'Counter 3 - RTO & License Desk',
    supportedServices: [licenseService._id],
    assignedStaff: null,
    status: 'active',
    tokensServedToday: 12
  });

  const counter4 = await Counter.create({
    counterNumber: 4,
    name: 'Counter 4 - Municipal & Property Tax Desk',
    supportedServices: [taxService._id],
    assignedStaff: null,
    status: 'active',
    tokensServedToday: 9
  });

  const counter5 = await Counter.create({
    counterNumber: 5,
    name: 'Counter 5 - ID & Document Verification',
    supportedServices: [docService._id],
    assignedStaff: null,
    status: 'active',
    tokensServedToday: 15
  });

  // Link staff to counters
  staff1.assignedCounter = counter1._id;
  await staff1.save();
  staff2.assignedCounter = counter2._id;
  await staff2.save();

  console.log('[Seed] Created Counters.');

  // 4. Create Mock Tokens (Historical completed tokens, serving tokens, waiting tokens)
  const now = new Date();

  // Helper for past timestamps
  const minutesAgo = (m) => new Date(now.getTime() - m * 60 * 1000);

  // Completed historical tokens for prediction SMA calculation
  const historicalCompleted = [
    { num: 'PAS-101', service: passportService, dur: 11, wait: 14, prio: 'normal' },
    { num: 'PAS-102', service: passportService, dur: 9, wait: 10, prio: 'senior' },
    { num: 'PAS-103', service: passportService, dur: 12, wait: 18, prio: 'normal' },
    { num: 'PAS-104', service: passportService, dur: 8, wait: 6, prio: 'disabled' },
    { num: 'LIC-101', service: licenseService, dur: 7, wait: 9, prio: 'normal' },
    { num: 'LIC-102', service: licenseService, dur: 6, wait: 8, prio: 'urgent' },
    { num: 'LIC-103', service: licenseService, dur: 8, wait: 12, prio: 'normal' },
    { num: 'TAX-101', service: taxService, dur: 5, wait: 4, prio: 'senior' },
    { num: 'TAX-102', service: taxService, dur: 6, wait: 7, prio: 'normal' },
    { num: 'REG-101', service: docService, dur: 7, wait: 8, prio: 'normal' },
    { num: 'REG-102', service: docService, dur: 6, wait: 5, prio: 'senior' },
  ];

  for (let i = 0; i < historicalCompleted.length; i++) {
    const item = historicalCompleted[i];
    await Token.create({
      tokenNumber: item.num,
      serviceType: item.service._id,
      citizenName: `Citizen ${i + 1}`,
      priorityType: item.prio,
      priorityScore: item.prio === 'normal' ? 1 : 3,
      status: 'completed',
      assignedCounter: counter1._id,
      estimatedWaitMinutes: item.wait,
      actualWaitMinutes: item.wait,
      serviceDurationMinutes: item.dur,
      createdAt: minutesAgo(60 + i * 10),
      calledAt: minutesAgo(40 + i * 10),
      completedAt: minutesAgo(30 + i * 10)
    });
  }

  // Currently Serving Tokens
  const tokenServing1 = await Token.create({
    tokenNumber: 'PAS-105',
    serviceType: passportService._id,
    citizenName: 'Ramesh Patel',
    citizenPhone: '+91 9123456789',
    priorityType: 'normal',
    priorityScore: 1,
    status: 'serving',
    assignedCounter: counter1._id,
    servedBy: staff1._id,
    estimatedWaitMinutes: 12,
    actualWaitMinutes: 10,
    createdAt: minutesAgo(20),
    calledAt: minutesAgo(5)
  });

  counter1.currentToken = tokenServing1._id;
  await counter1.save();

  const tokenServing2 = await Token.create({
    tokenNumber: 'LIC-104',
    serviceType: licenseService._id,
    citizenName: 'Priya Sundaram',
    citizenPhone: '+91 9234567890',
    priorityType: 'senior',
    priorityScore: 3,
    status: 'serving',
    assignedCounter: counter2._id,
    servedBy: staff2._id,
    estimatedWaitMinutes: 8,
    actualWaitMinutes: 6,
    createdAt: minutesAgo(18),
    calledAt: minutesAgo(4)
  });

  counter2.currentToken = tokenServing2._id;
  await counter2.save();

  // Active Waiting Tokens (Priority & Normal mix)
  const waitingTokens = [
    { num: 'PAS-106', service: passportService, name: 'Sita Devi (Senior Citizen)', prio: 'senior', ageMins: 15 },
    { num: 'PAS-107', service: passportService, name: 'Vikram Singh', prio: 'normal', ageMins: 14 },
    { num: 'PAS-108', service: passportService, name: 'Deepak Chopra', prio: 'normal', ageMins: 10 },
    { num: 'LIC-105', service: licenseService, name: 'Kavita Menon (Disabled Access)', prio: 'disabled', ageMins: 12 },
    { num: 'LIC-106', service: licenseService, name: 'Anil Mehta', prio: 'normal', ageMins: 9 },
    { num: 'TAX-103', service: taxService, name: 'Suresh Raina', prio: 'normal', ageMins: 8 },
    { num: 'TAX-104', service: taxService, name: 'Kamla Prasad (Senior Citizen)', prio: 'senior', ageMins: 5 },
    { num: 'REG-103', service: docService, name: 'Meena Kumari (Urgent Document)', prio: 'urgent', ageMins: 6 },
    { num: 'REG-104', service: docService, name: 'Rahul Bose', prio: 'normal', ageMins: 4 },
  ];

  for (const item of waitingTokens) {
    const prioScore = item.prio === 'normal' ? 1 : 3;
    await Token.create({
      tokenNumber: item.num,
      serviceType: item.service._id,
      citizenName: item.name,
      citizenPhone: '+91 9898989898',
      priorityType: item.prio,
      priorityScore: prioScore,
      status: 'waiting',
      estimatedWaitMinutes: item.prio === 'normal' ? 14 : 6,
      createdAt: minutesAgo(item.ageMins)
    });
  }

  console.log('[Seed] Seeding completed successfully!');
  console.log('--------------------------------------------------');
  console.log('DEMO ACCOUNTS FOR LOGGING IN:');
  console.log('Admin Account:   admin@gov.in  / admin123');
  console.log('Staff Account 1: staff1@gov.in / staff123 (Counter 1)');
  console.log('Staff Account 2: staff2@gov.in / staff123 (Counter 2)');
  console.log('Citizen Account: citizen@gov.in/ citizen123');
  console.log('--------------------------------------------------');

  if (require.main === module) {
    process.exit(0);
  }
}

if (require.main === module) {
  seedData();
}

module.exports = seedData;
