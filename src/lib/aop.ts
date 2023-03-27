import "reflect-metadata";
import assert from 'assert';
import mrf from './metadata-registry-factory';

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

export const proxitive_aop = (
    use: (proxifier: (object: any) => any) => any,
) => {
    let get_registry = mrf.property_factory(mrf.key<ADVISED[]>(), (t, p) => t[p]);

    use((target: any) => {
        let proxy = Object.create(target);

        get_registry(target).properties.for_each(
            (p, gr) => proxy[p!] = gr().get().reduce((pv, cv) => apply(cv, pv), target[p!])
        );

        return proxy;
    });

    return aop_factory(p => get_registry(p.prototype, p.method).get_or_set([]).push(p.advised));
}

function assert_is_function(o: any, k: PropertyKey) {
    let v: unknown = o[k];
    assert(typeof v == 'function', `${o.constructor.name}.${k.toString()} is not a function`);
    return v;
}
