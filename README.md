

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

# Run Tests

npm run test          # Run all tests
npm run test:coverage # Run with coverage report

To merge changes from the **staging** branch into the **main** branch, you'll typically follow these steps in your Git workflow:

# Steps to Merge Staging into Main

1. **Check out the main branch:**
   ```bash
   git checkout main
   ```

2. **Pull the latest changes to ensure you're up to date:**
   ```bash
   git pull origin main
   ```

3. **Merge the staging branch into the main branch:**
   ```bash
   git merge staging
   ```

4. **Resolve any merge conflicts if they arise.**

5. **Commit the merge if there were conflicts:**
   ```bash
   git commit -m "Merge staging into main"
   ```

6. **Push the merged changes to the remote main branch:**
   ```bash
   git push origin main
   ```