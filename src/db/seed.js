const { getDatabase } = require('./database');
const StudentRepository = require('../repositories/studentRepository');
const PaymentRepository = require('../repositories/paymentRepository');

async function seed() {
  const db = getDatabase();
  const studentRepo = new StudentRepository(db);
  const paymentRepo = new PaymentRepository(db);

  console.log('[Seed] Seeding sample data...');

  db.exec('DELETE FROM payments;');
  db.exec('DELETE FROM students;');
  try {
    db.exec("DELETE FROM sqlite_sequence WHERE name IN ('students', 'payments');");
  } catch {
  }

  const studentsData = [
    {
      full_name: 'Elena Rostova',
      phone_number: '+1 (555) 234-5678',
      group_name: 'Web Development A',
      monthly_fee: 150.00
    },
    {
      full_name: 'Marcus Vance',
      phone_number: '+1 (555) 876-5432',
      group_name: 'Web Development A',
      monthly_fee: 150.00
    },
    {
      full_name: 'Sarah Chen',
      phone_number: '+1 (555) 345-6789',
      group_name: 'UI/UX Design B',
      monthly_fee: 120.00
    },
    {
      full_name: 'Tariq Al-Mansoor',
      phone_number: '+1 (555) 987-6543',
      group_name: 'Data Science C',
      monthly_fee: 200.00
    },
    {
      full_name: 'Chloe Dubois',
      phone_number: '+1 (555) 456-7890',
      group_name: 'Data Science C',
      monthly_fee: 200.00
    }
  ];

  const createdStudents = [];
  for (const s of studentsData) {
    createdStudents.push(await studentRepo.create(s));
  }
  console.log(`[Seed] Created ${createdStudents.length} students.`);

  await paymentRepo.create({
    student_id: createdStudents[0].id,
    amount: 100.00,
    payment_date: '2026-10-05'
  });
  await paymentRepo.create({
    student_id: createdStudents[0].id,
    amount: 50.00,
    payment_date: '2026-10-12'
  });

  await paymentRepo.create({
    student_id: createdStudents[1].id,
    amount: 50.00,
    payment_date: '2026-10-10'
  });

  await paymentRepo.create({
    student_id: createdStudents[2].id,
    amount: 150.00,
    payment_date: '2026-10-01'
  });

  await paymentRepo.create({
    student_id: createdStudents[3].id,
    amount: 200.00,
    payment_date: '2026-09-15'
  });

  console.log('[Seed] Sample payments seeded successfully.');
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = seed;

