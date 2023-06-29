import di from "@/dependency-injection";
import runnable from "@/runnable";
import { CONSTRUCTOR, FALSY, MAYBE, P_OF_T } from "@/types";
import logging from '@/logging';
import aop_factory from "@/aop/factory";
import proxitive_aop_factory from "@/aop/proxitive";
import { IncomingMessage, ServerResponse } from "http";
import metadata_registry from "@/metadata-registry";
import decorator_tools from "@/decorator-tools";
import property_decorator_tools from "@/decorator-tools/property";
import jwt_factory from './services/jwt';
import { isPromise } from "util/types";
import { inspect } from "node:util";

namespace botox {

    export const container = di();
    export const { inject } = container;

    export const aop = proxitive_aop_factory(p => container.on('instantiated', o => p(o)));

    export const { run, run_arg } = runnable(container.get, 'run');

    export const validatable = create_validatable();
    validatable["set options for built-in types"]();
    export const api_arg = create_api_arg(validatable["get_options!"]);
    export const api = create_api();
    export const route = create_route();

    export const Req = IncomingMessage;
    export type  Req = IncomingMessage;
    export const Res = ServerResponse<IncomingMessage>;
    export type  Res = ServerResponse<IncomingMessage>;

    export const jsonable = create_jsonable()

    export const module = create_module();

    export type APP_PARAMETERS = {
        secret: string,
    }

