import "reflect-metadata";
import { MAYBE } from "./types";

export namespace metadata_registry_factory {
    export class Key<T = unknown> {}
    export const key = <T>() => new Key<T>();

    export function class_factory<T>(key: Key<T>) {
        return (
            target: Object
        ) => new ClassRegistry<T>(key, target, undefined)
    }

    export function property_factory<T>(key: Key<T>) {
        return (
            target: Object, property?: PropertyKey
        ) => new PropertyRegistry(key, target, property)
    }

    export interface Reflection<T> {
        get(): MAYBE<T>
        get_own(): MAYBE<T>
        set(value: T): void
        get_or_set(v: T): T
    }

    class ReflectionImpl<T> implements Reflection<T> {

        constructor(
            public key: any,
            public target: any,
            public property: any,
        ) { }

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

    class PropertyRegistry<T> extends ReflectionImpl<T> {

        #properties?: Properties;
        get properties() {
            if (!this.#properties) this.#properties = create_property_bag(this.key, this.target);
            return this.#properties;
        }

        constructor(
            key: metadata_registry_factory.Key<T>,
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

    type Properties = ReturnType<typeof create_property_bag>;
    function create_property_bag(key: any, target: any) {
        let new_key = create_property_bag.map.for(key);

        let reflection = new ReflectionImpl<MAYBE<PropertyKey>[]>(new_key, target, undefined);
        return {
            add: (property: MAYBE<PropertyKey>) => reflection.get_or_set([]).push(property),
            get: () => new Set(reflection.trace().flat()),
        }
    }
    namespace create_property_bag {
        export const map = create_key_map<MAYBE<PropertyKey>>();
    }

    function create_key_map<T>() {
        let map = new WeakMap<Key, Key>();
        return Object.assign(map, {
            for(from: Key) {
                let to = map.get(from) as MAYBE<Key<T>>;
                if (to) return to;

                to = new Key();
                map.set(from, to);
                return to;
            }
        })
    }

}
