import decorator from "../lib/decorator";
import expandify from "../lib/expandify";
import { CONSTRUCTOR, INSTANTIATOR } from "../lib/types";
import { parameter_as_arg, property_as_arg } from "./api-arg";
import validatable from "./validatable";
import types from './types';

import OPTIONS = types.API_OPTIONS;

export namespace class_as_api {

    export const factory = (
        register: (api: CONSTRUCTOR<any>) => void,
        instantiate: INSTANTIATOR,
        invoke: (api: any) => any,
        api_arg: property_as_arg.API_ARG,
        validatable: validatable.VALIDATABLE,
    ) => decorator.create_class_decorator({
        init_by: (
            ctx,
            options?: OPTIONS
        ) => {
            register(ctx.args[0]);
            return options || {} satisfies OPTIONS;
        }
    })[expandify.expand]({

        invoke: <API>(
            api: CONSTRUCTOR<API>,
            parameters: any,
        ) => {
            let instance = instantiate(api);
            api_arg.for_each_arg(
                instance,
                (p, arg) => instance[p as keyof API] = validatable.validate(
                    parameters?.[p],
                    arg.validatable || error('not validatable')
                )
            );

            return invoke(instance);
        }
    })
}

type METHODS<O> = keyof {
    [ P in keyof O as O[P] extends (...args: any) => any ? P : never ] : any
}

type _ = METHODS<{
    a(): void
    b: () => {},
    c: string,
    d: number
}>

declare function invoke<API>(api: API): <K extends keyof API>(method: K) => API[K] extends (args: any) => any ? ReturnType<API[K]> : never;

let r = invoke({
    a() {},
    b: () => 5,
    c: 'str',
    d: 4,
})('b')



export namespace method_as_api {
    export function factory(
        register: (api: CONSTRUCTOR<any>, method: PropertyKey) => void,
        instantiate: INSTANTIATOR,
        invoke: (api: any, method: PropertyKey) => any,
        api_arg: parameter_as_arg.API_ARG,
        validatable: validatable.VALIDATABLE,
    ) {
        return decorator.create_method_decorator.instance({
            init_by: (
                ctx,
                options?: OPTIONS
            ) => {
                register(ctx.args[0].constructor, ctx.args[1]);
                return options || {} satisfies OPTIONS;
            },
            target: decorator.target<any>(),
        })[expandify.expand]({

            invoke: <API>(
                api: CONSTRUCTOR<API>,
                property: PropertyKey,
                parameters: any,
            ) => {
                let instance = instantiate(api);
                let args: any[] = [];
                api_arg.for_each_arg(
                    instance,
                    property,
                    (i, arg) => {
                        args[i] = validatable.validate(
                            parameters?.[i],
                            arg.validatable || error('not validatable')
                        )
                    }
                );

                return invoke(instance, property);
            }
        })
    }
}

function error(msg: string): never {
    throw new Error(msg);
}