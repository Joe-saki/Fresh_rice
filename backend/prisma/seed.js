const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CampusBite database...');

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { phone: '+233200000000' },
    update: {},
    create: {
      phone: '+233200000000',
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  // Create vendor user
  const vendorUser = await prisma.user.upsert({
    where: { phone: '+233201111111' },
    update: {},
    create: {
      phone: '+233201111111',
      name: 'Mama Akosua',
      role: 'VENDOR',
      vendor: {
        create: {
          businessName: "Mama Akosua's Kitchen",
          description: 'Authentic Ghanaian home cooking near UPSA',
          address: 'Near UPSA Main Gate, Accra',
          latitude: 5.7502,
          longitude: -0.1649,
          isOpen: true,
          isVerified: true,
          momoNumber: '+233201111111',
          foodItems: {
            create: [
              { name: 'Jollof Rice + Chicken', description: 'Classic Ghanaian jollof with grilled chicken', price: 20, category: 'Rice Dishes', isAvailable: true },
              { name: 'Waakye Special', description: 'Waakye with fish, egg, and all the fixings', price: 18, category: 'Rice Dishes', isAvailable: true },
              { name: 'Fufu + Light Soup', description: 'Fresh fufu with tilapia light soup', price: 25, category: 'Swallows', isAvailable: true },
              { name: 'Fried Rice + Beef', description: 'Ghanaian-style fried rice with beef stew', price: 20, category: 'Rice Dishes', isAvailable: true },
              { name: 'Kenkey + Fried Fish', description: 'Ga kenkey with crispy fried tilapia', price: 15, category: 'Swallows', isAvailable: true },
              { name: 'Kelewele', description: 'Spicy fried plantain cubes', price: 8, category: 'Snacks', isAvailable: true },
              { name: 'Sobolo', description: 'Chilled hibiscus drink', price: 5, category: 'Drinks', isAvailable: true },
              { name: 'Hausa Koko + Koose', description: 'Millet porridge with bean cakes', price: 12, category: 'Breakfast', isAvailable: true },
            ],
          },
        },
      },
    },
  });

  // Create a student user
  const studentUser = await prisma.user.upsert({
    where: { phone: '+233202222222' },
    update: {},
    create: {
      phone: '+233202222222',
      name: 'Kwame Asante',
      role: 'STUDENT',
      student: {
        create: {
          hostel: 'Block A',
          bitesPoints: 50,
        },
      },
    },
  });

  // Create a rider user
  const riderUser = await prisma.user.upsert({
    where: { phone: '+233203333333' },
    update: {},
    create: {
      phone: '+233203333333',
      name: 'Kofi Mensah',
      role: 'RIDER',
      rider: {
        create: {
          isAvailable: true,
          momoNumber: '+233203333333',
        },
      },
    },
  });

  console.log('✅ Seed complete!');
  console.log('📱 Test accounts:');
  console.log('  Admin:   +233200000000');
  console.log('  Vendor:  +233201111111');
  console.log('  Student: +233202222222');
  console.log('  Rider:   +233203333333');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
