const nextJest = require('next/jest.js');

const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  collectCoverageFrom: [
    'lib/**/*.ts',
    '!lib/supabase.ts',     // skip — requires live credentials
    '!lib/emailSender.ts',  // skip — requires live Resend credentials
    '!lib/summarizer.ts',   // skip — requires live Gemini credentials
    '!lib/newsFetcher.ts',  // skip — requires live RSS feeds
  ],
};

module.exports = createJestConfig(config);
