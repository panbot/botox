import expandify from '../expandify';
import mr from '../metadata-registry';
import { typram } from '../types';
import "reflect-metadata";

function method_decorator_tools() {
    const get_registry = mr(typram<[ any, any ]>())(true)(mr.create_key());

    return {
        get_registry,

        create: <T extends Object>(
            get_factory: (create_decorator: typeof decorator_factory) => T
        ) => expandify(get_factory(decorator_factory)),
    }

    function decorator_factory<T, P, D>(
        init_options: (
            ctx: {
                target     : T,
                property   : P,
                descriptor : TypedPropertyDescriptor<D>,

                design_types: {
                    parameters : any[],
                    return     : any
                    type       : any,
                },
            },
        ) => any,
    ) {
        let cache: any = {};

        const decorator = (target: T, property: P, descriptor: TypedPropertyDescriptor<D>) => {
            let options = get_registry(target, property).get_or_set(init_options({
                target, property, descriptor,
                design_types: {
                    parameters : Reflect.getOwnMetadata('design:paramtypes', target as any, property as any),
                    return     : Reflect.getOwnMetadata('design:returntype', target as any, property as any),
                    type       : Reflect.getOwnMetadata('design:type',       target as any, property as any),
                }
            }));
            Object.assign(options, cache);
        }

        return expandify(decorator)[expandify.expand]({
            as_setter: <OPTIONS>() => new Proxy(decorator, {
                get: (_t, p, r) => (v: any) => ( cache[p] = v, r )
            }) as method_decorator_tools.DECORATOR_OPTION_SETTER<T, P, D, OPTIONS>
        })
    }
}

namespace method_decorator_tools {

    export type METHOD_DECORATOR<T, P, D> = (target: T, property: P, descriptor: TypedPropertyDescriptor<D>) => void

    export type DECORATOR_OPTION_SETTER<T, P, D, OPTIONS> = METHOD_DECORATOR<T, P, D> & {
        [ K in keyof Required<OPTIONS> ] :  <
                                                T1 extends T,
                                                P1 extends P,
                                                D1 extends D,
                                            >(
                                                value: Required<OPTIONS>[K]
                                            ) => DECORATOR_OPTION_SETTER<T1, P1, D1, OPTIONS>
    }
}

export default method_decorator_tools