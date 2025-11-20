"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const app_module_1 = require("./app.module");
describe('AppModule', () => {
    beforeAll(() => {
        process.env.TEST_SQLITE = '1';
    });
    it('compiles the module', async () => {
        const moduleRef = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        expect(moduleRef).toBeDefined();
    });
});
//# sourceMappingURL=smoke.spec.js.map