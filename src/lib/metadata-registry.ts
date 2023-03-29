import "reflect-metadata";
import { IS, MAYBE, typram } from "./types";
import aop from './aop/injective';

type KEY<T = unknown> = typram.Typram<T>;
const key = typram.factory<any>();

export interface Reflection<T> {
    readonly key: KEY<T>
    readonly target: Object
    readonly property: MAYBE<PropertyKey>
    get(): MAYBE<T>
    get_own(): MAYBE<T>
    set(value: T): void
    get_or_set(v: T): T
}

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
        registry_factory: () => Reflection<T>,
    ) => void
    export const for_each_property = <
        T,
        P extends MAYBE<PropertyKey>,
    >(
        property_type: typram.Typram<P>,
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
    } satisfies Reflection<T>
}

export const get_factory_key = Symbol();
const factory_factory = <
    ARGS extends [ target: Object, property?: MAYBE<PropertyKey> ],
>(
    args: typram.Typram<ARGS>,
) => (
    use_inventory: boolean,
) => <T>(
    key: KEY<T>,
    scheme?: (...args: ARGS) => [ t: Object, p?: PropertyKey ],
) => Object.assign((...args: ARGS) => {
    let registry = factory(key, args[0], args[1], scheme as SCHEME);

    if (use_inventory) before(
        registry, "set",
        () => inventory.add_property(key, args[0], args[1]!)
    );

    return registry;
}, {
    [get_factory_key]() { return key }
});

const { before } = aop();

export default {

    key,

    factory_factory,

    class_factory: factory_factory(typram<[ target: Object ]>())(false),

    property_factory: factory_factory(typram<[ target: Object, property: PropertyKey ]>()),

    inventory_factory: <P extends MAYBE<PropertyKey>, T>(
        property_type: typram.Typram<P>,
        key: KEY<T>,
        scheme?: SCHEME,
    ) => (
        target: Object
    ) => ({

        get: () => inventory.get_properties<P>(key, target),

        for_each: (
            cb: inventory.PROPERTY_CALLBACK<P, T>
        ) => inventory.for_each_property(property_type, key, target, cb, scheme),
    })
}
