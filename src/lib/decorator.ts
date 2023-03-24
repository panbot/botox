import { metadata_registry_factory as mrf } from "./metadata-registry-factory";
import assert from "assert";
import expandify from "./expandify";
import { CONSTRUCTOR, IS, REMOVE_HEAD, typram } from "./types";

export type DECORATOR<D, T> = D & Required<{
    [ P in keyof NON_READONLY<T> ]: (v: T[P]) => DECORATOR<D, T>
}>;

type ARGS<T extends DECORATOR_TYPE> = Parameters<DECORATORS[T]>
type REPLACE_HEAD<LIST, HEAD> = [ HEAD, ...REMOVE_HEAD<LIST> ]
type ARG0<TARGET, AS> = AS extends 'constructor'
    ? CONSTRUCTOR<TARGET>
    : AS extends 'instance'
        ? TARGET
        : TARGET | CONSTRUCTOR<TARGET>
;

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
) => <FIELDS extends {}, TARGET>(options: {
    init_by: (...args: REPLACE_HEAD<ARGS<DT>, ARG0<TARGET, TARGET_AS>>) => FIELDS,
    target?: typram.Param<TARGET>,
}) => {
    let factory = (
        values?
            : Partial<FIELDS>
            | ( (fields: FIELDS) => void )
    ) => {
        let works: ((o: FIELDS) => void)[] = [];

        return new Proxy(
            (...args: ARGS<DT>) => {
                let fields = options.init_by(
                    ...args as any as REPLACE_HEAD<ARGS<DT>, ARG0<TARGET, TARGET_AS>>
                );

                if (typeof values == 'function') values(fields);
                else Object.assign(fields, values);

                works.forEach(work => work(fields));

                set(args, get_registry, fields);
            }, {
                get: (_, k, r) => (v: any) => {
                    // @TODO: check if k is keyof fields
                    works.push(o => o[k as keyof FIELDS] = v);
                    return r;
                }
            }
        ) as DECORATOR<DECORATORS[DT], FIELDS>
    }

    const get_registry = registry_factory(mrf.key<FIELDS>(), decorator_type);

    return expandify(factory)[expandify.expand]({
        get_registry: get_registry as any as (
            ...args: REPLACE_HEAD<Parameters<typeof get_registry>, ARG0<TARGET, TARGET_AS>>
        ) => ReturnType<typeof get_registry>,
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

export type IS_READONLY<T, K extends keyof T> = IS<
    {          [ P in K ]: T[K] },
    { readonly [ P in K ]: T[K] }
> extends true ? true : false
type NON_READONLY<T> = {
    [ P in keyof T as IS_READONLY<T, P> extends true ? never : P ]: T[P]
}

const target_as = typram.factory<'constructor' | 'instance'>()

const create_class_decorator = create(
    'class',
    (
        [ target ],
        get_registry,
        value,
    ) => get_registry(target).set(value),
    target_as<'constructor'>(),
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
