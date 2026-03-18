import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const password = await argon2.hash('Password123!');

  // Super Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@surgerycare.org' },
    update: {},
    create: {
      email: 'admin@surgerycare.org',
      passwordHash: password,
      firstName: 'Super',
      lastName: 'Admin',
      accountStatus: 'ACTIVE',
      userRoles: { create: { role: 'SUPER_ADMIN' } },
      adminProfile: { create: { department: 'Administration' } },
    },
  });
  console.log(`Created super admin: ${admin.email}`);

  // Moderator
  const moderator = await prisma.user.upsert({
    where: { email: 'moderator@surgerycare.org' },
    update: {},
    create: {
      email: 'moderator@surgerycare.org',
      passwordHash: password,
      firstName: 'Mod',
      lastName: 'Erator',
      accountStatus: 'ACTIVE',
      userRoles: { create: { role: 'MODERATOR' } },
    },
  });
  console.log(`Created moderator: ${moderator.email}`);

  // Finance Manager
  const finance = await prisma.user.upsert({
    where: { email: 'finance@surgerycare.org' },
    update: {},
    create: {
      email: 'finance@surgerycare.org',
      passwordHash: password,
      firstName: 'Finance',
      lastName: 'Manager',
      accountStatus: 'ACTIVE',
      userRoles: { create: { role: 'FINANCE_MANAGER' } },
    },
  });
  console.log(`Created finance manager: ${finance.email}`);

  // Campaign Creator
  const creator = await prisma.user.upsert({
    where: { email: 'creator@example.com' },
    update: {},
    create: {
      email: 'creator@example.com',
      passwordHash: password,
      firstName: 'Campaign',
      lastName: 'Creator',
      accountStatus: 'ACTIVE',
      userRoles: { create: { role: 'CAMPAIGN_CREATOR' } },
      creatorProfile: {
        create: {
          organizationName: 'Help Foundation',
          bio: 'Dedicated to helping patients afford surgery.',
          bankAccountName: 'Help Foundation',
          bankAccountNumber: '1234567890',
          bankIfsc: 'HDFC0001234',
          bankName: 'HDFC Bank',
        },
      },
    },
  });
  console.log(`Created campaign creator: ${creator.email}`);

  // Donor
  const donor = await prisma.user.upsert({
    where: { email: 'donor@example.com' },
    update: {},
    create: {
      email: 'donor@example.com',
      passwordHash: password,
      firstName: 'Generous',
      lastName: 'Donor',
      accountStatus: 'ACTIVE',
      userRoles: { create: { role: 'DONOR' } },
      donorProfile: {
        create: {
          displayName: 'Generous D.',
          isAnonymous: false,
          languagePreference: 'en',
        },
      },
    },
  });
  console.log(`Created donor: ${donor.email}`);

  // Sample Campaign
  const campaign = await prisma.campaign.upsert({
    where: { slug: 'help-ravi-heart-surgery-seed0001' },
    update: {},
    create: {
      creatorId: creator.id,
      title: 'Help Ravi Get Heart Surgery',
      slug: 'help-ravi-heart-surgery-seed0001',
      summary: 'Ravi needs an urgent heart surgery and his family cannot afford it.',
      description: 'Ravi is a 12-year-old boy from a small village who was diagnosed with a congenital heart defect. The surgery costs ₹5,00,000 and his family earns less than ₹10,000 a month. Every contribution counts.',
      goalAmount: 500000,
      currency: 'INR',
      status: 'ACTIVE',
      category: 'heart_surgery',
      urgencyLevel: 'critical',
      publishedAt: new Date(),
      medicalDetails: {
        create: {
          patientName: 'Ravi Kumar',
          patientAge: 12,
          patientGender: 'male',
          diagnosis: 'Congenital heart defect - Ventricular Septal Defect (VSD)',
          treatmentType: 'Open heart surgery',
          treatmentCost: 500000,
          doctorName: 'Dr. Sharma',
        },
      },
      hospitalDetails: {
        create: {
          hospitalName: 'Apollo Hospital',
          hospitalCity: 'Delhi',
          hospitalState: 'Delhi',
        },
      },
      statusHistory: {
        create: [
          { toStatus: 'DRAFT', changedBy: creator.id },
          { fromStatus: 'DRAFT', toStatus: 'SUBMITTED', changedBy: creator.id },
          { fromStatus: 'SUBMITTED', toStatus: 'UNDER_REVIEW', changedBy: moderator.id },
          { fromStatus: 'UNDER_REVIEW', toStatus: 'APPROVED', changedBy: moderator.id },
          { fromStatus: 'APPROVED', toStatus: 'ACTIVE', changedBy: moderator.id },
        ],
      },
    },
  });
  console.log(`Created sample campaign: ${campaign.title}`);

  // Partner Hospitals
  await prisma.partnerHospital.createMany({
    data: [
      { name: 'Apollo Hospitals', city: 'Delhi', state: 'Delhi', isActive: true, sortOrder: 1 },
      { name: 'AIIMS', city: 'Delhi', state: 'Delhi', isActive: true, sortOrder: 2 },
      { name: 'Fortis Healthcare', city: 'Mumbai', state: 'Maharashtra', isActive: true, sortOrder: 3 },
    ],
    skipDuplicates: true,
  });
  console.log('Created partner hospitals');

  // Board Members
  await prisma.boardMember.createMany({
    data: [
      { name: 'Dr. Rajesh Verma', title: 'Chairperson', bio: 'Leading cardiologist with 25 years of experience.', sortOrder: 1 },
      { name: 'Priya Agarwal', title: 'Treasurer', bio: 'Chartered accountant and social impact advocate.', sortOrder: 2 },
    ],
    skipDuplicates: true,
  });
  console.log('Created board members');

  console.log('\nSeed completed successfully!');
  console.log('\nTest accounts (password: Password123!):');
  console.log('  Super Admin:      admin@surgerycare.org');
  console.log('  Moderator:        moderator@surgerycare.org');
  console.log('  Finance Manager:  finance@surgerycare.org');
  console.log('  Campaign Creator: creator@example.com');
  console.log('  Donor:            donor@example.com');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
