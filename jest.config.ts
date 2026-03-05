import type { Config } from 'jest';

const config: Config = {
  projects: [
    '<rootDir>/packages/core',
    '<rootDir>/packages/ui',
    {
      displayName: 'e2e',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.{ts,tsx}'],
      transform: {
        '^.+\\.tsx?$': [
          'ts-jest',
          { useESM: true, tsconfig: '<rootDir>/tsconfig.base.json' },
        ],
      },
      extensionsToTreatAsEsm: ['.ts', '.tsx'],
      moduleNameMapper: {
        '^@ui/(.*)$': '<rootDir>/packages/ui/src/$1',
        '^@core/(.*)$': '<rootDir>/packages/core/src/$1',
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '\\.css$': '<rootDir>/packages/ui/src/__mocks__/styleMock.ts',
      },
    },
  ],
};

export default config;
