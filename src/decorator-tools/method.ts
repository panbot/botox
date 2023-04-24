import mr from '../metadata-registry';
import { typram } from '../types';
import "reflect-metadata";

function method_decorator_tools<OPTIONS extends {}>(
    key: typram.Typram<OPTIONS>,
) {
    const get_registry = mr(typram<[ any, any ]>())(true)(key);

    return {
        get_registry,
        create_decorator,
    }

    function create_decorator<T, P, D>(
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
        ) => OPTIONS,
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

        return Object.assign(decorator, {
            as_setter: () => new Proxy(decorator, {
                get: (_t, p, r) => (v: any) => ( cache[p] = v, r )
            }) as method_decorator_tools.SETTER<T, P, D, OPTIONS>
        })
    }
}

namespace method_decorator_tools {

    export type DECORATOR<T, P, D> = (target: T, property: P, descriptor: TypedPropertyDescriptor<D>) => void

    export type SETTER<T, P, D, OPTIONS> = DECORATOR<T, P, D> & {
        [ K in keyof Required<OPTIONS> ] :  <
                                                T1 extends T,
                                                P1 extends P,
                                                D1 extends D,
                                            >(
                                                value: Required<OPTIONS>[K]
                                            ) => SETTER<T1, P1, D1, OPTIONS>
    }
}

export default method_decorator_tools