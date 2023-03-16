import "reflect-metadata";

class Registry<T> {

    private reflection: ReturnType<Registry<T>["reflect"]>;

    constructor(
        public key: string,
        public target: any,
        public property?: Property,
    ) {
        this.reflection = this.reflect(target, property);
    }

    get() {
        return this.reflection.getMetadata()
    }

    set(metadata: T) {
        this.reflection.defineMetadata(metadata)
    }

    getOrSet(metadata: T) {
        let current = this.get();
        if (current != null) return current;

        this.set(metadata);
        return metadata;
    }

    getOwn() {
        return this.reflection.getOwnMetadata()
    }

    trace(): T[] {
        let ret: (T | undefined)[] = [ this.reflection.getOwnMetadata() ];
        for (
            let parent = Reflect.getPrototypeOf(this.target);
            parent;
            parent = Reflect.getPrototypeOf(parent)
        ) ret.push(this.reflect(parent, this.property).getOwnMetadata());

        return ret.filter((v: any): v is T => v != null);
    }

    private reflect(
        target: Object,
        property?: Property,
    ): {
        getMetadata:    () => T | undefined,
        getOwnMetadata: () => T | undefined,
        defineMetadata: (metadata: T) => void,
    } {
        if (property) {
            return {
                getMetadata:    () => Reflect.getMetadata(this.key, target, property),
                getOwnMetadata: () => Reflect.getOwnMetadata(this.key, target, property),
                defineMetadata: metadata => Reflect.defineMetadata(this.key, metadata, target, property),
            }
        } else {
            return {
                getMetadata:    () => Reflect.getMetadata(this.key, target),
                getOwnMetadata: () => Reflect.getOwnMetadata(this.key, target),
                defineMetadata: metadata => Reflect.defineMetadata(this.key, metadata, target),
            }
        }
    }
}

type Property = string | symbol;

type Anchors<T = unknown> = {
    'class'    : (target: Object                    ) => Registry<T>
    'property' : (target: Object, property: Property) => Registry<T>
};
type AnchorType = keyof Anchors;

export default <T>(
    key: any = Symbol(),
) => ({
    on: <U extends AnchorType>(anchor: U) => ({
        'class'    : (t)    => new Registry(key, t),
        'property' : (t, p) => new Registry(key, t, p),
    } as Anchors<T>)[anchor],
})