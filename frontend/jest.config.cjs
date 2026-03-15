module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  coverageReporters: ["json-summary", "text"],
  roots: ['<rootDir>/__tests__'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        module: 'commonjs',
      },
    }],
  },
  moduleNameMapper: {
    // Resolve Next.js / TypeScript path alias @/* → project root
    '^@/(.*)$': '<rootDir>/$1',
  },
};
