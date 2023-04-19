import botox from "../botox";
import { ApiGateway } from "./api-gateway.api";
import { DatabaseQueryApi } from "./database-query-api";
import { DemoApi } from "./demo-api";
import { VirtualArgApi } from "./virtual-arg.api";

@botox.module(
).apis([
    DemoApi,
    VirtualArgApi,
    DatabaseQueryApi,
]).routes([
    ApiGateway,
])
export class DemoModule {
    async init() {
        console.log('demo module initialized');
    }
}