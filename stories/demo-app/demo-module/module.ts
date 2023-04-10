import botox from "../botox";
import { DemoApi } from "./demo-api";
import { VirtualArgApi } from "./virtual-arg.api";

@botox.module(
).apis([
    DemoApi,
    VirtualArgApi,
])
export class DemoModule {
    async init() {
        console.log('demo module initialized');
    }
}