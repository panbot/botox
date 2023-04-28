import mr from '../metadata-registry';
import { CONSTRUCTOR, P_OF_T, typram } from '../types';
import "reflect-metadata";

function parameter_decorator_tools<OPTIONS extends {}>(
    key: typram.Typram<OPTIONS>,
) {
    const get_registry = mr(typram<[ any, any ]>())(true)(typram<OPTIONS[]>());

    return {
        get_registry,
        create_decorator,
    }

    function create_decorator<
        T,
        P,
        I,
    >(
        init_options: (
            ctx: {
                target     : T,
                property   : P,
                index      : I,

                design_type: CONSTRUCTOR<any>,
            },
        ) => OPTIONS,
    ) {
        let cache: any = {};

        const decorator = (target: T, property: P, index: I) => {
            let list = get_registry(target, property).get_or_set(() => []);
            let options = list[index as any] = list[index as any] ?? init_options({
                target, property, index,
                design_type: Reflect.getOwnMetadata('design:paramtypes', target as any, property as any)[index],
            });
            Object.assign(options, cache);
        }

        return Object.assign(decorator, {
            as_setter: () => () => new Proxy(decorator, {
                get: (_t, p, r) => (v: any) => ( cache[p] = v, r )
            }) as parameter_decorator_tools.SETTER<T, P, I, OPTIONS>
        })
    }
}

namespace parameter_decorator_tools {
    export type DECORATOR<T, P, I> = (target: T, property: P, index: I) => void

    export type SETTER<T, P, I, OPTIONS> = DECORATOR<T, P, I> & {
        [ K in keyof Required<OPTIONS> ] :  <
                                                T1 extends T,
                                                P1 extends P,
                                                I1 extends I,
                                            >(
                                                value: Required<OPTIONS>[K]
                                            ) => SETTER<T1, P1, I1, OPTIONS>
    }


    type ARGS_OF_CONSTRUCTOR<T>
        = T extends abstract new (...args: infer U) => any
        ? U
        : never
    ;
    type ARGS_OF_METHOD<T>
        = T extends (...args: infer U) => any
        ? U
        : never
    ;
    export type TYPE<T, P, I> = P extends undefined
        ? P_OF_T<I, ARGS_OF_CONSTRUCTOR<T>>
        : P_OF_T<I, ARGS_OF_METHOD<P_OF_T<P, T>>>
    ;

}

export default parameter_decorator_tools