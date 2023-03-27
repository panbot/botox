import "reflect-metadata";
import { MAYBE, typram } from "./types";

type Key<T = unknown> = typram.Typram<T>;
const key = typram.factory<any>();

export interface Reflection<T> {
    readonly key: Key<T>;
    get(): MAYBE<T>
    get_own(): MAYBE<T>
    set(value: T): void
    get_or_set(v: T): T
    trace(): T[]
}

export interface ReflectProperties<T> {
    readonly properties: Omit<Properties<T>, 'add'>;
}

class ReflectionImpl<T> implements Reflection<T> {

    #key: Key<T>;
    get key() { return this.#key }

    constructor(
        key: Key<T>,
        public target: any,
        public property: any,
    ) {
        this.#key = key;
    }

    get()     : MAYBE<T> { return Reflect.getMetadata   (this.key, this.target, this.property) }
    get_own() : MAYBE<T> { return Reflect.getOwnMetadata(this.key, this.target, this.property) }

    set(value: T) { Reflect.defineMetadata(this.key, value, this.target, this.property) }

    get_or_set(v: T) {
        let w = this.get_own();
        if (w != null) return w;

        this.set(v);
        return v;
    }

    parent() {
        let t = Reflect.getPrototypeOf(this.target);
        if (t) return new ReflectionImpl<T>(this.key, t, this.property);
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
}

class PropertyRegistry<T> extends ReflectionImpl<T> implements ReflectProperties<T> {

    #properties?: Properties<T>;
    get properties() {
        this.#properties = create_property_bag(this.key, this.target);
        Reflect.defineProperty(this, 'properties', { get() { return this.#properties } });
        return this.#properties;
    }

    constructor(
        key: Key<T>,
        target: any,
        property: MAYBE<PropertyKey>,
    ) {
        super(key, target, property);
    }

    override set(value: T) {
        super.set(value);
        this.properties.add(this.property);
    }

    forEachProperty(
        cb: (property: MAYBE<PropertyKey>, get: () => T, get_own: () => MAYBE<T>) => void,
    ) {
        for (let p of this.properties.get()) {
            let r = new ReflectionImpl<T>(this.key, this.target, p);
            cb(p, () => r.get()!, () => r.get_own())
        }
    }
}

type Properties<T> = {
    add(property: MAYBE<PropertyKey>): void
    get: () => Set<MAYBE<PropertyKey>>
    forEach(cb: (property: MAYBE<PropertyKey>, get: () => T, get_own: () => MAYBE<T>) => void): void
}
function create_property_bag<T>(key: Key<T>, target: any) {
    let new_key = create_property_bag.map.for(key);

    let reflection = new ReflectionImpl(new_key, target, undefined);
    return {
        add: (property: MAYBE<PropertyKey>) => reflection.get_or_set([]).push(property),
        get: () => new Set(reflection.trace().flat()),
        forEach(
            cb: (property: MAYBE<PropertyKey>, get: () => T, get_own: () => MAYBE<T>) => void,
        ) {
            for (let p of this.get()) {
                let r = new ReflectionImpl<T>(key, target, p);
                cb(p, () => r.get()!, () => r.get_own())
            }
        }
    }
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

    class_factory: <T>(key: Key<T>) => (
        target: Object
    ) => new ClassRegistry<T>(key, target, undefined),

    property_factory: <T>(key: Key<T>) => (
        target: Object, property?: PropertyKey
    ) => new PropertyRegistry(key, target, property),
}
