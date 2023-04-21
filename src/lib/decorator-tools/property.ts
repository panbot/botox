import mr from '../metadata-registry';
import { typram } from '../types';
import "reflect-metadata";

function property_decorator_tools<OPTIONS extends {}>(
    key: typram.Typram<OPTIONS>,
) {
    const get_registry = mr(typram<[ any, any ]>())(true)(key);

    return {
        get_registry,
        create_decorator,
    }

    function create_decorator<T, P>(
        init_options: (
            ctx: {
                target     : T,
                property   : P,

                design_type: any,
            },
        ) => OPTIONS,
    ) {
        let cache: any = {};

        const decorator = (target: T, property: P) => {
            let options = get_registry(target, property).get_or_set(init_options({
                target, property,
                design_type: Reflect.getOwnMetadata('design:type', target as any, property as any),
            }));
            Object.assign(options, cache);
        }

        return Object.assign(decorator, {
            as_setter: () => new Proxy(decorator, {
                get: (_t, p, r) => (v: any) => ( cache[p] = v, r )
            }) as property_decorator_tools.SETTER<T, P, OPTIONS>
        })
    }
}

namespace property_decorator_tools {

    export type DECORATOR<T, P> = (target: T, property: P) => void

    export type SETTER<T, P, OPTIONS> = DECORATOR<T, P> & {
        [ K in keyof Required<OPTIONS> ] :  <
                                                T1 extends T,
                                                P1 extends P,
                                            >(
                                                value: Required<OPTIONS>[K]
                                            ) => SETTER<T1, P1, OPTIONS>
    }
}

export default property_decorator_tools