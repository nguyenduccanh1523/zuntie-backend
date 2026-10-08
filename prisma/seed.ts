import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString =
  process.env.DIRECT_DATABASE_URL ||
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL;

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting Zuntie Database Seeding...');

  // 1. Seed Root Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'zuntie' },
    update: {
      name: 'Zuntie Digital Labeling',
      status: 'ACTIVE',
    },
    create: {
      name: 'Zuntie Digital Labeling',
      slug: 'zuntie',
      status: 'ACTIVE',
      settingsJson: {
        currency: 'VND',
        timezone: 'Asia/Ho_Chi_Minh',
        contactEmail: 'contact@zuntie.com',
      },
    },
  });
  console.log(`✅ Root Organization seeded: ${org.name} (${org.id})`);

  // 2. Seed Default Label Types
  const labelTypes = [
    { name: 'Nhãn dệt', slug: 'woven-labels', description: 'Nhãn dệt mềm, bền màu cho thời trang và sản phẩm may mặc.' },
    { name: 'Nhãn in vải', slug: 'printed-fabric-labels', description: 'Nhãn in trên satin, cotton hoặc taffeta với chữ nhỏ sắc nét.' },
    { name: 'Nhãn hướng dẫn giặt', slug: 'care-labels', description: 'Nhãn thông tin thành phần và hướng dẫn bảo quản sản phẩm.' },
    { name: 'Thẻ treo', slug: 'hang-tags', description: 'Thẻ treo giấy mỹ thuật, phù hợp logo và thông tin thương hiệu.' },
    { name: 'Nhãn dán', slug: 'stickers', description: 'Nhãn dán đóng gói, nhận diện và hoàn thiện sản phẩm.' },
  ];

  for (let i = 0; i < labelTypes.length; i++) {
    const item = labelTypes[i];
    await prisma.labelType.upsert({
      where: {
        organizationId_slug: {
          organizationId: org.id,
          slug: item.slug,
        },
      },
      update: {
        name: item.name,
        description: item.description,
        sortOrder: i + 1,
      },
      create: {
        organizationId: org.id,
        name: item.name,
        slug: item.slug,
        description: item.description,
        sortOrder: i + 1,
        isActive: true,
      },
    });
  }
  console.log(`✅ Seeded ${labelTypes.length} Label Types`);

  // 3. Seed Default Materials
  const materials = [
    {
      name: 'Decal giấy (Paper Label)',
      slug: 'decal-giay',
      properties: { waterproof: false, tearProof: false, finish: ['GLOSS', 'MATTE'] },
    },
    {
      name: 'Decal nhựa PP (PP Plastic)',
      slug: 'decal-nhua-pp',
      properties: { waterproof: true, tearProof: true, finish: ['GLOSS', 'MATTE'] },
    },
    {
      name: 'Decal trong (Clear Vinyl)',
      slug: 'decal-trong',
      properties: { transparent: true, waterproof: true, finish: ['GLOSS'] },
    },
    {
      name: 'Decal bạc (Metallic Foil)',
      slug: 'decal-bac',
      properties: { metallic: true, waterproof: true, finish: ['FOIL'] },
    },
    {
      name: 'Decal Kraft (Eco Kraft Paper)',
      slug: 'decal-kraft',
      properties: { ecoFriendly: true, waterproof: false, finish: ['NATURAL'] },
    },
  ];

  for (let i = 0; i < materials.length; i++) {
    const item = materials[i];
    await prisma.material.upsert({
      where: {
        organizationId_slug: {
          organizationId: org.id,
          slug: item.slug,
        },
      },
      update: {
        name: item.name,
        propertiesJson: item.properties,
        sortOrder: i + 1,
      },
      create: {
        organizationId: org.id,
        name: item.name,
        slug: item.slug,
        propertiesJson: item.properties,
        sortOrder: i + 1,
        isActive: true,
      },
    });
  }
  console.log(`✅ Seeded ${materials.length} Materials`);

  console.log('🎉 Seed script executed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
