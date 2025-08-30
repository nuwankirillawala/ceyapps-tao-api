import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const subscriptionPlans = [
  {
    name: 'The Citrus Starter',
    description: 'Perfect for beginners starting their bartending journey',
    price: 25.00,
    currency: 'USD',
    interval: 'month',
    intervalCount: 1,
    isActive: true,
    features: [
      'Beginner Courses',
      'Lifetime Access',
      'Community Forum Access',
      'Annual Billing Discount Available',
      'À La Carte Course Purchase Option'
    ],
    maxCourses: 5
  },
  {
    name: 'The Shaker Pro',
    description: 'For intermediate bartenders looking to enhance their skills',
    price: 35.00,
    currency: 'USD',
    interval: 'month',
    intervalCount: 1,
    isActive: true,
    features: [
      'Beginner Courses',
      'Intermediate Courses',
      'Lifetime Access',
      'Community Forum Access',
      'Monthly Live Q&A',
      'Downloadable Recipe E-Book',
      'Annual Billing Discount Available',
      'À La Carte Course Purchase Option'
    ],
    maxCourses: 15
  },
  {
    name: 'The Spirit Expert',
    description: 'Comprehensive plan for advanced bartenders and professionals',
    price: 85.00,
    currency: 'USD',
    interval: 'month',
    intervalCount: 1,
    isActive: true,
    features: [
      'Beginner Courses',
      'Intermediate Courses',
      'Advanced Courses',
      'Lifetime Access',
      'Community Forum Access',
      'Monthly Live Q&A',
      'Downloadable Recipe E-Book',
      '1-On-1 Mentorship Session Per Month',
      'Priority Support',
      'Exclusive Masterclass Events',
      'Annual Billing Discount Available',
      'À La Carte Course Purchase Option'
    ],
    maxCourses: -1 // Unlimited
  }
];

async function main() {
  console.log('🌱 Seeding subscription plans...');

  for (const plan of subscriptionPlans) {
    const existingPlan = await prisma.subscriptionPlan.findFirst({
      where: { name: plan.name }
    });

    if (existingPlan) {
      console.log(`📝 Updating existing plan: ${plan.name}`);
      await prisma.subscriptionPlan.update({
        where: { id: existingPlan.id },
        data: plan
      });
    } else {
      console.log(`✨ Creating new plan: ${plan.name}`);
      await prisma.subscriptionPlan.create({
        data: plan
      });
    }
  }

  console.log('✅ Subscription plans seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding subscription plans:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

