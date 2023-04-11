import { init_modules } from "./bootstrap";
import { ApiLookup } from "./services/api-lookup";
import botox from "./botox";
import { CONSTRUCTOR } from "@/lib/types";

class CallApi {

    @botox.inject_token('enabled_modules')
    modules: CONSTRUCTOR<botox.Module>[];

    @botox.api_arg().virtual(true).validatable({
        parser() {
            const module = botox.container.get(ApiLookup).get_module(
                process.argv[2] || '',
            );
            if (!module) {
                console.log(`module "${process.argv[2]}" not found`);

                console.log('available modules:');
                for (let m of this.modules) {
                    console.log('\t' + m.name)
                }
                process.exit(1);
            }

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
            if (!api) {
                console.log(`api "${process.argv[3]}" not found`);
                console.log('available apis:');
                for (let a of botox.module.get_options(this.module)?.apis || []) {
                    console.log('\t' + a.name);
                }
                process.exit(2);
            }

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