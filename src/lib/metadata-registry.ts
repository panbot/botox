import "reflect-metadata";

export type Anchors<T> = {
    'class'    : ( target: Object                        ) =>   ObjectRegistry<T>,
    'property' : ( target: Object, property: PropertyKey ) => PropertyRegistry<T>,
};
export type AnchorType = keyof Anchors<any>;

export default function<T>(
    key: any = Symbol(),
) {
    const Anchors: Anchors<T> = {
        'class'    : ( t    ) => new   ObjectRegistry<T>( key, t    ),
        'property' : ( t, p ) => new PropertyRegistry<T>( key, t, p ),
    };

    return <U extends AnchorType>(anchor: U) => Anchors[anchor]
}

abstract class Registry<T> {

    private reflection: ReturnType<Registry<T>["reflect"]>;

    constructor(
        public key: any,
        public target: any,
    ) {
        this.reflection = this.reflect(target);
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
        ) ret.push(this.reflect(parent).getOwn());

        return ret.filter((v: any): v is T => v != null);
    }

    private reflect(t: Object) {
        let args = this.getMetadataArgs(t);
        return {
            get    :     () => Reflect.getMetadata   (this.key,    ...args) as T | undefined,
            getOwn :     () => Reflect.getOwnMetadata(this.key,    ...args) as T | undefined,
            define : (v: T) => Reflect.defineMetadata(this.key, v, ...args),
        }
    }

    protected abstract getMetadataArgs(t: Object): [ Object, any ]
}

class ObjectRegistry<T> extends Registry<T> {

    protected getMetadataArgs(t: Object): any {
        return [ t ]
    }
}

class PropertyRegistry<T> extends Registry<T> {

    readonly properties: Registry<PropertyKey[]>;

    constructor(
        key: any,
        target: any,
        public property: PropertyKey,
    ) {
        super(key, target);

        this.properties = new ObjectRegistry<PropertyKey[]>(this.getKeyForProperties(), target);
    }

    override set(metadata: T) {
        this.properties.getOrSet([]).push(this.property);

        return super.set(metadata);
    }

    protected getMetadataArgs(t: Object): any {
        return [ t, this.property ]
    }

    private static KeyForProperties = new Map<any, any>();
    private getKeyForProperties() {
        let key = PropertyRegistry.KeyForProperties.get(this.key);
        if (!key) {
            key = Symbol();
            PropertyRegistry.KeyForProperties.set(this.key, key);
        }
        return key;
    }

}
