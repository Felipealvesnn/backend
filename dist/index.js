"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const train_1 = __importDefault(require("./train"));
(0, train_1.default)();
const index_1 = __importDefault(require("./routers/index"));
const app = (0, express_1.default)();
const port = 3000;
app.use(index_1.default);
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map