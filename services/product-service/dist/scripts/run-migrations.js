"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("../src/config/data-source");
async function run() {
    try {
        console.log('Initializing data source...');
        await data_source_1.default.initialize();
        console.log('Running migrations...');
        await data_source_1.default.runMigrations();
        console.log('Migrations finished.');
        await data_source_1.default.destroy();
    }
    catch (err) {
        console.error('Migration runner error:', err);
        process.exit(1);
    }
}
run();
//# sourceMappingURL=run-migrations.js.map