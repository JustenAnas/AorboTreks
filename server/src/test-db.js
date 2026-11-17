
import prisma from "./config/db.js";

try {
  await prisma.$connect();

  console.log("✅ Prisma connected to Neon!");

  const result = await prisma.$queryRaw`SELECT NOW()`;
  console.log(result[0]);
} catch (error) {
  console.error("Connection failed:", error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
