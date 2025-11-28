# Seed Scripts

DATABASE_URL="postgresql://user:password@host:port/database" npx tsx scripts/seedNpsResponses.ts

# View logs via Railway CLI
railway run tail -f logs/app-error-*.log
   
# Or download them
railway run tar -czf logs.tar.gz logs/

# Run Tests

npm run test          # Run all tests
npm run test:coverage # Run with coverage report