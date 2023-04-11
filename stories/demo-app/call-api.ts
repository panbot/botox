import { init_modules } from "./bootstrap";
import { ApiLookup } from "./services/api-lookup";
import botox from "./botox";
import { CONSTRUCTOR } from "@/lib/types";

class CallApi {

    @botox.api_arg().virtual(true).validatable({
        parser: () => {
            const module = botox.container.get(ApiLookup).get_module(
                process.argv[2] || '',
            );
            if (!module) throw new Error('module not found');

            return module;
        }
    })
    module: CONSTRUCTOR<botox.Module>;

    @botox.api_arg().virtual(true).validatable({
        parser() {
            const api = botox.container.get(ApiLookup).get_api(
                this.module,
                process.argv[3] || ''
            );
            if (!api) throw new Error('api not found');

            return api;
        }
    })
    api: CONSTRUCTOR<botox.Api>;

    @botox.api_arg().virtual(true).validatable({
        parser: () => JSON.parse(process.argv[4] || '{}')
    })
    params: any;

    async run() {
        await init_modules([ this.module ]);
        return botox.invoke_api(this.api, this.params);
    }
}

botox.invoke_api(CallApi).catch(e => console.error(e));