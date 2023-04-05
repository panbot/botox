import botox from "../botox";
import { DemoApi } from "./demo-api";

@botox.module(
).apis([
    DemoApi,
])
export class DemoModule {
    async init() {
        console.log('demo module initialized');
    }
}