import { cleanupAllTestData } from './helpers/cleanup';

async function main() {
  console.log('Running manual cleanup...');
  await cleanupAllTestData();
  console.log('Cleanup complete!');
}

main().catch(console.error);
