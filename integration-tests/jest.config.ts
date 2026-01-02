import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRegex: '/(contracts|flows|observability)/.*\\.test\\.ts$',
  setupFilesAfterEnv: ['<rootDir>/framework/setup.ts']
};

export default config;
