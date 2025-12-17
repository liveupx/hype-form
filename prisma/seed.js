// ===========================================
// HYPEFORM - Database Seed
// ===========================================
// Run with: npm run db:seed

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ===========================================
  // USERS
  // ===========================================
  
  const adminPassword = await bcrypt.hash('admin123!', 12);
  const demoPassword = await bcrypt.hash('demo123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@hypeform.io' },
    update: {},
    create: {
      email: 'admin@hypeform.io',
      password: adminPassword,
      name: 'Admin User',
      role: 'SUPER_ADMIN',
      plan: 'ENTERPRISE',
      emailVerified: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  const demo = await prisma.user.upsert({
    where: { email: 'demo@hypeform.io' },
    update: {},
    create: {
      email: 'demo@hypeform.io',
      password: demoPassword,
      name: 'Demo User',
      role: 'USER',
      plan: 'PRO',
      emailVerified: true,
    },
  });
  console.log('✅ Demo user created:', demo.email);

  // ===========================================
  // TEMPLATES
  // ===========================================

  const templates = [
    {
      name: 'Contact Form',
      description: 'Simple contact form for your website',
      category: 'Business',
      featured: true,
      fields: JSON.stringify([
        { type: 'SHORT_TEXT', label: 'Full Name', required: true },
        { type: 'EMAIL', label: 'Email Address', required: true },
        { type: 'SHORT_TEXT', label: 'Subject', required: true },
        { type: 'LONG_TEXT', label: 'Message', required: true },
      ]),
    },
    {
      name: 'Customer Feedback',
      description: 'Collect feedback from your customers',
      category: 'Feedback',
      featured: true,
      fields: JSON.stringify([
        { type: 'RATING', label: 'How would you rate our service?', required: true },
        { type: 'LONG_TEXT', label: 'What did you like most?', required: false },
        { type: 'LONG_TEXT', label: 'What could we improve?', required: false },
        { type: 'NPS', label: 'How likely are you to recommend us?', required: true },
      ]),
    },
    {
      name: 'Job Application',
      description: 'Collect job applications',
      category: 'HR',
      featured: true,
      fields: JSON.stringify([
        { type: 'SHORT_TEXT', label: 'Full Name', required: true },
        { type: 'EMAIL', label: 'Email', required: true },
        { type: 'PHONE', label: 'Phone Number', required: true },
        { type: 'FILE_UPLOAD', label: 'Resume/CV', required: true },
        { type: 'LONG_TEXT', label: 'Cover Letter', required: false },
      ]),
    },
    {
      name: 'Event Registration',
      description: 'Register attendees for your event',
      category: 'Events',
      featured: true,
      fields: JSON.stringify([
        { type: 'SHORT_TEXT', label: 'Full Name', required: true },
        { type: 'EMAIL', label: 'Email', required: true },
        { type: 'PHONE', label: 'Phone', required: false },
        { type: 'SELECT', label: 'Ticket Type', required: true, options: ['General', 'VIP', 'Student'] },
        { type: 'NUMBER', label: 'Number of Guests', required: false },
      ]),
    },
    {
      name: 'Lead Generation',
      description: 'Capture leads for your business',
      category: 'Marketing',
      featured: true,
      fields: JSON.stringify([
        { type: 'SHORT_TEXT', label: 'Company Name', required: true },
        { type: 'SHORT_TEXT', label: 'Your Name', required: true },
        { type: 'EMAIL', label: 'Work Email', required: true },
        { type: 'PHONE', label: 'Phone Number', required: false },
        { type: 'SELECT', label: 'Company Size', required: true, options: ['1-10', '11-50', '51-200', '200+'] },
      ]),
    },
    {
      name: 'Product Order',
      description: 'Simple product order form',
      category: 'E-commerce',
      featured: true,
      fields: JSON.stringify([
        { type: 'SHORT_TEXT', label: 'Full Name', required: true },
        { type: 'EMAIL', label: 'Email', required: true },
        { type: 'ADDRESS', label: 'Shipping Address', required: true },
        { type: 'SELECT', label: 'Product', required: true, options: ['Product A', 'Product B', 'Product C'] },
        { type: 'NUMBER', label: 'Quantity', required: true },
      ]),
    },
  ];

  for (const template of templates) {
    await prisma.template.upsert({
      where: { id: template.name.toLowerCase().replace(/\s+/g, '-') },
      update: template,
      create: {
        id: template.name.toLowerCase().replace(/\s+/g, '-'),
        ...template,
      },
    });
  }
  console.log(`✅ ${templates.length} templates created`);

  // ===========================================
  // SAMPLE FORM
  // ===========================================

  const sampleForm = await prisma.form.upsert({
    where: { publicId: 'sample-feedback-form' },
    update: {},
    create: {
      publicId: 'sample-feedback-form',
      userId: demo.id,
      title: 'Customer Feedback Survey',
      description: 'Help us improve by sharing your feedback',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      views: 150,
      starts: 45,
      settings: {
        showProgressBar: true,
        allowMultipleSubmissions: false,
        notifyOnSubmission: true,
      },
      theme: {
        primaryColor: '#f59e0b',
        backgroundColor: '#fafaf9',
        fontFamily: 'DM Sans',
      },
    },
  });

  // Create form fields
  const fields = [
    { type: 'WELCOME', label: 'Welcome!', description: 'Thanks for taking our survey', order: 0 },
    { type: 'RATING', label: 'How satisfied are you with our service?', required: true, order: 1 },
    { type: 'SHORT_TEXT', label: 'What do you like most about us?', required: false, order: 2 },
    { type: 'LONG_TEXT', label: 'Any suggestions for improvement?', required: false, order: 3 },
    { type: 'NPS', label: 'How likely are you to recommend us to a friend?', required: true, order: 4 },
    { type: 'THANK_YOU', label: 'Thank you!', description: 'We appreciate your feedback', order: 5 },
  ];

  for (const field of fields) {
    await prisma.formField.create({
      data: {
        formId: sampleForm.id,
        ...field,
      },
    });
  }
  console.log('✅ Sample form with fields created');

  // Create sample submissions
  const formFields = await prisma.formField.findMany({
    where: { formId: sampleForm.id },
  });

  const ratingField = formFields.find(f => f.type === 'RATING');
  const textField = formFields.find(f => f.type === 'SHORT_TEXT');
  const npsField = formFields.find(f => f.type === 'NPS');

  const sampleSubmissions = [
    { rating: 5, text: 'Excellent service!', nps: 10 },
    { rating: 4, text: 'Very good experience', nps: 8 },
    { rating: 5, text: 'Love the product', nps: 9 },
  ];

  for (const sub of sampleSubmissions) {
    const submission = await prisma.submission.create({
      data: {
        formId: sampleForm.id,
        status: 'COMPLETED',
        completedAt: new Date(),
        metadata: { source: 'seed' },
      },
    });

    if (ratingField) {
      await prisma.fieldAnswer.create({
        data: {
          submissionId: submission.id,
          fieldId: ratingField.id,
          value: sub.rating,
        },
      });
    }

    if (textField) {
      await prisma.fieldAnswer.create({
        data: {
          submissionId: submission.id,
          fieldId: textField.id,
          value: sub.text,
        },
      });
    }

    if (npsField) {
      await prisma.fieldAnswer.create({
        data: {
          submissionId: submission.id,
          fieldId: npsField.id,
          value: sub.nps,
        },
      });
    }
  }
  console.log('✅ Sample submissions created');

  console.log('\n🎉 Database seeding completed!\n');
  console.log('Demo Accounts:');
  console.log('  Admin: admin@hypeform.io / admin123!');
  console.log('  User:  demo@hypeform.io / demo123!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
