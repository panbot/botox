import "reflect-metadata";

export default function<T>(
    key: any = Symbol(),
) {
    const Anchors = {

        'class': (
            target: Object,
        ) => new Registry<T>(key, target),

        'property': (
            target: Object,
            property: PropertyKey,
        ) => new Registry<T>(key, target, property),
    };

    return {
        on: <U extends keyof typeof Anchors>(anchor: U) => Anchors[anchor],
    }
}

class Registry<T> {

    private reflection: ReturnType<Registry<T>["reflect"]>;

    constructor(
        public key: string,
        public target: any,
        public property?: PropertyKey,
    ) {
        this.reflection = this.reflect(target, property);
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
        ) ret.push(this.reflect(parent, this.property).getOwn());

        return ret.filter((v: any): v is T => v != null);
    }

    private reflect(t: Object, p?: PropertyKey) {
        return {
            get    :     () => Reflect.getMetadata   (this.key,    t, p as any) as T,
            getOwn :     () => Reflect.getOwnMetadata(this.key,    t, p as any) as T,
            define : (v: T) => Reflect.defineMetadata(this.key, v, t, p as any),
        }
    }
}
