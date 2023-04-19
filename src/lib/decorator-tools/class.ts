import expandify from '../expandify';
import mr from '../metadata-registry';
import { typram } from '../types';
import "reflect-metadata";

function class_decorator_tools() {
    const get_registry = mr(typram<[ any ]>())(true)(mr.create_key());

    return {
        get_registry,

        create: <T extends Object>(
            get_factory: (create_decorator: typeof decorator_factory) => T
        ) => expandify(get_factory(decorator_factory)),
    }

    function decorator_factory<T>(
        init_options: (
            ctx: {
                target: T,
            },
        ) => any,
    ) {
        let cache: any = {};

        const decorator = (target: T) => {
            let options = get_registry(target).get_or_set(init_options({
                target
            }));
            Object.assign(options, cache);
        }

        return expandify(decorator)[expandify.expand]({
            as_setter: <OPTIONS>() => new Proxy(decorator, {
                get: (_t, p, r) => (v: any) => ( cache[p] = v, r )
            }) as class_decorator_tools.DECORATOR_OPTION_SETTER<T, OPTIONS>
        })
    }
}

namespace class_decorator_tools {

    export type CLASS_DECORATOR<T> = (target: T) => void

    export type DECORATOR_OPTION_SETTER<T, OPTIONS> = CLASS_DECORATOR<T> & {
        [ K in keyof Required<OPTIONS> ] :  <
                                                T1 extends T,
                                            >(
                                                value: Required<OPTIONS>[K]
                                            ) => DECORATOR_OPTION_SETTER<T1, OPTIONS>
    }
}

export default class_decorator_tools