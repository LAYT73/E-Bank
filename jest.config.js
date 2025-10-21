/** @type {import('ts-jest').JestConfigWithTsJest} */
export const preset = 'ts-jest';
export const testEnvironment = 'node';
export const moduleNameMapper = {
  '^@/(.*)$': '<rootDir>/src/$1',
};
export const testMatch = ['**/__tests__/**/*.spec.ts', '**/*.test.ts'];

export const setupFilesAfterEnv = ['<rootDir>/src/setupTests.ts'];
