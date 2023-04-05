import botox_property_as_arg from "@/framework/api-arg/property-as-arg";
import botox_class_as_api from "@/framework/api/class-as-api";
import botox_module_factory from "@/framework/module";
import botox_validatable_factory from "@/framework/validatable";
import dependency_injection from "@/lib/dependency-injection";
import runnable from "@/lib/runnable";
import { CONSTRUCTOR } from "@/lib/types";


namespace botox {

    export interface Module {
        init?: () => Promise<void>
    }

    export interface Api {

    }

    export const container = dependency_injection();

    export const { run, run_arg } = runnable(container.get);

    export const module_lookup = new Map<string, CONSTRUCTOR<Module>>();
    export const api_lookup = new Map<string, CONSTRUCTOR<any>>();

    export const validatable = botox_validatable_factory();
    export const api_arg = botox_property_as_arg(validatable);
    export const api = botox_class_as_api(
        api => void api_lookup.set(api.name, api),
        container.get,
        run,
        api_arg,
        validatable
    );
    export const module = botox_module_factory(
        (module: CONSTRUCTOR<Module>) => void module_lookup.set(module.name, module),
    );

    export const tokens = {
        enabled_modules: container.create_token<CONSTRUCTOR<Module>[]>('enabled modules'),
    }

    export const { inject } = container
    export const inject_token = (
        token: keyof typeof tokens
    ) => container.create_inject(
        get => get(tokens[token])
    )
}

export default botox;