import di from "@/dependency-injection";
import runnable from "@/runnable";
import { CONSTRUCTOR, P_OF_T } from "@/types";
import logging from '@/logging';
import aop_factory from "@/aop/factory";
import proxitive_aop_factory from "@/aop/proxitive";
import { IncomingMessage, ServerResponse } from "http";
import metadata_registry from "@/metadata-registry";
import decorator_tools from "@/decorator-tools";
import property_decorator_tools from "@/decorator-tools/property";
import validatable_factory from "@/validatable";
import framework from '@/framework';

namespace botox {

    export const container = di();
    export const { inject } = container;

    export const aop = proxitive_aop_factory(p => container.on('instantiated', o => p(o)));

    export const { run, run_arg } = runnable(container.get, 'run');

    export const validatable = validatable_factory();
    export const api_arg = create_api_arg(validatable["get_options!"]);
    export const api = create_api();
    export const route = create_route();

    export class Req extends IncomingMessage {}
    export class Res extends ServerResponse<IncomingMessage> {}

    export const module = create_module();

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

    export type MODULE_OPTIONS = {
        apis?: CONSTRUCTOR<Api>[],
        routes?: CONSTRUCTOR[],
        dependencies?: () => CONSTRUCTOR<Module>[],
    }

    export type API_OPTIONS = {
    }

    export type API_ARG_OPTIONS<T> = {
        validatable: validatable_factory.OPTIONS<T>,
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
    const tools = decorator_tools.method_tools(decorator_tools.create_key<botox.ROUTE_OPTIONS>());

    const route = <
        T,
        P extends `${botox.ROUTE_OPTIONS["method"]} ${botox.ROUTE_OPTIONS["route"]}`,
        D,
    >(

    ) => tools.create_decorator<T, P, D>(
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
    ).as_setter();

    return Object.assign(route, {

        for_each_route: (
            target: any,
            cb: (p: PropertyKey, options: botox.ROUTE_OPTIONS) => void,
        ) => tools.get_registry[metadata_registry.get_properties](target).for_each(
            (p, gr) => cb(p, gr().get()!)
        )
    })
}

function create_api() {
    const tools = decorator_tools.class_tools(decorator_tools.create_key<botox.API_OPTIONS>());
    const api = <T extends botox.Api>() => tools.create_decorator<CONSTRUCTOR<T>>(() => ({}))
    return Object.assign(api, {
        get_options: (api: CONSTRUCTOR<botox.Api>) => tools.get_registry(api).get_own(),
    })
}

function create_api_arg(
    get_validatable_options: (type: any) => validatable_factory.OPTIONS<any>,
) {
    const tools = decorator_tools.property_tools(decorator_tools.create_key<botox.API_ARG_OPTIONS<unknown>>());

    const api_arg = <
        T extends botox.Api,
        P,
    >(
    ) => tools.create_decorator<T, P>(
        (ctx) => {
            return {
                validatable: get_validatable_options(ctx.design_type),
            }
        }
    ).as_setter() as SETTER<T, P>;

    type SETTER<T, P> = property_decorator_tools.DECORATOR<T, P> & {
        [ K in keyof Required<botox.API_ARG_OPTIONS<unknown>> ] :
            <
                T1 extends T,
                P1 extends P,
                V1 extends P_OF_T<P1, T1>,
            >(
                value: botox.API_ARG_OPTIONS<V1>[K] & ThisType<T1>
            ) => SETTER<T1, P1>
    }

    return Object.assign(api_arg, {
        for_each_arg: <
            T extends botox.Api,
            P extends keyof T,
        >(
            api: botox.Api,
            callback: (p: P, options: botox.API_ARG_OPTIONS<any>) => void,
        ) => tools.get_registry[metadata_registry.get_properties](api).for_each(
            (p, gr) => callback(p, gr().get()!)
        )
    })
}

function create_module() {
    const tools = decorator_tools.class_tools(
        decorator_tools.create_key<botox.MODULE_OPTIONS>(),
    );

    const module = <T>() => tools.create_decorator<T>(() => ({})).as_setter();

    return Object.assign(module, {

        get_options: (module: CONSTRUCTOR<botox.Module>) => tools.get_registry(module).get_own(),

        resolve_dependencies(modules: CONSTRUCTOR<botox.Module>[]) {
            return framework.resolve_dependencies(
                modules,
                m => this.get_options(m)?.dependencies?.()
            )
        }
    })
}