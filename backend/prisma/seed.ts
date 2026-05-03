import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface SeedUser {
  email: string;
  password: string;
  name: string;
  role: Role;
}

const SEED_USERS: SeedUser[] = [
  {
    email: process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com',
    password: process.env.E2E_ADMIN_PASSWORD ?? 'Admin1234!',
    name: 'Admin User',
    role: Role.ADMIN,
  },
  {
    email: process.env.E2E_USER_EMAIL ?? 'user@example.com',
    password: process.env.E2E_USER_PASSWORD ?? 'User1234!',
    name: 'Regular User',
    role: Role.USER,
  },
];

async function main() {
  console.log('🌱 Seeding database with E2E test users...');

  for (const seedUser of SEED_USERS) {
    const existing = await prisma.user.findUnique({
      where: { email: seedUser.email },
    });

    if (existing) {
      // Update password hash and role in case they changed
      const passwordHash = await bcrypt.hash(seedUser.password, 12);
      await prisma.user.update({
        where: { email: seedUser.email },
        data: { passwordHash, role: seedUser.role, name: seedUser.name },
      });
      console.log(`  ✔ Updated existing user: ${seedUser.email} (${seedUser.role})`);
    } else {
      const passwordHash = await bcrypt.hash(seedUser.password, 12);
      await prisma.user.create({
        data: {
          email: seedUser.email,
          passwordHash,
          name: seedUser.name,
          role: seedUser.role,
        },
      });
      console.log(`  ✔ Created user: ${seedUser.email} (${seedUser.role})`);
    }
  }

  console.log('✅ Seed complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
