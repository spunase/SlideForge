import type { Config } from 'jest';

const config: Config = {
  displayName: 'ui',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    '^@ui/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/../core/src/$1',
    '\\.css$': '<rootDir>/src/__mocks__/styleMock.ts',
  },
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/index.ts',
    '!src/**/*.test.{ts,tsx}',
  ],
};

export default config;
