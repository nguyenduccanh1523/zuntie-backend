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
    { name: 'Nhãn cuộn (Roll Labels)', slug: 'nhan-cuon', description: 'Nhãn in dạng cuộn phù hợp dán máy tự động' },
    { name: 'Nhãn dán chai lọ (Bottle Labels)', slug: 'nhan-chai-lo', description: 'Nhãn chống nước dán trên chai thủy tinh, nhựa' },
    { name: 'Nhãn niêm phong (Security Labels)', slug: 'nhan-niem-phong', description: 'Nhãn vỡ, nhãn void chống hàng giả, niêm phong hộp' },
    { name: 'Nhãn màng co (Shrink Sleeve)', slug: 'nhan-mang-co', description: 'Màng co ôm sát thân chai 360 độ' },
    { name: 'Nhãn nhiệt (Thermal Labels)', slug: 'nhan-nhiet', description: 'Nhãn in nhiệt trực tiếp dùng cho mã vạch & vận chuyển' },
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
