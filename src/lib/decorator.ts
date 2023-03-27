import "reflect-metadata";
import mrf, { Reflection, ReflectProperties } from "./metadata-registry-factory";
import assert from "assert";
import expandify from "./expandify";
import { CONSTRUCTOR, IS, MAYBE, REMOVE_HEAD, typram } from "./types";

export type DECORATOR<D, T> = D & Required<{
    [ P in keyof NON_READONLY<T> ]: (v: T[P]) => DECORATOR<D, T>
}>;

type DECORATOR_PARAMS<T extends DECORATOR_TYPE> = Parameters<DECORATORS[T]>
type ACTUAL_DECORATOR_PARAMS<T extends DECORATOR_TYPE> = Parameters<ACTUAL_DECORATORS[T]>
type GET_TARGET_PARAM<
    DT extends DECORATOR_TYPE,
    TARGET,
    TARGET_AS,
> = DT extends 'class'
    ? CONSTRUCTOR<TARGET>
    : TARGET_AS extends 'constructor'
    ? CONSTRUCTOR<TARGET>
    : TARGET_AS extends 'instance'
    ? TARGET
    : TARGET | CONSTRUCTOR<TARGET>
;

type REPLACE_PARAMS<
    DT extends DECORATOR_TYPE,
    TARGET,
    PROPERTY,
> = DT extends 'class'
    ? [ TARGET ]
    : [ TARGET, PROPERTY, ...REMOVE_HEAD<REMOVE_HEAD<ACTUAL_DECORATOR_PARAMS<DT>>> ]
;
type REPLACE_GET_REGISTRY_PARAMS<
    TYPEOF_GET_REGISTRY extends (...params: any) => any,
    TARGET,
    PROPERTY,
> = Parameters<TYPEOF_GET_REGISTRY>["length"] extends 1
    ? [ TARGET ]
    : [ TARGET, PROPERTY ]
;

type INIT_BY_PARAMS<DT, PARAMS extends any[]> = DT extends "class" ? PARAMS : [ ...PARAMS, any ]

const create = <
    DT extends DECORATOR_TYPE,
    TARGET_AS,
    PROPERTY,
>(
    decorator_type: DT,
    target_as: typram.Typram<TARGET_AS>,
    property: typram.Typram<PROPERTY>,
) => <
    FIELDS extends {},
    TARGET,
    _TARGET = GET_TARGET_PARAM<DT, TARGET, TARGET_AS>,
