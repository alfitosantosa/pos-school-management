import { prisma } from "@/lib/prisma";

async function main() {
  const scheduleId = "cml6ujnm30001gq5knaxswp1a";

  console.log("Checking Attendance for Schedule:", scheduleId);

  const attendances = await prisma.attendance.findMany({
    where: {
      scheduleId: scheduleId,
    },
  });

  console.log(`Found ${attendances.length} records.`);
  attendances.forEach((a: { id: any; date: { toISOString: () => any; toLocaleString: () => any } }) => {
    console.log(`ID: ${a.id}, Date: ${a.date.toISOString()}, Local: ${a.date.toLocaleString()}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
