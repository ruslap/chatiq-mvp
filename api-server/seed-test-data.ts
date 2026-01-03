import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding test data...');

  // Create test user
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      role: 'OWNER',
      organizationId: '8df94c53-1364-4bbd-99a4-f9a0ffb01f9a',
    },
  });

  console.log('Created user:', user);

  // Create test site with the organizationId
  const site = await prisma.site.upsert({
    where: { id: '8df94c53-1364-4bbd-99a4-f9a0ffb01f9a' },
    update: {},
    create: {
      id: '8df94c53-1364-4bbd-99a4-f9a0ffb01f9a',
      name: 'Test Site',
      domain: 'localhost',
      ownerId: user.id,
    },
  });

  console.log('Created site:', site);

  // Create widget settings
  const widgetSettings = await prisma.widgetSettings.upsert({
    where: { organizationId: '8df94c53-1364-4bbd-99a4-f9a0ffb01f9a' },
    update: {},
    create: {
      organizationId: '8df94c53-1364-4bbd-99a4-f9a0ffb01f9a',
      color: '#6366F1',
      operatorName: 'Support Team',
      welcomeMessage: 'Вітаю! 👋 Чим можу допомогти?',
    },
  });

  console.log('Created widget settings:', widgetSettings);

  console.log('✅ Test data seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