    export const tokens = {
        enabled_modules : container.create_token<CONSTRUCTOR<Module>[]>('enabled modules'),
        jwt_factory     : container.create_token<(salt: string) => { encode: (v: any) => string, decode: (v: string) => any }>('jwt factory'),
        parameters      : container.create_token<APP_PARAMETERS>('app parameters'),
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

    export async function invoke_api<T extends Api>(
        api: T,
        params?: any,
    ) {
        let errors = new Map<keyof T, string>();
        let args = new Map<keyof T, botox.API_ARG_OPTIONS<any>>();

        api_arg.for_each_arg(api, async (p, arg) => args.set(p, arg));

        for (let [ p, arg ] of args.entries()) {
            try {
                let input = params?.[p];
                if (input == null) {
                    if (arg.optional) return;
                    if (!arg.virtual) throw `${p.toString()} is required`;
                }

                const { parser, validator } = arg.validatable;
                let value = await parser.call(api, input);
                let error = await validator?.call(api, value);
                if (error) throw error;

                api[p] = value;
            } catch (e: any) {
                errors.set(p, e.message ?? e);
            }
        }

        if (errors.size) throw new ArgumentError(
            'argument validataion error',
            {
                cause: {
                    code: 'ARGUMENT_VALIDATION_ERROR',
                    errors: [ ...errors.entries() ].reduce(
                        (pv, cv) => ( pv[cv[0].toString()] = cv[1], pv ),
                        {} as any,
                    )
                }
            }
        )

        return run(api);
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
        doc?: string,
        apis?: CONSTRUCTOR<Api>[],
        routes?: CONSTRUCTOR[],
        dependencies?: () => CONSTRUCTOR<Module>[],
    }

    export type API_OPTIONS = {
        doc?: string,
        roles: number,
    }

    export type API_ARG_OPTIONS<T> = {
        doc?: string,
        validatable: botox.VALIDATABLE_OPTIONS<T>,
        optional?: true,
        virtual?: true,
        inputype?: string,
    }

    export type ROUTE_OPTIONS = {
        route: `/${string}`,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD',
        content_type?: string,
    }

    type MAYBE_PROMISE<T> = T | Promise<T>
    export type VALIDATABLE_OPTIONS<T> = {
        parser: (input: unknown) => MAYBE_PROMISE<T>
        validator?: (parsed: T) => MAYBE_PROMISE<string | FALSY>
    }

    export namespace logging {
        const logging = logging_factory(0, aop.after);

        export const loggers = logging.loggers;
        export const decorators = logging.decorators;
    }

    export class ArgumentError extends Error {
    }

    export const jwt = jwt_factory('change this', 'sha256');

    export function create_run_arg_factory_api_arg() {
        const tools = decorator_tools.property_tools(
            decorator_tools.create_key<{}>(),
        );

        let decorator = <
            T extends botox.Api,
            P,
        >() => tools.create_decorator<T, P>(() => ({}));

        return Object.assign(decorator, {
            get_value: (runnable: any) => {
                let property: any;
                tools.get_registry[metadata_registry.get_properties](runnable).for_each(
                    p => {
                        if (property != null) throw new Error(`already defined`);
                        property = p;
                    }
                );
                if (property == null) throw new Error(`not defined`);

                return runnable[property];
            }
        })
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
        D extends (
            res: botox.Res,
            req: botox.Req,
        ) => void,
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
    const api = <T extends botox.Api>(
        roles = 0,
    ) => tools.create_decorator<CONSTRUCTOR<T>>(
        () => ({
            roles,
        })
    )
    return Object.assign(api, {
        get_options: (api: CONSTRUCTOR<botox.Api>) => tools.get_registry(api).get_own(),
    })
}

function create_api_arg(
    get_validatable_options: (type: any) => botox.VALIDATABLE_OPTIONS<any>,
) {
    const tools = decorator_tools.property_tools(decorator_tools.create_key<botox.API_ARG_OPTIONS<unknown>>());

    const api_arg = <
        T extends botox.Api,
        P,
    >(
    ) => tools.create_decorator<T, P>(
        (ctx) => {
            return {
                inputype: ctx.design_type.name.toLowerCase(),
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
        for_each_arg: async <
            T extends botox.Api,
            P extends keyof T,
        >(
            api: botox.Api,
            callback: (p: P, options: botox.API_ARG_OPTIONS<any>) => void,
        ) => tools.get_registry[metadata_registry.get_properties](api).for_each(
            (p, gr) => callback(p, gr().get()!)
        ),
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
            type T = CONSTRUCTOR<botox.Module>;

            let visited = new Set<T>();
            let sorted: T[] = [];

            const visit = (
                module: T,
                path = new Set<T>()
            ) => {
                if (visited.has(module)) return;

                if (path.has(module)) throw new Error(`circular dependency`, { cause: {
                    path: [ ...path, module ].map(v => inspect(v, false, 0)).join(' -> ')
                }});
                path.add(module);

                this.get_options(module)?.dependencies?.().forEach(
                    dep => visit(dep, new Set<T>(path))
                );

                sorted.push(module);
                visited.add(module);
            }

            modules.forEach(m => visit(m));

            return sorted;
        }
    })
}

function create_jsonable() {
    const tools = decorator_tools.class_tools(
        decorator_tools.create_key<{ serialize: (o: any) => string | Promise<string> }>(),
    );

    const jsonable = <T>(
        serialize: (o: any) => string | Promise<string>
    ) => tools.create_decorator<T>(() => ({ serialize }))

    return Object.assign(jsonable, {
        stringify: async (o: any) => {
            if (o == null) return 'null';

            let promises: Promise<any>[] = [];

            let string = JSON.stringify(
                o,
                function (k, v) {
                    let p = ( v?.constructor && tools.get_registry(v.constructor).get()?.serialize(v) ) ?? v;
                    if (!isPromise(p)) return p;

                    promises.push(p.then(v => this[k] = v));
                    return undefined;
                }
            );

            if (!promises.length) return string;

            await Promise.all(promises);

            return JSON.stringify(o)
        }
    })
}

function create_validatable() {
    type OPTIONS<T> = botox.VALIDATABLE_OPTIONS<T>;
    const tools = decorator_tools.class_tools(decorator_tools.create_key<OPTIONS<any>>());

    let validatable = <T>(
        parser     : OPTIONS<INSTANCE<T>>["parser"],
        validator? : OPTIONS<INSTANCE<T>>["validator"],
    ) => tools.create_decorator<T>(
        (): OPTIONS<INSTANCE<T>> => ({
            parser,
            validator,
        })
    );

    const set_options = <T>(
        type: T,
        options: OPTIONS<INSTANCE<T>>,
    ) => tools.get_registry(type).set(options);

    return Object.assign(validatable, {

        get_options: <T>(type: T): MAYBE<OPTIONS<INSTANCE<T>>> => tools.get_registry(type).get(),

        "get_options!": <T>(type: T): OPTIONS<INSTANCE<T>> => {
            let options = tools.get_registry(type).get();
            if (!options) options = { parser: () => { throw new Error('not validatable') } }
            return options;
        },

        set_options,

        assert_instance_of: <T>(v: unknown, type: CONSTRUCTOR<T>, error?: string): T => {
            if (v instanceof type) return v;
            throw new Error(error ?? `${type.name} required`);
        },

        "set options for built-in types": () => {

            set_options(String, { parser: String });

            set_options(Boolean, { parser: Boolean });

            set_options(Number, {
                parser: Number,
                validator: parsed => isNaN(parsed)  ? 'not a number'
                                                    : undefined,
            });

            set_options(Date, {
                parser: input => {
                    if (input instanceof Date) return input;

                    switch (typeof input) {
                        case 'string': case 'number': return new Date(input);
                    }

                    return new Date(`Invalid Date`);
                },
                validator: parsed => parsed.toString() == 'Invalid Date' && "Invalid Date",
            });

            set_options(URL, { parser: input => new URL(`${input}`) });
        },
    });

    type INSTANCE<T>
        = T extends StringConstructor
        ? string
        : T extends NumberConstructor
        ? number
        : T extends BooleanConstructor
        ? boolean
        : T extends abstract new (...args: any) => infer U
        ? U
        : never
    ;

}
