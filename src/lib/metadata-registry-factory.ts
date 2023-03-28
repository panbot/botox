import "reflect-metadata";
import { MAYBE, typram } from "./types";
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
    ) => factory(key as KEY<MAYBE<PropertyKey>[]>, target, property_key).get_or_set([]).push(p);

    export const get_properties = (key: KEY, target: Object) => {
        let set = new Set<MAYBE<PropertyKey>>();

        for (
            let o: MAYBE<Object> = target;
            o;
            o = Reflect.getPrototypeOf(o)
        ) factory(
            key as KEY<MAYBE<PropertyKey>[]>,
            o,
            property_key
        ).get()?.forEach(
            v => set.add(v)
        );

        return set;
    }

    export type PROPERTY_CALLBACK<T> = (
        property: MAYBE<PropertyKey>,
        registry_factory: () => Reflection<T>,
    ) => void
    export const for_each_property = <T>(
        key: KEY<T>,
        target: Object,
        callback: PROPERTY_CALLBACK<T>,
        scheme?: SCHEME,
    ) => get_properties(
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

const class_factory = <T>(
    key: KEY<T>,
    scheme?: (target: Object) => [ t: Object, p?: PropertyKey ],
) => (
    target: Object,
) => factory(key, target, undefined, scheme);

const property_factory = <T>(
    key: KEY<T>,
    scheme?: (target: Object, property: PropertyKey) => [ t: Object, p?: PropertyKey ],
) => (
    target: Object,
    property: PropertyKey,
) => factory(key, target, property, scheme);


const inventory_factory = <T>(
    key: KEY<T>,
    scheme?: (target: Object, property: PropertyKey) => [ t: Object, p?: PropertyKey ],
) => {
    let get_registry = (
        target: Object,
        property: PropertyKey,
    ) => {
        let registry = factory(key, target, property, scheme);
        before(registry, "set", () => inventory.add_property(key, target, property));
        return registry;
    }

    return Object.assign(get_registry, {

        get_properties: (
            target: Object,
        ) => inventory.get_properties(key, target),

        for_each_property: (
            target: Object,
            callback: inventory.PROPERTY_CALLBACK<T>,
        ) => inventory.for_each_property(key, target, callback, scheme),
    });
}

const factory_factory = <
    ARGS extends [ target: Object, property?: PropertyKey ],
>(
    args: typram.Typram<ARGS>
) => {
    return <T>(
        key: KEY<T>,
        scheme?: (...args: ARGS) => [ t: Object, p?: PropertyKey ],
    ) => (...args: ARGS) => factory(key, args[0], args[1], scheme as SCHEME);
}

const f1 = factory_factory(typram<[ target: Object ]>());
const f2 = factory_factory(typram<[ target: Object, property: PropertyKey ]>());

const { before } = aop();

export default {

    key,

    factory,
    class_factory,
    property_factory,
    inventory_factory,
    // optional_property_factory,

}
