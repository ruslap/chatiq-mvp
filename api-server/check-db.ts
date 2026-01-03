import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking Render database...\n');

  // Check users
  const users = await prisma.user.findMany();
  console.log(`👥 Users (${users.length}):`);
  users.forEach(u => console.log(`  - ${u.email} (${u.role}) - orgId: ${u.organizationId || 'none'}`));

  // Check sites
  const sites = await prisma.site.findMany();
  console.log(`\n🌐 Sites (${sites.length}):`);
  sites.forEach(s => console.log(`  - ${s.name} (${s.id}) - domain: ${s.domain}`));

  // Check widget settings
  const widgetSettings = await prisma.widgetSettings.findMany();
  console.log(`\n⚙️  Widget Settings (${widgetSettings.length}):`);
  widgetSettings.forEach(w => console.log(`  - orgId: ${w.organizationId}`));

  // Check chats
  const chats = await prisma.chat.findMany({
    include: {
      messages: true
    }
  });
  console.log(`\n💬 Chats (${chats.length}):`);
  chats.forEach(c => console.log(`  - ${c.id} (siteId: ${c.siteId}, visitor: ${c.visitorId}) - ${c.messages.length} messages`));

  // Check for organizationId: 8df94c53-1364-4bbd-99a4-f9a0ffb01f9a
  const targetOrgId = '8df94c53-1364-4bbd-99a4-f9a0ffb01f9a';
  console.log(`\n🎯 Checking for organizationId: ${targetOrgId}`);
  
  const targetSite = await prisma.site.findUnique({
    where: { id: targetOrgId }
  });
  console.log(`  Site exists: ${targetSite ? '✅ YES' : '❌ NO'}`);

  const targetWidget = await prisma.widgetSettings.findUnique({
    where: { organizationId: targetOrgId }
  });
  console.log(`  Widget settings exist: ${targetWidget ? '✅ YES' : '❌ NO'}`);

  const targetUser = await prisma.user.findFirst({
    where: { organizationId: targetOrgId }
  });
  console.log(`  User with this orgId: ${targetUser ? '✅ YES' : '❌ NO'}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
