import "reflect-metadata";
import { MAYBE, typram } from "./types";
import aop from './aop/injective';

type KEY<T = unknown> = typram.Typram<T>;

type SCHEME = (target: any, property?: any) => [ t: any, p?: any ]

namespace inventory {

    export const property_key = Symbol();

    export const add_property = (
        key: KEY<any>, target: Object, p: MAYBE<PropertyKey>
    ) => factory(
        key as KEY<MAYBE<PropertyKey>[]>, target, property_key
    ).get_or_set([]).push(p);

    export const get_properties = <
        P extends MAYBE<PropertyKey>
    >(key: KEY, target: Object) => {
        let set = new Set<P>();

        for (
            let o: MAYBE<Object> = target;
            o;
            o = Reflect.getPrototypeOf(o)
        ) factory(
            key as KEY<P[]>, o, property_key
        ).get()?.forEach(
            v => set.add(v)
        );

        return set;
    }

    export type PROPERTY_CALLBACK<P, T> = (
        property: P,
        registry_factory: () => metadata_registry.Reflection<T>,
    ) => void
    export const for_each_property = <
        T,
        P extends MAYBE<PropertyKey>,
    >(
        _property_type: typram.Typram<P>,
        key: KEY<T>,
        target: Object,
        callback: PROPERTY_CALLBACK<P, T>,
        scheme?: SCHEME,
    ) => get_properties<P>(
        key, target
    ).forEach(
        p => callback(p, () => factory(key, target, p, scheme) as any)
    );
}

const factory = <T>(
    key: KEY<T>,
    target: Object,
    property: MAYBE<PropertyKey>,
    scheme: SCHEME = (t, p) => [ t, p ],
) => {
    return {
        get      key() { return key      },
        get   target() { return target   },
        get property() { return property },

        get:     () => Reflect.getMetadata   (key,    ...scheme(target, property)) as MAYBE<T>,
        get_own: () => Reflect.getOwnMetadata(key,    ...scheme(target, property)) as MAYBE<T>,
        set: (v: T) => Reflect.defineMetadata(key, v, ...scheme(target, property)),

        get_or_set(v: T) {
            let u = this.get_own();
            if (u != null) return u;

            this.set(v);
            return v;
        },
    } satisfies metadata_registry.Reflection<T>
}

function metadata_registry<
    ARGS extends [ target: Object, property?: MAYBE<PropertyKey> ],
>(
    _args: typram.Typram<ARGS>,
) { return (
    use_inventory: boolean,
) => <T>(
    key: KEY<T>,
    scheme?: (...args: ARGS) => [ t: Object, p?: PropertyKey ],
) => Object.assign((...args: ARGS) => {
    let registry = factory(key, args[0], args[1], scheme as SCHEME);

    if (use_inventory) aop().before(
        registry, "set",
        () => inventory.add_property(key, args[0], args[1]!)
    );

    return registry;
}, {
    [metadata_registry.get_properties]: (
        target: Object
    ) => ({

        get: () => inventory.get_properties<ARGS[1]>(key, target),

        for_each: (
            cb: inventory.PROPERTY_CALLBACK<ARGS[1], T>
        ) => inventory.for_each_property(typram<ARGS[1]>(), key, target, cb, scheme as SCHEME),
    }),
}) }

namespace metadata_registry {
    export const get_registry = Symbol();
    export const get_properties = Symbol();

    export interface Reflection<T> {
        readonly key: KEY<T>
        readonly target: Object
        readonly property: MAYBE<PropertyKey>
        get(): MAYBE<T>
        get_own(): MAYBE<T>
        set(value: T): void
        get_or_set(v: T): T
    }

    export const create_key = typram.factory<any>();

    export const class_factory = metadata_registry(typram<[ target: Object ]>())(false);

    export const property_factory = metadata_registry(typram<[ target: Object, property: PropertyKey ]>());

}

export default metadata_registry;
