const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const sites = await prisma.site.findMany({
    select: {
      id: true,
      name: true,
      domain: true,
    },
    take: 5,
  });

  console.log('Available sites:');
  sites.forEach((site, index) => {
    console.log(`${index + 1}. ${site.name} (${site.domain})`);
    console.log(`   ID: ${site.id}`);
  });

  if (sites.length > 0) {
    console.log(`\n✅ Use this siteId for testing: ${sites[0].id}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
