import { CONSTRUCTOR } from "@/lib/types";
import botox from "../botox";
import { MapMap } from "@/lib/map-map";

@botox.container.service()
export class ApiLookup {

    private modules = new Map<string, CONSTRUCTOR<botox.Module>>();
    private apis = new MapMap<[
        module: string | CONSTRUCTOR<botox.Module>,
        api: string
    ], CONSTRUCTOR>();

    constructor(
        @botox.inject_token('enabled_modules')
        modules: CONSTRUCTOR<botox.Module>[],
    ) {
        modules.forEach(m => {
            this.modules.set(m.name, m);
            botox.module.get_options(m)?.apis?.forEach(api => {
                this.apis.set(m.name, api.name, api);
                this.apis.set(m     , api.name, api);
            })
        })
    }

    get_api(module: string | CONSTRUCTOR<botox.Module>, api: string) {
        return this.apis.get(module, api);
    }

    get_module(module: string) {
        return this.modules.get(module);
    }
}