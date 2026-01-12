const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const settings = await prisma.widgetSettings.findMany({
        where: {
            operatorAvatar: {
                not: null
            }
        },
        select: {
            organizationId: true,
            operatorAvatar: true
        }
    });

    console.log(JSON.stringify(settings, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
