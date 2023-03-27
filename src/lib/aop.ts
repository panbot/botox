import "reflect-metadata";
import assert from 'assert';
import mrf, { ReflectPropertiesImpl } from './metadata-registry-factory';
import { MAYBE, typram } from './types';

type POINTCUT = { target: any, method: PropertyKey, args: any[] }

type BEFORE_POINTCUT = POINTCUT
type AFTER_POINTCUT  = POINTCUT & { result: any }
type AROUND_POINTCUT = POINTCUT & { invoke: () => any }

type BEFORE = ( before: (pointcut: BEFORE_POINTCUT) => any ) => MethodDecorator
type  AFTER = (  after: (pointcut:  AFTER_POINTCUT) => any ) => MethodDecorator
type AROUND = ( around: (pointcut: AROUND_POINTCUT) => any ) => MethodDecorator

type ADVISED = <T>(invoke: (p: POINTCUT) => T, target: any, args: any[]) => T
const apply = (
    advised: ADVISED,
    to: Function
) => function (this: any, ...args: any[]) {
    return advised(p => to.apply(this, p.args), this, args);
}

export function aop_factory(
    implement: (blueprint: {
        origin     : Function,
        advised    : ADVISED,
        prototype  : Object,
        method     : PropertyKey,
        descriptor : PropertyDescriptor,
    }) => void,
) {
    const create: (
        shape: (p: POINTCUT, invoke: (p: POINTCUT) => any) => any
    ) => MethodDecorator = (
        shape,
    ) => (
        prototype, method, descriptor
    ) => void implement({
        origin: assert_is_function(prototype, method),
        advised: (invoke, target, args) => shape({ target, method, args }, invoke),
        prototype, method, descriptor,
    });

    const extend = Object.assign;

    return {
        before : before => create((p, invoke) =>       ( before(p),                 invoke(p)    )),
        after  : after  => create((p, invoke) =>  after( extend(p , { result:       invoke(p) }) )),
        around : around => create((p, invoke) => around( extend(p , { invoke: () => invoke(p) }) )),
    } satisfies { before: BEFORE, after: AFTER, around: AROUND }
}

export const destructive_aop = () => aop_factory(bp => bp.descriptor.value = apply(bp.advised, bp.origin));

export const injective_aop_factory = (
    inject: (prototype: Object, property: PropertyKey, factory: () => any) => Function,
) => {
    const key = mrf.key<ADVISED[]>();

    return aop_factory(({
        origin, advised, prototype, method,
    }) => {
        let registry = mrf.property_factory(key)(prototype, method)
        registry.get_or_set([]).push(advised);

        inject(
            prototype,
            method,
            () => registry.get_own()!.reduce((pv, cv) => apply(cv, pv), origin),
        );
    })
}

export const proxitive_aop = (
    use: (proxifier: (object: any) => any) => any,
) => {
    let get_registry = prototype_property_factory(mrf.key<ADVISED[]>());

    use((target: any) => {
        let proxy = Object.create(target);

        get_registry(target, '').properties.forEach(
            (p, gr) => {
                console.log(target, p);
                let keys = Reflect.getMetadataKeys(target);
                console.log(keys);
                console.log(Reflect.getMetadata(keys[0], target));
                console.log(Reflect.getMetadataKeys(target[p!]));
                console.log(Reflect.getOwnMetadata(Reflect.getMetadataKeys(target[p!])[0], target[p!]));
                console.log(gr().get());
                proxy[p!] = gr().get().reduce((pv, cv) => apply(cv, pv), target[p!])
            }
        );

        return proxy;
    });

    return aop_factory(({
        advised, prototype, method,
    }) => {
        get_registry(prototype, method).get_or_set([]).push(advised);
    })
}

const prototype_property_factory = <T>(key: typram.Typram<T>) => (
    target: Object, property: PropertyKey
) => new PrototypePropertyRegistry(key, target, property)

class PrototypePropertyRegistry<T> extends ReflectPropertiesImpl<T> {

    constructor(
        key: typram.Typram<T>,
        target: any,
        property: PropertyKey,
    ) {
        super(key, target, property);
    }

    override get()     : MAYBE<T> { return this.get_own() }
    override get_own() : MAYBE<T> {
        console.log(this.target, this.property);
        return Reflect.getOwnMetadata(this.key, this.target[this.property]) }

    override set(value: T) {
        Reflect.defineMetadata(this.key, value, this.target[this.property])
        this.properties.add(this.property);
    }
}


function assert_is_function(o: any, k: PropertyKey) {
    let v: unknown = o[k];
    assert(typeof v == 'function', `${o.constructor.name}.${k.toString()} is not a function`);
    return v;
}
