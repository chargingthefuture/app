

DATABASE_URL="postgresql://user:password@host:port/database" npm run db:push

DATABASE_URL="postgresql://user:password@host:port/database" npm run db:push --force

# Seed Scripts

DATABASE_URL="postgresql://user:password@host:port/database" npx tsx scripts/seedNpsResponses.ts

DATABASE_URL="postgresql://user:password@host:port/database" npx tsx scripts/seedWeeklyPerformanceMetrics.ts

DATABASE_URL="postgresql://user:password@host:port/database" npx tsx scripts/seedTestUsers.ts

DATABASE_URL="postgresql://user:password@host:port/database" npx tsx scripts/seedTrustTransport.ts

DATABASE_URL="postgresql://user:password@host:port/database" npx tsx scripts/seedChatGroups.ts

DATABASE_URL="postgresql://user:password@host:port/database" npx tsx scripts/seedDirectory.ts

DATABASE_URL="postgresql://user:password@host:port/database" npx tsx scripts/seedMechanicMatch

DATABASE_URL="postgresql://user:password@host:port/database" npx tsx scripts/seedReportsData.ts

DATABASE_URL="postgresql://user:password@host:port/database" npx tsx scripts/seedSocketRelay.ts

