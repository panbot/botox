import botox from "./botox";
import { DemoModule } from "./demo-module/module";

const enabled_modules = [
    DemoModule,
];

botox.container.set(botox.tokens.enabled_modules, enabled_modules);

export default enabled_modules