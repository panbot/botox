import botox from "../botox";
import { ApiGateway } from "./api-gateway.api";
import authApis from "./auth.apis";
import { DatabaseQueryApi } from "./database-query-api";
import { DemoApi } from "./demo-api";
import purchaseApis from "./purchase.apis";
import { RunArgFactoryApiArgDemo } from "./run-arg-factory-api-arg.api";
import { VirtualArgApi } from "./virtual-arg.api";

@botox.module(
).apis([
    DemoApi,
    VirtualArgApi,
    DatabaseQueryApi,
    RunArgFactoryApiArgDemo,

    ...purchaseApis,
    ...authApis,
]).routes([
    ApiGateway,
])
export class DemoModule {
    async init() {
        console.log('demo module initialized');
    }
}