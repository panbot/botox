import "reflect-metadata";
import types from './types';

function aop_factory(
    implement: (blueprint: types.BLUEPRINT) => void,
) {
    const create: (
        shape: (p: types.POINTCUT, invoke: (p: types.POINTCUT) => any) => any
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
        before : before => create((p, invoke) =>       ( before(p),                 invoke( p )    )),
        after  : after  => create((p, invoke) =>  after( extend(p ,    catch_error( invoke, p )  ) )),
        around : around => create((p, invoke) => around( extend(p , { invoke: () => invoke( p ) }) )),
    } satisfies types.ADVICES;
}

namespace aop_factory {
    export const apply_advised = (
        advised: types.ADVISED,
        to: Function
    ) => function (this: any, ...args: any[]) {
        return advised(p => to.apply(this, p.args), this, args);
    }
}

export default aop_factory;

function assert_is_function(value: unknown, object: any, property: PropertyKey, ) {
    if (typeof value != 'function') throw new Error('not a function', { cause: { value, object, property }});
    return value;
}

function catch_error(
    invoke: (p: types.POINTCUT) => any,
    p: types.POINTCUT,
) {
    try {
        return { result: invoke(p), error: false }
    } catch (result) {
        return { result, error: true }
    }
}
