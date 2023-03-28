import "reflect-metadata";
import mrf, { get_factory_key, Reflection } from "./metadata-registry-factory";
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
    GET_REGISTRY extends (...params: any) => any,
    TARGET,
> = Parameters<GET_REGISTRY>["length"] extends 1
    ? [ TARGET ]
    : [ TARGET, Parameters<GET_REGISTRY>[1] ]
;

type INIT_BY_PARAMS<DT, PARAMS extends any[]> = DT extends "class" ? PARAMS : [ ...PARAMS, any ]

const create = <
    DT extends DECORATOR_TYPE,
    RFT extends REGISTRY_FACTORY_TYPE,
    TARGET_AS,
>(
    decorator_type: DT,
    target_as: typram.Typram<TARGET_AS>,
    registry_factory_type: RFT,
) => <
    FIELDS extends {},
    TARGET,
    _TARGET = GET_TARGET_PARAM<DT, TARGET, TARGET_AS>,
>(options: {
    init_by: (...args: INIT_BY_PARAMS<DT, REPLACE_PARAMS<DT, _TARGET, PROPERTY_TYPES[RFT]>>) => FIELDS
    target?: typram.Typram<TARGET>,
}) => {
    let factory = (values?: Partial<FIELDS> | ( (fields: FIELDS) => void )) => {
        let works: ((o: FIELDS) => void)[] = [];

        return new Proxy(
            (...args: ACTUAL_DECORATOR_PARAMS<DT>) => {
                let fields = options.init_by(...[
                    ...args,
                    design_type_getters[decorator_type](...args)
                ] as any);

                if (typeof values == 'function') values(fields);
                else Object.assign(fields, values);

                works.forEach(work => work(fields));

                decorator_setters[decorator_type](
                    args,
                    get_registry as SETTER_REGISTRY_FACTORY<FIELDS>[DT],
                    fields
                );
            }, {
                get: (_, k, r) => (v: any) => {
                    // @TODO: check if k is keyof fields
                    works.push(o => o[k as keyof FIELDS] = v);
                    return r;
                }
            }
        ) as DECORATOR<DECORATORS[DT], FIELDS>
    }

    const get_registry = registry_factory(typram<FIELDS>(), registry_factory_type);

    return expandify(factory)[expandify.expand]({

        get_registry: get_registry as any as (
            ...args: REPLACE_GET_REGISTRY_PARAMS<typeof get_registry, _TARGET>
        ) => ReturnType<typeof get_registry>,

        get_properties: inventory_factory(
            decorator_type,
            typram<FIELDS>(),
            get_registry[get_factory_key](),
        ),
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

type REGISTRY_FACTORY_TYPE
    = 'class'
    | 'some_property'
    | 'parameter'
    | 'method_parameter'
    | 'constructor_parameter'
;

type PROPERTY_TYPES = {
    class: never,
    some_property: PropertyKey,
    parameter: MAYBE<PropertyKey>,
    method_parameter: PropertyKey,
    constructor_parameter: never,
}

function registry_factory<
    FIELDS,
    RFT extends REGISTRY_FACTORY_TYPE,
>(
    fields: typram.Typram<FIELDS>,
    type: RFT,
) {
    const factories = {
        class: mrf.class_factory(mrf.key<FIELDS>()),

        some_property: mrf.property_factory(true)(mrf.key<FIELDS>()),

        parameter: mrf.factory_factory(
            typram<[ target: Object, property?: PropertyKey ]>(),
        )(true)(mrf.key<FIELDS[]>()),

        method_parameter: mrf.factory_factory(
            typram<[ target: Object, property: PropertyKey ]>(),
        )(true)(mrf.key<FIELDS[]>()),

        constructor_parameter: mrf.class_factory(mrf.key<FIELDS[]>()),
    };

    return factories[type];
}

function inventory_factory<
    DT extends DECORATOR_TYPE,
    FIELDS,
>(
    decorator_type: DT,
    fields: typram.Typram<FIELDS>,
    key: typram.Typram<any>,
) {
    const factories = {
        class: mrf.inventory_factory(key as typram.Typram<FIELDS>),
        property: mrf.inventory_factory(key as typram.Typram<FIELDS>),
        method: mrf.inventory_factory(key as typram.Typram<FIELDS>),
        parameter: mrf.inventory_factory(key as typram.Typram<FIELDS[]>),
    }
    return factories[decorator_type];
}

type SETTER_REGISTRY_FACTORY<T> = {
    class     : (target: Object                        ) => Reflection<T>
    property  : (target: Object, property : PropertyKey) => Reflection<T>
    method    : (target: Object, property : PropertyKey) => Reflection<T>
    parameter : (target: Object, property?: PropertyKey) => Reflection<T[]>
}

type SETTER<
    DT extends DECORATOR_TYPE,
> = <T>(
    args: DECORATOR_PARAMS<DT>,
    get_registry: SETTER_REGISTRY_FACTORY<T>[DT],
    value: T
) => void

const decorator_setters: {
    [ P in DECORATOR_TYPE ]: SETTER<P>
} = {
    class:     ([ t       ], gr, v) => gr(t   ).set(v),
    property:  ([ t, p    ], gr, v) => gr(t, p).set(v),
    method:    ([ t, p    ], gr, v) => gr(t, p).set(v),
    parameter: ([ t, p, i ], gr, v) => gr(t, p).get_or_set([])[i] = v,
}

const design_type_getters: {
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

export default {
    create_class_decorator: create('class', target_types.constructor, 'class'),

    create_property_decorator:
        Object.assign( create('property', target_types.either,      'some_property'), {
             instance: create('property', target_types.instance,    'some_property'),
               static: create('property', target_types.constructor, 'some_property'), } ),

    create_method_decorator:
        Object.assign( create('method', target_types.either,      'some_property'), {
             instance: create('method', target_types.instance,    'some_property'),
               static: create('method', target_types.constructor, 'some_property'), }),

    create_parameter_decorator:
        Object.assign( create('parameter', target_types.either,      'parameter'            ), {
          constructor: create('parameter', target_types.constructor, 'constructor_parameter'),
      instance_method: create('parameter', target_types.instance,    'method_parameter'     ),
        static_method: create('parameter', target_types.constructor, 'method_parameter'     ), }),

    target: typram.factory(),

    target_types: {
        constructor: typram<'constructor'>(),
        instance: typram<'instance'>(),
    },
}