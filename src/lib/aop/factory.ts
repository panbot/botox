import "reflect-metadata";

type POINTCUT = { target: any, method: PropertyKey, args: any[] }

type BEFORE_POINTCUT = POINTCUT
type AFTER_POINTCUT  = POINTCUT & { result: any }
type AROUND_POINTCUT = POINTCUT & { invoke: () => any }

type BEFORE = ( before: (pointcut: BEFORE_POINTCUT) => any ) => MethodDecorator
type  AFTER = (  after: (pointcut:  AFTER_POINTCUT) => any ) => MethodDecorator
type AROUND = ( around: (pointcut: AROUND_POINTCUT) => any ) => MethodDecorator

export type ADVICES = {
    before : BEFORE ,
    after  : AFTER  ,
    around : AROUND ,
}

export type ADVISED = <T>(invoke: (p: POINTCUT) => T, target: any, args: any[]) => T

type BLUEPRINT = {
    origin     : Function,
    advised    : ADVISED,
    prototype  : Object,
    method     : PropertyKey,
    descriptor : PropertyDescriptor,
}

function aop_factory(
    implement: (blueprint: BLUEPRINT) => void,
) {
    const create: (
        shape: (p: POINTCUT, invoke: (p: POINTCUT) => any) => any
    ) => MethodDecorator = (
        shape,
    ) => (
        prototype, method, descriptor
    ) => void implement({
        origin: assert_is_function(descriptor.value, prototype, method),
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

export default Object.assign(aop_factory, {
    apply_advised: (
        advised: ADVISED,
        to: Function
    ) => function (this: any, ...args: any[]) {
        return advised(p => to.apply(this, p.args), this, args);
    }
})

function assert_is_function(value: unknown, object: any, property: PropertyKey, ) {
    if (typeof value != 'function') throw new Error('not a function', { cause: { value, object, property }});
    return value;
}
