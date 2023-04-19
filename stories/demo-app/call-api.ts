import { init_modules } from "./bootstrap";
import { ApiLookup } from "./services/api-lookup";
import botox from "./botox";
import { CONSTRUCTOR } from "@/lib/types";
import { RequestContext } from "./services/request-context";

export default class {

    @botox.inject_token('enabled_modules')
    modules: CONSTRUCTOR<botox.Module>[];

    @botox.api_arg().virtual(true).validatable({
        parser() {
            let module_name = process.argv[3] ?? this.usage();

            const module = botox.container.get(ApiLookup).get_module(module_name);
            if (!module) this.usage(`module "${module_name}" not found`);

            return module;
        }
    })
    module: CONSTRUCTOR<botox.Module>;

    @botox.api_arg().virtual(true).validatable({
        parser() {
            let api_name = process.argv[4] ?? this.usage();

            const api = botox.container.get(ApiLookup).get_api(
                this.module,
                api_name
            );
            if (!api) this.usage(`api "${api_name}" not found`);

            return api;
        }
    })
    api: CONSTRUCTOR<botox.Api>;

    @botox.api_arg().virtual(true).validatable({
        parser() {
            let params = JSON.parse(process.argv[5] ?? '{}');
            params[RequestContext.context] = new RequestContext();

            return params;
        }
    })
    params: any;

    async run() {
        await init_modules([ this.module ]);
        return botox.invoke_api(botox.container.instantiate(this.api), this.params);
    }

    private usage(message?: string): never {
        message && console.error('\n' + message + '\n');

        if (!this.module) {
            console.log('available modules:');
            for (let m of this.modules) {
                console.log('\t' + m.name)
            }
        }

        if (this.module && !this.api) {
            console.log('available apis:');
            for (let a of botox.module.get_options(this.module)?.apis ?? []) {
                console.log('\t' + a.name);
            }
        }

        console.error('usage: <module> <api>');
        process.exit(1);
    }
}
