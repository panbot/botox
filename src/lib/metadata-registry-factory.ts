import "reflect-metadata";
import { Maybe } from "./types";

export class Key<T = unknown> {}
export const key = <T>() => new Key<T>();

export const factories = {

    class: <T>(
        key: Key<T>
    ) => (
        target: any
    ) => new Reflection<T>(key, target, undefined),

    property: <T>(
        key: Key<T>
    ) => (
        target: any, property?: PropertyKey
    ) => new PropertyRegistry(key, target, property),

} as const;

class Reflection<T> {

    constructor(
        public key: any,
        public target: any,
        public property: any,
    ) { }

    get()     : T | undefined { return Reflect.getMetadata   (this.key, this.target, this.property) }
    get_own() : T | undefined { return Reflect.getOwnMetadata(this.key, this.target, this.property) }

    set(value: T) { Reflect.defineMetadata(this.key, value, this.target, this.property) }

    parent() {
        let t = Reflect.getPrototypeOf(this.target);
        if (t) return new Reflection<T>(this.key, t, this.property);
    }

    get_or_set(v: T) {
        let w = this.get_own();
        if (w != null) return w;

        this.set(v);
        return v;
    }

    trace() {
        let list: T[] = [];
        for (
            let refl: Maybe<Reflection<T>> = this;
            refl;
            refl = refl.parent()
        ) {
            let v = refl.get_own();
            if (v != null) list.push(v);
        }

        return list;
    }
}

class PropertyRegistry<T> extends Reflection<T> {

    #properties?: Properties;
    get properties() {
        if (!this.#properties) this.#properties = properties_factory(this.key, this.target);
        return this.#properties;
    }

    constructor(
        key: Key<T>,
        target: any,
        property: Maybe<PropertyKey>,
    ) {
        super(key, target, property);
    }

    override set(value: T) {
        super.set(value);

        this.properties.add(this.property);
    }

    forEachProperty(
        cb: (property: Maybe<PropertyKey>, get: () => T, get_own: () => T | undefined) => void,
    ) {
        for (let p of this.properties.get()) {
            let r = new Reflection<T>(this.key, this.target, p);
            cb(p, () => r.get()!, () => r.get_own())
        }
    }
}

export namespace Key {

}
function create_kep_map<T>() {
    let map = new WeakMap<Key, Key>();
    return Object.assign(map, {
        for(from: Key) {
            let to = map.get(from) as Maybe<Key<T>>;
            if (to) return to;

            to = new Key();
            map.set(from, to);
            return to;
        }
    })
}

type Properties = ReturnType<typeof properties_factory>;
function properties_factory(key: Key, target: any) {
    let new_key = properties_factory.map.for(key);

    let reflection = new Reflection<Maybe<PropertyKey>[]>(new_key, target, undefined);
    return {
        add: (property: Maybe<PropertyKey>) => reflection.get_or_set([]).push(property),
        get: () => new Set(reflection.trace().flat()),
    }
}
namespace properties_factory {
    export const map = create_kep_map<Maybe<PropertyKey>>();
}
