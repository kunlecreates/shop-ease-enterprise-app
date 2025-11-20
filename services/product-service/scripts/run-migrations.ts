import AppDataSource from '../src/config/data-source';

async function run() {
  try {
    console.log('Initializing data source...');
    await AppDataSource.initialize();
    console.log('Running migrations...');
    await AppDataSource.runMigrations();
    console.log('Migrations finished.');
    await AppDataSource.destroy();
  } catch (err) {
    console.error('Migration runner error:', err);
    process.exit(1);
  }
}

run();