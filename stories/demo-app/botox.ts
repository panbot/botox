import botox_property_as_arg from "@/framework/api-arg/property-as-arg";
import botox_class_as_api from "@/framework/api/class-as-api";
import botox_module_factory from "@/framework/module";
import botox_framework_types from "@/framework/types";
import botox_validatable_factory from "@/framework/validatable";
import di from "@/lib/dependency-injection";
import runnable from "@/lib/runnable";
import { CONSTRUCTOR } from "@/lib/types";
import logging from '@/lib/logging';
import aop_factory from "@/lib/aop/factory";
import proxitive_aop_factory from "@/lib/aop/proxitive";

namespace botox {

    export const container = di();

    export const aop = proxitive_aop_factory(p => container.on('instantiated', o => p(o)));

    export const { run, run_arg } = runnable(container.get, 'run');

    export const validatable = botox_validatable_factory();
    export const api_arg = botox_property_as_arg<API_ARG_OPTIONS>(validatable, base => base);
    export const api = botox_class_as_api(
        (api, options?: API_OPTIONS) => options ?? {}
    );
    export const module = botox_module_factory(
        (module, options?: MODULE_OPTIONS) => options ?? {},
    );

    export const tokens = {
        enabled_modules: container.create_token<CONSTRUCTOR<Module>[]>('enabled modules'),
    }
    type TOKENS = typeof tokens;

    export const { inject } = container;
    export const inject_token = <
        T,
        P extends di.P_EXTENDS<T>,
        I extends di.I_EXTENDS<P>,
        N extends keyof {
            [ K in keyof TOKENS as
                TOKENS[K] extends di.Token<infer U>
                    ? U extends di.TYPE<T, P, I>
                    ? K
                    : never
                    : never
            ]: any
        } & keyof TOKENS
    >(
        token: N
    ) => container.create_inject<T, P, I>(
        get => get(tokens[token] as any)
    );

    export function invoke_api(
        api: CONSTRUCTOR<Api>,
        params?: any,
    ) {
        let instance = container.instantiate(api);
        api_arg.for_each_arg(instance, (p, arg) => {
            let input = params?.[p];
            if (input == null) {
                if (arg.optional) return;
                if (!arg.virtual) throw new Error(`${p} is required`);
            }

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

    export interface Api {
        run(...args: any): Promise<any>
    }

    export type MODULE_OPTIONS = botox_framework_types.MODULE_OPTIONS & {

    }

    export type API_OPTIONS = botox_framework_types.API_OPTIONS & {
        route?: string,
    }

    export type API_ARG_OPTIONS = botox_framework_types.API_ARG_OPTIONS & {
        optional?: true,
        virtual?: true,
    }

    export namespace logging {
        const logging = logging_factory(0, aop.after);

        export const loggers = logging.loggers;
        export const decorators = logging.decorators;
    }
}

export default botox;

function logging_factory(
    level: logging.LEVEL,
    after: aop_factory.AOP["after"],
) {

    const levels = {
        debug : 0,
        info  : 1,
        warn  : 2,
        crit  : 3,
        log   : 4,
    };

    const base_loggers = {
        debug : (...args: any) => console.log  ('debug' , ...args),
        info  : (...args: any) => console.log  ('info'  , ...args),
        warn  : (...args: any) => console.error('warn'  , ...args),
        crit  : (...args: any) => console.error('crit'  , ...args),
        log   : (...args: any) => console.log  ('log'   , ...args),
    };

    const loggers = logging.create_loggers(levels, base_loggers, level);

    const decorators = logging.create_decorators(after, levels, base_loggers, level);

    return { loggers, decorators }
}