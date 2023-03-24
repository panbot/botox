import { metadata_registry_factory as mrf } from "./metadata-registry-factory";
import assert from "assert";
import expandify from "./expandify";
import { IS_EQUAL, REMOVE_HEAD, typram } from "./types";

export type DECORATOR<D, T> = D & Required<{
    [ P in keyof NON_READONLY<T> ]: (v: T[P]) => DECORATOR<D, T>
}>;

type ARGS<T extends DECORATOR_TYPE> = Parameters<DECORATORS[T]>
type REPLACE_HEAD<LIST, HEAD> = [ HEAD, ...REMOVE_HEAD<LIST> ]
type ARG0<TARGET> = TARGET;

const create = <
    DT extends DECORATOR_TYPE,
    TARGET_AS,
>(
    decorator_type: DT,
    set: <T>(
        args: ARGS<DT>,
        get_registry: REGISTRY_SIGNATURES<T>[DT],
        value: T
    ) => void,
    target_as?: typram.Param<TARGET_AS>,
) => <OPTIONS extends {}, TARGET>(
    init_by: (...args: REPLACE_HEAD<ARGS<DT>, ARG0<TARGET>>) => OPTIONS,
    target?: typram.Param<TARGET>,
) => {
    let factory = (
        values?
            : Partial<OPTIONS>
            | ( (options: OPTIONS) => void )
    ) => {
        let works: ((o: OPTIONS) => void)[] = [];

        return new Proxy(
            (...args: ARGS<DT>) => {
                let options = init_by(...args as any as REPLACE_HEAD<ARGS<DT>, ARG0<TARGET>>);

                if (typeof values == 'function') values(options);
                else Object.assign(options, values);

                works.forEach(work => work(options));

                set(args, get_registry, options);
            }, {
                get: (_, k, r) => (v: any) => {
                    // @TODO: check if k is keyof OPTIONS
                    works.push(o => o[k as keyof OPTIONS] = v);
                    return r;
                }
            }
        ) as DECORATOR<DECORATORS[DT], OPTIONS>
    }

    const get_registry = registry_factory(mrf.key<OPTIONS>(), decorator_type);

    return expandify(factory)[expandify.expand]({
        get_registry,
    })
}

type DECORATORS = {
    class     :     ClassDecorator,
    property  :  PropertyDecorator,
    method    :    MethodDecorator,
    parameter : ParameterDecorator,
};
type DECORATOR_TYPE = keyof DECORATORS;

type REGISTRY_SIGNATURES<T> = {
    class     : (target: Object                        ) => mrf.Reflection<T>,
    property  : (target: Object, property : PropertyKey) => mrf.Reflection<T>,
    method    : (target: Object, property?: PropertyKey) => mrf.Reflection<T>,
    parameter : (target: Object, property?: PropertyKey) => mrf.Reflection<T[]>,
}

function registry_factory<
    T,
    D extends DECORATOR_TYPE
>(
    key: mrf.Key<T>,
    type: D
): REGISTRY_SIGNATURES<T>[D];
function registry_factory(k: any, t: any) {
    switch (t) {
        case 'class':     return mrf.class_factory(k);
        case 'property':  return (t: any, p : any) => mrf.property_factory(k)(t, p);
        case 'method':
        case 'parameter': return (t: any, p?: any) => mrf.property_factory(k)(t, p);

        default: assert(false, 'should not be here');
    }
}

export type IS_READONLY<T, K extends keyof T> = IS_EQUAL<
    {          [ P in K ]: T[K] },
    { readonly [ P in K ]: T[K] }
> extends true ? true : false
type NON_READONLY<T> = {
    [ P in keyof T as IS_READONLY<T, P> extends true ? never : P ]: T[P]
}

const create_class_decorator = create(
    'class',
    (
        [ target ],
        get_registry,
        value,
    ) => get_registry(target).set(value),
);

const create_property_decorator = create(
    'property',
    (
        [ target, property ],
        get_registry,
        value,
    ) => get_registry(target, property).set(value),
);

const create_method_decorator = create(
    'method',
    (
        [ target, property ],
        get_registry,
        value,
    ) => get_registry(target, property).set(value),
);

const create_parameter_decorator = create(
    'parameter',
    (
        [ target, property, index ],
        get_registry,
        value,
    ) => get_registry(target, property).get_or_set([])[index] = value,
);

export default {
    create_class_decorator,
    create_property_decorator,
    create_method_decorator,
    create_parameter_decorator,
}
