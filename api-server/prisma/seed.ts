import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
            email: 'test@example.com',
            name: 'Test Operator',
            role: UserRole.OWNER,
        },
    });

    const site = await prisma.site.upsert({
        where: { id: '8df94c53-1364-4bbd-99a4-f9a0ffb01f9a' },
        update: {
            ownerId: user.id,
        },
        create: {
            id: '8df94c53-1364-4bbd-99a4-f9a0ffb01f9a',
            name: 'Demo Site',
            domain: 'localhost',
            ownerId: user.id,
            apiKey: 'demo-api-key-v3',
        },
    });

    console.log('Seeded database with test user and site 8df94c53-1364-4bbd-99a4-f9a0ffb01f9a');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
