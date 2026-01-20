import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL is not set.');
    console.error('Please run this script with the database URL environment variable:');
    console.error('  DATABASE_URL="postgresql://..." npx ts-node scripts/debug-telegram.ts');
    process.exit(1);
  }

  console.log('Checking Telegram Integrations...');

  const sites = await prisma.site.findMany({
    include: {
      telegramIntegration: {
        include: {
          subscriptions: true,
        },
      },
    },
  });

  console.log(`Found ${sites.length} sites.`);

  for (const site of sites) {
    console.log(`\n---------------------------------------------------`);
    console.log(`Site: ${site.name}`);
    console.log(`ID:   ${site.id}`);
    const tg = site.telegramIntegration;

    if (!tg) {
      console.log('  [ ] No Telegram Integration found.');
      continue;
    }

    console.log(`  [x] Telegram Integration found:`);
    console.log(`      Enabled: ${tg.enabled}`);
    console.log(`      Bot Username: ${tg.botUsername}`);
    console.log(`      Connect Code: ${tg.connectCode}`);
    console.log(`      Subscriptions Configured: ${tg.subscriptions.length}`);

    if (tg.subscriptions.length > 0) {
      console.log(`      Subscribers:`);
      tg.subscriptions.forEach((sub) => {
        console.log(`        - ChatID: ${sub.chatId}`);
        console.log(`          Active: ${sub.isActive}`);
        console.log(`          User:   ${sub.username || sub.firstName}`);
      });
    } else {
        console.log('      WARNING: No active subscribers! Notifications will NOT be sent.');
        console.log('      ACTION: Use /start <ConnectCode> in the bot to subscribe.');
    }
  }
  console.log(`\n---------------------------------------------------`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
