const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@mddesk.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@mddesk.com',
      password: adminPassword,
      role: 'ADMIN',
      phone: '+911234567890',
      city: 'Mumbai',
    },
  });

  await prisma.product.upsert({
    where: { id: 'seed-product-1' },
    update: {},
    create: {
      id: 'seed-product-1',
      name: 'Premium Emulsion',
      description: 'Interior wall paint',
    },
  });
  await prisma.product.upsert({
    where: { id: 'seed-product-2' },
    update: {},
    create: {
      id: 'seed-product-2',
      name: 'Exterior Paint',
      description: 'Weather resistant exterior coating',
    },
  });

  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
