import "reflect-metadata";
import mr from "./metadata-registry";
import expandify from "./expandify";
import { CONSTRUCTOR, IS, MAYBE, REMOVE_HEAD, typram } from "./types";

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
    _target_as: typram.Typram<TARGET_AS>,
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
        }) as decorator.DECORATOR<DECORATORS[DT], FIELDS>
    }

    const get_registry = registry_factory(
        typram<_REPLACED_TARGET>(),
        typram<FIELDS>(),
        registry_factory_type,
    );

    return expandify(factory)[expandify.expand]({

        [mr.get_registry]: get_registry,
    })
}

type OPTIONAL_PROPERTY_DECORATOR = (target: Object, propertyKey?: PropertyKey) => void;

type DECORATORS = {
    class     :     ClassDecorator,
    property  :  PropertyDecorator,
    method    :    MethodDecorator,
    parameter : ParameterDecorator,

    optional_property: OPTIONAL_PROPERTY_DECORATOR,
};
type DECORATOR_TYPE = keyof DECORATORS;

// fix the default PropertyDecorator
type ACTUAL_PROPERTY_DECORATOR = (
    target      : Object,
    propertyKey : string | symbol,
    descriptor  : MAYBE<PropertyDescriptor>,
) => void;
type ACTUAL_DECORATORS = {
    class     :     ClassDecorator,
    method    :    MethodDecorator,
    parameter : ParameterDecorator,

    property: ACTUAL_PROPERTY_DECORATOR,

    optional_property: OPTIONAL_PROPERTY_DECORATOR,
};

type REGISTRY_FACTORY_TYPE
    =                 'class'
    |         'some_property'
    |             'parameter'
    |      'method_parameter'
    | 'constructor_parameter'
    |    'prototype_property'
;

type PROPERTY_TYPES = {
    class: never,
    some_property: PropertyKey,
    parameter: MAYBE<PropertyKey>,
    method_parameter: PropertyKey,
    constructor_parameter: never,
    prototype_property: MAYBE<PropertyKey>,
}

function registry_factory<
    TARGET extends Object,
    FIELDS,
    RFT extends REGISTRY_FACTORY_TYPE,
>(
    _target: typram.Typram<TARGET>,
    _fields: typram.Typram<FIELDS>,
    type: RFT,
) {
    const factories = {
        class: mr(
            typram<[ target: TARGET ]>(),
        )(false)(mr.create_key<FIELDS>()),

        some_property: mr(
            typram<[ target: TARGET, property: PropertyKey ]>(),
        )(true)(mr.create_key<FIELDS>()),

        parameter: mr(
            typram<[ target: TARGET, property?: PropertyKey ]>(),
        )(true)(mr.create_key<FIELDS[]>()),

        method_parameter: mr(
            typram<[ target: TARGET, property: PropertyKey ]>(),
        )(true)(mr.create_key<FIELDS[]>()),

        constructor_parameter: mr(
            typram<[ target: TARGET ]>(),
        )(false)(mr.create_key<FIELDS[]>()),

        prototype_property: mr(
            typram<[ target: TARGET, property?: PropertyKey ]>(),
        )(false)(
            mr.create_key<FIELDS>(),
            (t: any, p: any) => [ p ? t[p] : t ],
        ),
    };

    return factories[type];
}

type SETTER_REGISTRY_FACTORY<T> = {
    class              : (target: any                        ) => mr.Reflection<T>
    property           : (target: any, property : PropertyKey) => mr.Reflection<T>
    optional_property  : (target: any, property?: PropertyKey) => mr.Reflection<T>
    method             : (target: any, property : PropertyKey) => mr.Reflection<T>
    parameter          : (target: any, property?: PropertyKey) => mr.Reflection<T[]>
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
    class             : ([ t       ], gr, v) => gr(t   ).set(v),
    property          : ([ t, p    ], gr, v) => gr(t, p).set(v),
    optional_property : ([ t, p    ], gr, v) => gr(t, p).set(v),
    method            : ([ t, p    ], gr, v) => gr(t, p).set(v),
    parameter         : ([ t, p, i ], gr, v) => gr(t, p).get_or_set([])[i] = v,
}

const get_design_type = ( ...args: [ string, any, any ] ) => Reflect.getMetadata(...args);
const design_type_getters: {
    [ P in DECORATOR_TYPE ]: (...args: ACTUAL_DECORATOR_PARAMS<P>) => any
} = {
    class              : (         ) => undefined as never,
    property           : ( t, p    ) => get_design_type('design:type'      , t, p),
    optional_property  : (         ) => undefined as never,
    method             : (         ) => undefined, // @TODO: get parameters and return types
    parameter          : ( t, p, i ) => get_design_type('design:paramtypes', t, p)[i],
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

namespace decorator {

    export type DECORATOR<D, T> = D & Required<{
        [ P in keyof NON_READONLY<T> ]: (v: T[P]) => DECORATOR<D, T>
    }>;

    export const create_class_decorator    = create('class'            , target_types.constructor, 'class'             );
    export const create_prototype_property = create('optional_property', target_types.either     , 'prototype_property');

    export const create_property_decorator =
        Object.assign( create('property', target_types.either,      'some_property'), {
             instance: create('property', target_types.instance,    'some_property'),
               static: create('property', target_types.constructor, 'some_property'), } );

    export const create_method_decorator =
        Object.assign( create('method', target_types.either,      'some_property'), {
             instance: create('method', target_types.instance,    'some_property'),
               static: create('method', target_types.constructor, 'some_property'), } );

    export const create_parameter_decorator =
        Object.assign( create('parameter', target_types.either,      'parameter'            ), {
          constructor: create('parameter', target_types.constructor, 'constructor_parameter'),
      instance_method: create('parameter', target_types.instance,    'method_parameter'     ),
        static_method: create('parameter', target_types.constructor, 'method_parameter'     ), } );

    export const target = typram.factory();
}

export default decorator;
