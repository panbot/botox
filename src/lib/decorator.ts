import "reflect-metadata";
import mr, { metadata_registry } from "./metadata-registry";
import expandify from "./expandify";
import { CONSTRUCTOR, IS, MAYBE, REMOVE_HEAD, typram } from "./types";

export type DECORATOR<D, T> = D & Required<{
    [ P in keyof NON_READONLY<T> ]: (v: T[P]) => DECORATOR<D, T>
}>;

type DECORATOR_PARAMS<T extends DECORATOR_TYPE> = Parameters<DECORATORS[T]>
type ACTUAL_DECORATOR_PARAMS<T extends DECORATOR_TYPE> = Parameters<ACTUAL_DECORATORS[T]>
type REPLACE_TARGET<
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
    ? [ target: TARGET ]
    : [ target: TARGET, property: PROPERTY, ...rest: REMOVE_HEAD<REMOVE_HEAD<ACTUAL_DECORATOR_PARAMS<DT>>> ]
;

const create = <
    DT extends DECORATOR_TYPE,
    RFT extends REGISTRY_FACTORY_TYPE,
    TARGET_AS,
>(
    decorator_type: DT,
    target_as: typram.Typram<TARGET_AS>,
    registry_factory_type: RFT,
) => <
    INIT_PARAMETERS extends any[],
    FIELDS extends {},
    TARGET extends Object,
    _REPLACED_TARGET extends Object = REPLACE_TARGET<DT, TARGET, TARGET_AS>,
>(options: {
    init_by: (
        decorator_context: {
            args: REPLACE_PARAMS<DT, _REPLACED_TARGET, PROPERTY_TYPES[RFT]>,
            design_type: any,
        },
        ...init_args: INIT_PARAMETERS
    ) => FIELDS,
    target?: typram.Typram<TARGET>,
}) => {
    let factory = (...init_args: INIT_PARAMETERS) => {
        let works: ((o: FIELDS) => void)[] = [];

        let decorator = (...args: ACTUAL_DECORATOR_PARAMS<DT>) => {
            let fields = options.init_by(
                { args: args as any, design_type: design_type_getters[decorator_type](...args) },
                ...init_args
            );

            works.forEach(work => work(fields));

            decorator_setters[decorator_type](
                args,
                get_registry as SETTER_REGISTRY_FACTORY<FIELDS>[DT],
                fields
            );
        };

        return new Proxy(decorator, {
            get: (_, k, r) => (v: any) => {
                // @TODO: check if k is keyof fields
                works.push(o => o[k as keyof FIELDS] = v);
                return r;
            }
        }) as DECORATOR<DECORATORS[DT], FIELDS>
    }

    const get_registry = registry_factory(
        typram<_REPLACED_TARGET>(),
        typram<FIELDS>(),
        registry_factory_type,
    );

    return expandify(factory)[expandify.expand]({

        get_registry,

        get_properties: inventory_factory(
            decorator_type,
            typram<FIELDS>(),
            typram<PROPERTY_TYPES[RFT]>(),
            get_registry[metadata_registry.get_factory_key](),
        ),

        decorator: typram<DECORATORS[DT]>(),
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
    target      : Object,
    propertyKey : string | symbol,
    descriptor  : MAYBE<PropertyDescriptor>,
) => void;
type ACTUAL_DECORATORS = {
    class     :          ClassDecorator,
    property  : ActualPropertyDecorator,
    method    :         MethodDecorator,
    parameter :      ParameterDecorator,
};

type REGISTRY_FACTORY_TYPE
    =                 'class'
    |         'some_property'
    |             'parameter'
    |      'method_parameter'
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
    TARGET extends Object,
    FIELDS,
    RFT extends REGISTRY_FACTORY_TYPE,
>(
    target: typram.Typram<TARGET>,
    fields: typram.Typram<FIELDS>,
    type: RFT,
) {
    const factories = {
        class: mr.factory_factory(typram<[ target: TARGET ]>())(false)(mr.key<FIELDS>()),

        some_property: mr.factory_factory(typram<[ target: TARGET, property: PropertyKey ]>())(true)(mr.key<FIELDS>()),

        parameter: mr.factory_factory(
            typram<[ target: TARGET, property?: PropertyKey ]>(),
        )(true)(mr.key<FIELDS[]>()),

        method_parameter: mr.factory_factory(
            typram<[ target: TARGET, property: PropertyKey ]>(),
        )(true)(mr.key<FIELDS[]>()),

        constructor_parameter: mr.factory_factory(typram<[ target: TARGET ]>())(false)(mr.key<FIELDS[]>()),
    };

    return factories[type];
}

function inventory_factory<
    DT extends DECORATOR_TYPE,
    FIELDS,
    P extends MAYBE<PropertyKey>,
>(
    decorator_type: DT,
    fields: typram.Typram<FIELDS>,
    property_type: typram.Typram<P>,
    key: typram.Typram<any>,
) {
    const create = <T>() => mr.inventory_factory(
        property_type,
        key as typram.Typram<T>
    );

    const factories = {
        class     : create<FIELDS>(),
        property  : create<FIELDS>(),
        method    : create<FIELDS>(),
        parameter : create<FIELDS[]>(),
    }
    return factories[decorator_type];
}

type SETTER_REGISTRY_FACTORY<T> = {
    class     : (target: any                        ) => metadata_registry.Reflection<T>
    property  : (target: any, property : PropertyKey) => metadata_registry.Reflection<T>
    method    : (target: any, property : PropertyKey) => metadata_registry.Reflection<T>
    parameter : (target: any, property?: PropertyKey) => metadata_registry.Reflection<T[]>
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
    class     : (         ) => undefined as never,
    property  : ( t, p    ) => Reflect.getMetadata('design:type'      , t, p),
    method    : (         ) => undefined, // @TODO: get parameters and return types
    parameter : ( t, p, i ) => Reflect.getMetadata('design:paramtypes', t, p)[i],
}

type IS_READONLY<T, K extends keyof T> = IS<
    {          [ P in K ]: T[K] }
    ,
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