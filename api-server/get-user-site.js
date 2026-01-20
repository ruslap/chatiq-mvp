const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const organizationId = '058caa6b-9f73-4424-88be-dc8a414545a0';

  // Find user with this organization
  const user = await prisma.user.findFirst({
    where: { organizationId },
    select: {
      id: true,
      email: true,
      name: true,
      ownedSites: {
        select: {
          id: true,
          name: true,
          domain: true,
        },
      },
    },
  });

  if (!user) {
    console.log('❌ User not found with this organization ID');
    return;
  }

  console.log('✅ User found:');
  console.log(`   Name: ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`\n📍 Sites:`);

  if (user.ownedSites.length === 0) {
    console.log('   No sites found');
  } else {
    user.ownedSites.forEach((site, index) => {
      console.log(`   ${index + 1}. ${site.name} (${site.domain})`);
      console.log(`      Site ID: ${site.id}`);
    });

    console.log(`\n✅ Use this Site ID: ${user.ownedSites[0].id}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
