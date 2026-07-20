import { DayOfWeek, PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../src/utils/password.js";

const prisma = new PrismaClient();

const doctors = [
  {
    name: "dr. Anahita Putri, Sp.PD",
    email: "dokter@anahita.test",
    specialty: "Penyakit Dalam",
    licenseNumber: "SIP-PD-001",
    experienceYears: 12,
    bio: "Dokter spesialis penyakit dalam dengan fokus pada perawatan komprehensif pasien dewasa.",
    schedules: [
      { code: "PD-SEN", day: DayOfWeek.MONDAY, start: "08:00", end: "14:00" },
      { code: "PD-RAB", day: DayOfWeek.WEDNESDAY, start: "08:00", end: "14:00" },
      { code: "PD-JUM", day: DayOfWeek.FRIDAY, start: "08:00", end: "14:00" },
    ],
  },
  {
    name: "dr. Bagas Pratama, Sp.A",
    email: "bagas@anahita.test",
    specialty: "Anak",
    licenseNumber: "SIP-A-002",
    experienceYears: 9,
    bio: "Mendampingi kesehatan bayi, anak, dan remaja dengan pendekatan yang ramah keluarga.",
    schedules: [
      { code: "AN-SEN", day: DayOfWeek.MONDAY, start: "09:00", end: "15:00" },
      { code: "AN-KAM", day: DayOfWeek.THURSDAY, start: "09:00", end: "15:00" },
    ],
  },
  {
    name: "dr. Citra Lestari, Sp.JP",
    email: "citra@anahita.test",
    specialty: "Jantung",
    licenseNumber: "SIP-JP-003",
    experienceYears: 11,
    bio: "Berpengalaman dalam pencegahan, diagnosis, dan tata laksana penyakit jantung.",
    schedules: [
      { code: "JT-SEL", day: DayOfWeek.TUESDAY, start: "10:00", end: "16:00" },
      { code: "JT-KAM", day: DayOfWeek.THURSDAY, start: "10:00", end: "16:00" },
    ],
  },
  {
    name: "dr. Dimas Ardi, Sp.N",
    email: "dimas@anahita.test",
    specialty: "Saraf",
    licenseNumber: "SIP-N-004",
    experienceYears: 10,
    bio: "Dokter spesialis neurologi untuk gangguan saraf pusat dan perifer.",
    schedules: [
      { code: "SR-SEL", day: DayOfWeek.TUESDAY, start: "08:00", end: "13:00" },
      { code: "SR-SAB", day: DayOfWeek.SATURDAY, start: "08:00", end: "13:00" },
    ],
  },
];

function time(value: string) {
  return new Date(`1970-01-01T${value}:00.000Z`);
}

async function main() {
  const patientPassword = await hashPassword("pasien123");
  const doctorPassword = await hashPassword("dokter123");
  const adminPassword = await hashPassword("admin123");

  await prisma.user.upsert({
    where: { email: "admin@anahita.test" },
    // Seed hanya mengisi data yang belum ada. Perubahan dari portal admin tidak
    // boleh dikembalikan ke nilai demo setiap kali container backend restart.
    update: {},
    create: {
      name: "Admin Anahita",
      email: "admin@anahita.test",
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
    },
  });

  const patientUser = await prisma.user.upsert({
    where: { email: "pasien@anahita.test" },
    update: {},
    create: {
      name: "Pasien Demo",
      email: "pasien@anahita.test",
      phone: "081234567890",
      passwordHash: patientPassword,
      role: UserRole.PATIENT,
    },
  });
  await prisma.patient.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      userId: patientUser.id,
      nik: "3374010101010001",
      medicalRecordNumber: `RM-${String(patientUser.id).padStart(8, "0")}`,
    },
  });

  for (const item of doctors) {
    const specialty = await prisma.specialty.upsert({
      where: { name: item.specialty },
      update: {},
      create: { name: item.specialty },
    });
    const user = await prisma.user.upsert({
      where: { email: item.email },
      update: {},
      create: {
        name: item.name,
        email: item.email,
        passwordHash: doctorPassword,
        role: UserRole.DOCTOR,
      },
    });
    const doctor = await prisma.doctor.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        specialtyId: specialty.id,
        licenseNumber: item.licenseNumber,
        experienceYears: item.experienceYears,
        bio: item.bio,
      },
    });

    for (const schedule of item.schedules) {
      await prisma.doctorSchedule.upsert({
        where: { code: schedule.code },
        update: {},
        create: {
          doctorId: doctor.id,
          code: schedule.code,
          day: schedule.day,
          startTime: time(schedule.start),
          endTime: time(schedule.end),
          quota: 20,
        },
      });
    }
  }

  const settings = [
    {
      key: "hospital_name",
      label: "Nama rumah sakit",
      value: "Anahita Hospital",
      valueType: "TEXT",
      group: "GENERAL",
      description: "Nama fasilitas yang tampil pada portal SIMRS.",
    },
    {
      key: "hospital_phone",
      label: "Nomor layanan",
      value: "+62 24 7654 3210",
      valueType: "TEXT",
      group: "CONTACT",
      description: "Nomor telepon utama layanan pasien.",
    },
    {
      key: "hospital_email",
      label: "Email layanan",
      value: "layanan@anahita.test",
      valueType: "EMAIL",
      group: "CONTACT",
      description: "Alamat email utama layanan pasien.",
    },
    {
      key: "booking_window_days",
      label: "Batas hari pendaftaran",
      value: "30",
      valueType: "NUMBER",
      group: "REGISTRATION",
      description: "Jarak maksimal pendaftaran kunjungan dari hari ini.",
    },
    {
      key: "queue_reminder_threshold",
      label: "Pengingat sisa antrean",
      value: "3",
      valueType: "NUMBER",
      group: "QUEUE",
      description: "Jumlah pasien di depan saat pengingat antrean ditampilkan.",
    },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { label: setting.label, valueType: setting.valueType, group: setting.group, description: setting.description },
      create: setting,
    });
  }

  console.log("Data demo Anahita Hospital siap digunakan.");
}

main()
  .finally(async () => prisma.$disconnect());
