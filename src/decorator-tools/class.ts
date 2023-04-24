import mr from '../metadata-registry';
import { typram } from '../types';
import "reflect-metadata";

function class_decorator_tools<OPTIONS extends {}>(
    key: typram.Typram<OPTIONS>,
) {
    const get_registry = mr(typram<[ any ]>())(false)(key);

    return {
        get_registry,
        create_decorator,
    }

    function create_decorator<T>(
        init_options: (
            ctx: {
                target: T,
            },
        ) => OPTIONS,
    ) {
        let cache: any = {};

        const decorator = (target: T) => {
            let options = get_registry(target).get_or_set(init_options({
                target
            }) as any);
            Object.assign(options, cache);
        }

        return Object.assign(decorator, {
            as_setter: () => new Proxy(decorator, {
                get: (_t, p, r) => (v: any) => ( cache[p] = v, r )
            }) as class_decorator_tools.SETTER<T, OPTIONS>
        })
    }
}

namespace class_decorator_tools {

    export type DECORATOR<T> = (target: T) => void

    export type SETTER<T, OPTIONS> = DECORATOR<T> & {
        [ K in keyof Required<OPTIONS> ] :  <
                                                T1 extends T,
                                            >(
                                                value: Required<OPTIONS>[K]
                                            ) => SETTER<T1, OPTIONS>
    }
}

export default class_decorator_tools