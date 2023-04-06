import { init_modules } from "./bootstrap";
import runnable from "@/lib/runnable";
import { ApiLookup } from "./services/api-lookup";
import botox from "./botox";
import { CONSTRUCTOR } from "@/lib/types";

class CallApi implements runnable.Runnable {

    @botox.api_arg().validatable({
        parser: () => {
            const module = botox.container.get(ApiLookup).get_module(
                process.argv[2] || '',
            );
            if (!module) throw new Error('module not found');

            return module;
        }
    })
    module: CONSTRUCTOR<botox.Api>;

    @botox.api_arg().validatable({
        parser: (_, ctx) => {
            const api = botox.container.get(ApiLookup).get_api(
                ctx.module,
                process.argv[3] || ''
            );
            if (!api) throw new Error('api not found');

            return api;
        }
    })
    api: CONSTRUCTOR<botox.Api>;

    @botox.api_arg().validatable({
        parser: () => JSON.parse(process.argv[4] || '{}')
    })
    params: any;

    async [runnable.run]() {
        await init_modules([ this.module ]);
        return botox.api.invoke(this.api, this.params);
    }
}

botox.api.invoke(CallApi).catch(e => console.error(e));