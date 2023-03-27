import "reflect-metadata";
import { MAYBE, typram } from "./types";

type Key<T = unknown> = typram.Typram<T>;
const key = typram.factory<any>();

export interface Reflection<T> {
    readonly key: Key<T>
    readonly target: any
    readonly property: any
    get(): MAYBE<T>
    get_own(): MAYBE<T>
    set(value: T): void
    get_or_set(v: T): T
    trace(): T[]
}

export interface ReflectionOptimisticGet<T> extends Reflection<T> {
    get(): T
}

export interface ReflectProperties<T> {
    readonly properties: Omit<Properties<T>, 'add'>
}

type Scheme = (target: any, property: any) => [ any, any ]

class ReflectionImpl<T> implements Reflection<T> {

    #key: Key<T>;
    get key() { return this.#key }

    #target: any;
    get target() { return this.#target }

    #property: any;
    get property() { return this.#property }

    protected scheme: Scheme = (t, p) => [ t, p ];

    constructor(
        key: Key<T>,
        target: any,
        property: any,
        scheme?: Scheme,
    ) {
        this.#key = key;
        this.#target = target;
        this.#property = property;

        if (scheme) this.scheme = scheme;
    }

    get()     : MAYBE<T> { return Reflect.getMetadata   (this.key,    ...this.scheme(this.target, this.property)) }
    get_own() : MAYBE<T> { return Reflect.getOwnMetadata(this.key,    ...this.scheme(this.target, this.property)) }
    set(v: T) : void     {        Reflect.defineMetadata(this.key, v, ...this.scheme(this.target, this.property)) }

    get_or_set(v: T) {
        let w = this.get_own();
        if (w != null) return w;

        this.set(v);
        return v;
    }

    parent() {
        let t = Reflect.getPrototypeOf(this.target);
        if (t) return new ReflectionImpl<T>(this.key, t, this.property, this.scheme);
    }

    trace() {
        let list: T[] = [];
        for (
            let refl: MAYBE<ReflectionImpl<T>> = this;
            refl;
            refl = refl.parent()
        ) {
            let v = refl.get_own();
            if (v != null) list.push(v);
        }

        return list;
    }
}

class ClassRegistry<T> extends ReflectionImpl<T> {
    constructor(
        key: Key<T>,
        target: any,
        scheme?: Scheme,
    ) {
        super(key, target, undefined, scheme);
    }
}

export abstract class ReflectPropertiesImpl<T> extends ReflectionImpl<T> implements ReflectProperties<T> {

    #properties?: Properties<T>;

    get properties() {
        this.#properties = create_property_bag(this.key, this.target, this.scheme);
        Reflect.defineProperty(this, 'properties', { get() { return this.#properties } });
        return this.#properties;
    }
}

class PropertyRegistry<T> extends ReflectPropertiesImpl<T> {

    constructor(
        key: Key<T>,
        target: any,
        property: MAYBE<PropertyKey>,
        scheme?: Scheme,
    ) {
        super(key, target, property, scheme);
    }

    override set(value: T) {
        super.set(value);
        this.properties.add(this.property);
    }
}

interface Properties<T> {
    add(property: MAYBE<PropertyKey>): void
    get(): Set<MAYBE<PropertyKey>>
    for_each(
        cb: (
            property: MAYBE<PropertyKey>,
            get_registry: () => ReflectionOptimisticGet<T>,
        ) => void
    ): void
}
function create_property_bag<T>(key: Key<T>, target: any, scheme?: Scheme) {
    let new_key = create_property_bag.map.for(key);

    let reflection = new ReflectionImpl(new_key, target, undefined, scheme);
    return {
        add: p => reflection.get_or_set([]).push(p),
        get: () => new Set(reflection.trace().flat()),
        for_each(cb) {
            for (let p of this.get()) {
                cb(p, () => new ReflectionImpl<T>(key, target, p, scheme) as any)
            }
        }
    } satisfies Properties<T>;
}
namespace create_property_bag {
    export const map = create_key_map<MAYBE<PropertyKey>[]>();
}

function create_key_map<T>() {
    let map = new WeakMap<Key, Key>();
    return Object.assign(map, {
        for(from: Key) {
            let to = map.get(from) as MAYBE<Key<T>>;
            if (to) return to;

            to = key();
            map.set(from, to);
            return to;
        }
    })
}

export default {

    key,

    class_factory: <T>(key: Key<T>, scheme?: Scheme) => (
        target: Object,
    ) => new ClassRegistry<T>(key, target, undefined),

    property_factory: <T>(key: Key<T>, scheme?: Scheme) => (
        target: Object,
        property?: PropertyKey,
    ) => new PropertyRegistry(key, target, property),
}