>(options: {
    init_by: (...args: INIT_BY_PARAMS<DT, REPLACE_PARAMS<DT, _TARGET, PROPERTY>>) => FIELDS
    target?: typram.Typram<TARGET>,
}) => {
    let factory = (values?: Partial<FIELDS> | ( (fields: FIELDS) => void )) => {
        let works: ((o: FIELDS) => void)[] = [];

        return new Proxy(
            (...args: ACTUAL_DECORATOR_PARAMS<DT>) => {
                let fields = options.init_by(...[
                    ...args,
                    parameter_type_getters[decorator_type](...args)
                ] as any);

                if (typeof values == 'function') values(fields);
                else Object.assign(fields, values);

                works.forEach(work => work(fields));

                decorator_setters[decorator_type](args, get_registry, fields);
            }, {
                get: (_, k, r) => (v: any) => {
                    // @TODO: check if k is keyof fields
                    works.push(o => o[k as keyof FIELDS] = v);
                    return r;
                }
            }
        ) as DECORATOR<DECORATORS[DT], FIELDS>
    }

    const get_registry = registry_factory(typram<FIELDS>(), decorator_type);

    return expandify(factory)[expandify.expand]({
        get_registry: get_registry as any as (
            ...args: REPLACE_GET_REGISTRY_PARAMS<typeof get_registry, _TARGET, PROPERTY>
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

// fix the default PropertyDecorator
type ActualPropertyDecorator = (
    target: Object,
    propertyKey: string | symbol,
    descriptor: MAYBE<PropertyDescriptor>,
) => void;
type ACTUAL_DECORATORS = {
    class     :          ClassDecorator,
    property  : ActualPropertyDecorator,
    method    :         MethodDecorator,
    parameter :      ParameterDecorator,
};

type REGISTRY_FACTORY_SIGNATURES<T> = {
    class     : (target: Object                        ) => Reflection<T>,
    property  : (target: Object, property : PropertyKey) => Reflection<T>   & ReflectProperties<T>,
    method    : (target: Object, property : PropertyKey) => Reflection<T>   & ReflectProperties<T>,
    parameter : (target: Object, property?: PropertyKey) => Reflection<T[]> & ReflectProperties<T[]>,
}

function registry_factory<
    FIELDS,
    DT extends DECORATOR_TYPE
>(
    fields: typram.Typram<FIELDS>,
    decorator_type: DT
): REGISTRY_FACTORY_SIGNATURES<FIELDS>[DT] {
    switch (decorator_type) {
        case 'class': {
            let f: REGISTRY_FACTORY_SIGNATURES<FIELDS>["class"]
                = mrf.class_factory(mrf.key<FIELDS>());
            return f as any;
        }

        case 'property':
        case 'method'  : {
            let f: REGISTRY_FACTORY_SIGNATURES<FIELDS>["property"]
                = mrf.property_factory(mrf.key<FIELDS>());
            return f as any;
        }

        case 'parameter': {
            let f: REGISTRY_FACTORY_SIGNATURES<FIELDS>["parameter"]
                = mrf.property_factory(mrf.key<FIELDS[]>());
            return f as any;
        }

        default: assert(false, 'should not be here');
    }
}

type SETTER<
    DT extends DECORATOR_TYPE,
> = <T>(
    args: DECORATOR_PARAMS<DT>,
    get_registry: REGISTRY_FACTORY_SIGNATURES<T>[DT],
    value: T
) => void

const decorator_setters: {
    [ P in DECORATOR_TYPE ]: SETTER<P>
} = {
    class     : ( ([ t       ], gr, v) => gr(t   ).set(v)                ),
    property  : ( ([ t, p    ], gr, v) => gr(t, p).set(v)                ),
    method    : ( ([ t, p    ], gr, v) => gr(t, p).set(v)                ),
    parameter : ( ([ t, p, i ], gr, v) => gr(t, p).get_or_set([])[i] = v ),
}

const parameter_type_getters: {
    [ P in DECORATOR_TYPE ]: (...args: ACTUAL_DECORATOR_PARAMS<P>) => any
} = {
    class     : (         ) => undefined,
    property  : ( t, p    ) => Reflect.getMetadata('design:type'      , t, p),
    method    : (         ) => undefined, // @TODO: get parameters and return types
    parameter : ( t, p, i ) => Reflect.getMetadata('design:paramtypes', t, p)[i],
}

type IS_READONLY<T, K extends keyof T> = IS<
    {          [ P in K ]: T[K] },
    { readonly [ P in K ]: T[K] }
> extends true ? true : false
type NON_READONLY<T> = {
    [ P in keyof T as IS_READONLY<T, P> extends true ? never : P ]: T[P]
}

const target_types = {
    either      : typram<'constructor' | 'instance'>(),
    constructor : typram<'constructor'>(),
    instance    : typram<'instance'>(),
}

const property_types = {
    never    : typram<1>(),
    some     : typram<      PropertyKey >(),
    optional : typram<MAYBE<PropertyKey>>(),
}

export default {
    create_class_decorator: create(
        'class',
        target_types.constructor,
        property_types.never,
    ),

    create_property_decorator:
        Object.assign( create('property', target_types.either,      property_types.some), {
             instance: create('property', target_types.instance,    property_types.some),
               static: create('property', target_types.constructor, property_types.some), } ),

    create_method_decorator:
        Object.assign( create('method', target_types.either,      property_types.some), {
             instance: create('method', target_types.instance,    property_types.some),
               static: create('method', target_types.constructor, property_types.some), }),

    create_parameter_decorator:
        Object.assign( create('parameter', target_types.either,      property_types.optional), {
          constructor: create('parameter', target_types.constructor, property_types.never   ),
      instance_method: create('parameter', target_types.instance,    property_types.some    ),
        static_method: create('parameter', target_types.constructor, property_types.some    ), }),

    target: typram.factory(),
    target_types: {
        constructor: typram<'constructor'>(),
        instance: typram<'instance'>(),
    },
}