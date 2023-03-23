import "reflect-metadata";
import { Maybe } from "./types";

export type ANCHORS<T> = {
    'class'    : ( target: Object                        ) =>   ObjectRegistry<T>,
    'property' : ( target: Object, property: PropertyKey ) => PropertyRegistry<T>,
};

export type METADATA_REGISTRY_ANCHOR = keyof ANCHORS<any>;

export default function<T>(
    key: any = Symbol(),
) {
    const Anchors: ANCHORS<T> = {
        'class'    : ( t    ) => new   ObjectRegistry<T>( key, t    ),
        'property' : ( t, p ) => new PropertyRegistry<T>( key, t, p ),
    };

    return <U extends METADATA_REGISTRY_ANCHOR>(anchor: U) => Anchors[anchor]
}

interface Reflection<T> {
    get(): T | undefined
    getOwn(): T | undefined
    define(v: T): void
}




function factory<T>(
    key: string,
    anchor: 'class' | 'property' | 'parameter',
) {

    return (target: any, property?: any) => {
        return new MetadataRegistry<T>(
            key,
            target,
            property,
            t => [ t, property ],
        )
    }
}

class MetadataRegistry<T> {

    private reflection!: ReturnType<MetadataRegistry<T>["reflect"]>;

    constructor(
        public key: any,
        public target: any,
        public property: any,
        private getReflectionArgs: (t: any) => any,
    ) {
        this.reflection = this.reflect(this.getReflectionArgs(this.target));
    }

    get() {
        return this.reflection.get()
    }

    set(metadata: T) {
        this.reflection.define(metadata);
        return metadata;
    }

    getOrSet(metadata: T) {
        let current = this.getOwn();
        if (current != null) return current;

        this.set(metadata);
        return metadata;
    }

    getOwn() {
        return this.reflection.getOwn()
    }

    trace(): T[] {
        let ret: (T | undefined)[] = [ this.reflection.getOwn() ];
        for (
            let parent = Reflect.getPrototypeOf(this.target);
            parent;
            parent = Reflect.getPrototypeOf(parent)
        ) ret.push(this.reflect(this.getReflectionArgs(parent)).getOwn());

        return ret.filter((v: any): v is T => v != null);
    }

    protected reflect(args: [ Object, any ]) {
        return {
            get    :     () => Reflect.getMetadata   (this.key,    ...args) as T | undefined,
            getOwn :     () => Reflect.getOwnMetadata(this.key,    ...args) as T | undefined,
            define : (v: T) => Reflect.defineMetadata(this.key, v, ...args),
        }
    }

}

abstract class Registry<T> {

    private reflection!: ReturnType<Registry<T>["reflect"]>;
    protected initReflection() {
        this.reflection = this.reflect(this.getReflectionArgs(this.target));
    }

    constructor(
        public key: any,
        public target: any,
    ) { }

    get() {
        return this.reflection.get()
    }

    set(metadata: T) {
        this.reflection.define(metadata);
        return metadata;
    }

    getOrSet(metadata: T) {
        let current = this.getOwn();
        if (current != null) return current;

        this.set(metadata);
        return metadata;
    }

    getOwn() {
        return this.reflection.getOwn()
    }

    trace(): T[] {
        let ret: (T | undefined)[] = [ this.reflection.getOwn() ];
        for (
            let parent = Reflect.getPrototypeOf(this.target);
            parent;
            parent = Reflect.getPrototypeOf(parent)
        ) ret.push(this.reflect(this.getReflectionArgs(parent)).getOwn());

        return ret.filter((v: any): v is T => v != null);
    }

    protected reflect(args: [ Object, any ]) {
        return {
            get    :     () => Reflect.getMetadata   (this.key,    ...args) as T | undefined,
            getOwn :     () => Reflect.getOwnMetadata(this.key,    ...args) as T | undefined,
            define : (v: T) => Reflect.defineMetadata(this.key, v, ...args),
        }
    }

    protected abstract getReflectionArgs(target: Object): [ Object, any ]
}

class ObjectRegistry<T> extends Registry<T> {

    constructor(
        key: any,
        target: any,
    ) {
        super(key, target);
        this.initReflection();
    }

    protected getReflectionArgs(target: Object): any { return [ target ] }
}

class PropertyRegistry<T> extends Registry<T> {

    constructor(
        key: any,
        target: any,
        public property: PropertyKey,
    ) {
        super(key, target);
        this.initReflection();
    }

    #properties?: Properties<PropertyKey>;
    get properties() {
        if (!this.#properties) this.#properties = new Properties<PropertyKey>(this.key, this.target);
        return this.#properties;
    }

    forEachProperty(
        callback: (property: PropertyKey, get: () => T, getOwn: () => T | undefined) => void,
    ) {
        for (let p of this.properties.get()) {
            let reflect = () => this.reflect([ this.target, p ]);
            callback(
                p,
                () => reflect().get()!,
                () => reflect().getOwn(),
            )
        }
    }

    override set(metadata: T) {
        this.properties.add(this.property);

        return super.set(metadata);
    }

    protected getReflectionArgs(t: Object): any { return [ t, this.property ] }
}

class ParameterRegistry<T> extends Registry<T> {

    constructor(
        key: any,
        target: any,
        public property: Maybe<PropertyKey>,
    ) {
        super(key, target);
        this.initReflection();
    }

    #properties?: Properties<Maybe<PropertyKey>>;
    get properties() {
        if (!this.#properties) this.#properties = new Properties<Maybe<PropertyKey>>(this.key, this.target);
        return this.#properties;
    }

    forEachProperty(
        callback: (property: Maybe<PropertyKey>, get: () => T, getOwn: () => T | undefined) => void,
    ) {
        for (let p of this.properties.get()) {
            let reflect = () => this.reflect([ this.target, p ]);
            callback(
                p,
                () => reflect().get()!,
                () => reflect().getOwn(),
            )
        }
    }

    override set(metadata: T) {
        this.properties.add(this.property);

        return super.set(metadata);
    }

    protected getReflectionArgs(t: Object): any { return [ t, this.property ] }
}

class Properties<P> {

    registry: Registry<P[]>;

    constructor(
        key: any,
        public target: any,
    ) {
        this.registry = new ObjectRegistry<P[]>(
            Properties.getOrCreateKey(key),
            this.target,
        )
    }

    private static KeyMap = new Map<any, any>();
    private static getOrCreateKey(key: any) {
        let newKey = this.KeyMap.get(key);
        if (!newKey) {
            newKey = Symbol();
            this.KeyMap.set(key, newKey);
        }
        return newKey;
    }

    add(p: P) {
        this.registry.getOrSet([]).push(p);
    }

    get() {
        return new Set(this.registry.trace().flat());
    }
}
