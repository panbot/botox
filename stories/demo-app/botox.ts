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
import { IncomingMessage, ServerResponse } from "http";
import method_decorator_tools from "@/lib/decorator-tools/method";
import expandify from "@/lib/expandify";
import metadata_registry from "@/lib/metadata-registry";

namespace botox {

    export const container = di();
    export const { inject } = container;

    export const aop = proxitive_aop_factory(p => container.on('instantiated', o => p(o)));

    export const { run, run_arg } = runnable(container.get, 'run');

    export const validatable = botox_validatable_factory();
    export const api_arg = botox_property_as_arg<API_ARG_OPTIONS>(validatable, o => o);
    export const api = botox_class_as_api(
        (api, options?: API_OPTIONS) => options ?? {}
    );

    export const route = create_route();

    export class Req extends IncomingMessage {}
    export class Res extends ServerResponse<IncomingMessage> {}

    export const module = botox_module_factory(
        (module, options?: MODULE_OPTIONS) => options ?? {},
    );

    export const tokens = {
        enabled_modules: container.create_token<CONSTRUCTOR<Module>[]>('enabled modules'),
    }
    type TOKENS = typeof tokens;

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
        api: Api,
        params?: any,
    ) {
        api_arg.for_each_arg(api, (p, arg) => {
            let input = params?.[p];
            if (input == null) {
                if (arg.optional) return;
                if (!arg.virtual) throw new Error(`${p.toString()} is required`);
            }

            const { parser, validator } = arg.validatable;
            let value = parser.call(api, input);
            let error = validator?.call(api, value);
            if (error) throw error;

            api[p] = value;
        });
        return run(api)
    }

    export interface Module {
        init?(): Promise<void>
    }

    export interface Api {
        run(...args: any): any
    }

    export function is_api(o: any): o is Api {
        return typeof o?.['run'] == 'function';
    }

    export type MODULE_OPTIONS = botox_framework_types.MODULE_OPTIONS & {
        apis?: CONSTRUCTOR<Api>[],
        routes?: CONSTRUCTOR[],
    }

    export type API_OPTIONS = botox_framework_types.API_OPTIONS & {
    }

    export type API_ARG_OPTIONS = botox_framework_types.API_ARG_OPTIONS & {
        optional?: true,
        virtual?: true,
    }

    export type ROUTE_OPTIONS = {
        route: `/${string}`,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD',
        content_type?: string,
        req_index?: number;
        res_index?: number;
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

function create_route() {
    const factory = method_decorator_tools();

    const route = factory.create(
        create_decorator => <
            T,
            P extends `${botox.ROUTE_OPTIONS["method"]} ${botox.ROUTE_OPTIONS["route"]}`,
            D,
        >(

        ) => create_decorator<T, P, D>(
            (ctx) => {
                let method: botox.ROUTE_OPTIONS["method"];
                let route : botox.ROUTE_OPTIONS["route"];

                [ method, route ] = ctx.property.split(' ', 2) as any;

                let options: botox.ROUTE_OPTIONS = {
                    method,
                    route,
                };

                ctx.design_types.parameters.forEach(
                    (v, i) => {
                        switch (v) {
                            case botox.Req: options.req_index = i; break;
                            case botox.Res: options.res_index = i; break;
                        }
                    }
                );

                return options;
            }
        ).as_setter<botox.ROUTE_OPTIONS>()
    );

    return route[expandify.expand]({

        for_each_route: (
            target: any,
            cb: (p: PropertyKey, options: botox.ROUTE_OPTIONS) => void,
        ) => factory.get_registry[metadata_registry.get_properties](target).for_each(
            (p, gr) => cb(p, gr().get()!)
        )
    })
}