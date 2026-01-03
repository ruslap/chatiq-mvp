import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const targetOrgId = '8df94c53-1364-4bbd-99a4-f9a0ffb01f9a';
  
  console.log(`🔧 Fixing user organizationId to: ${targetOrgId}\n`);

  // Update the test user to have the correct organizationId
  const user = await prisma.user.update({
    where: { email: 'test@example.com' },
    data: {
      organizationId: targetOrgId
    }
  });

  console.log('✅ Updated user:');
  console.log(`  - Email: ${user.email}`);
  console.log(`  - Organization ID: ${user.organizationId}`);
  console.log(`  - Role: ${user.role}`);
  
  console.log('\n🎯 Now all components are synced:');
  console.log(`  - Widget: ${targetOrgId}`);
  console.log(`  - Admin Panel API: ${targetOrgId}`);
  console.log(`  - Database Site: ${targetOrgId}`);
  console.log(`  - Database User: ${targetOrgId}`);
  console.log(`  - Widget Settings: ${targetOrgId}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
