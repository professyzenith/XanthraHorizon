import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
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

export default createJestConfig(config);
