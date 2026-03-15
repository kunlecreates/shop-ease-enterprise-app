describe('data-source config', () => {
  const original = {
    PRODUCT_DB_HOST: process.env.PRODUCT_DB_HOST,
    PRODUCT_DB_PORT: process.env.PRODUCT_DB_PORT,
    PRODUCT_DB_USER: process.env.PRODUCT_DB_USER,
    PRODUCT_DB_PASSWORD: process.env.PRODUCT_DB_PASSWORD,
    PRODUCT_DB_NAME: process.env.PRODUCT_DB_NAME,
  };

  afterEach(() => {
    process.env.PRODUCT_DB_HOST = original.PRODUCT_DB_HOST;
    process.env.PRODUCT_DB_PORT = original.PRODUCT_DB_PORT;
    process.env.PRODUCT_DB_USER = original.PRODUCT_DB_USER;
    process.env.PRODUCT_DB_PASSWORD = original.PRODUCT_DB_PASSWORD;
    process.env.PRODUCT_DB_NAME = original.PRODUCT_DB_NAME;
    jest.resetModules();
  });

  it('builds AppDataSource from PRODUCT_DB_* env vars', async () => {
    process.env.PRODUCT_DB_HOST = 'db-host';
    process.env.PRODUCT_DB_PORT = '5433';
    process.env.PRODUCT_DB_USER = 'db-user';
    process.env.PRODUCT_DB_PASSWORD = 'db-pass';
    process.env.PRODUCT_DB_NAME = 'db-name';

    jest.resetModules();
    const module = await import('../../src/config/data-source');
    const options = module.AppDataSource.options as any;

    expect(options.type).toBe('postgres');
    expect(options.host).toBe('db-host');
    expect(options.port).toBe(5433);
    expect(options.username).toBe('db-user');
    expect(options.password).toBe('db-pass');
    expect(options.database).toBe('db-name');
    expect(options.migrationsRun).toBe(false);
    expect(options.logging).toBe(false);
    expect(Array.isArray(options.entities)).toBe(true);
    expect(options.entities.length).toBeGreaterThan(0);
  });
});