import botox_property_as_arg from "@/framework/api-arg/property-as-arg";
import botox_class_as_api from "@/framework/api/class-as-api";
import botox_module_factory from "@/framework/module";
import botox_framework_types from "@/framework/types";
import botox_validatable_factory from "@/framework/validatable";
import dependency_injection from "@/lib/dependency-injection";
import runnable from "@/lib/runnable";
import { CONSTRUCTOR } from "@/lib/types";

namespace botox {

    export const container = dependency_injection();

    export const { run, run_arg } = runnable(container.get);

    export const validatable = botox_validatable_factory();
    export const api_arg = botox_property_as_arg(validatable);
    export const api = botox_class_as_api(
        (api, options?: API_OPTIONS) => options || {}
    );
    export const module = botox_module_factory(
        (module, options?: MODULE_OPTIONS) => options || {},
    );

    export const tokens = {
        enabled_modules: container.create_token<CONSTRUCTOR<Module>[]>('enabled modules'),
    }
    type TOKENS = typeof tokens;

    export const { inject } = container
    export const inject_token = <
        T,
        P extends dependency_injection.P_EXTENDS<T>,
        I extends dependency_injection.I_EXTENDS<P>,
        N extends keyof {
            [ K in keyof TOKENS as
                TOKENS[K] extends dependency_injection.Token<infer U>
                    ? U extends dependency_injection.TYPE<T, P, I>
                    ? K
                    : never
                    : never
            ]: any
        } & keyof TOKENS
    >(
        token: N
    ) => container.create_inject<T, P, I>(
        get => get(tokens[token] as any)
    )

    export function invoke_api(
        api: CONSTRUCTOR<runnable.Runnable>,
        params?: any,
    ) {
        let instance = container.instantiate(api);
        api_arg.for_each_arg(instance, (p, arg) => {
            let input = params?.[p];
            if (input == null && arg.optional) return;

            const { parser, validator } = arg.validatable;
            let value = parser.call(instance, input);
            let error = validator?.call(instance, value);
            if (error) throw error;

            instance[p] = value;
        });
        return run(instance)
    }

    export interface Module {
        init?(): Promise<void>
    }

    export type MODULE_OPTIONS = botox_framework_types.MODULE_OPTIONS & {

    }

    export type API_OPTIONS = botox_framework_types.API_OPTIONS & {

    }

    export type API_ARG_OPTIONS = botox_framework_types.API_ARG_OPTIONS & {

    }
}

export default botox;