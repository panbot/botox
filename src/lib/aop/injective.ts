import botox_framework_types from "../../framework/types";
import desctructive_aop_factory from "./desctructive";
import aop_factory from "./factory";

function injective_aop_factory() {
    const { before, after, around } = desctructive_aop_factory();

    return <
        T extends Object,
        M extends botox_framework_types.METHODS<T>,
        ARGS extends any[] = aop_factory.ARGS<T[M]>,
        RESULT = aop_factory.RETURN_TYPE<T[M]>,
        D = (...args: ARGS) => RESULT,
    >(
        target: T,
    ) => ({
        before: (method: M, advice: aop_factory.BEFORE_ADVICE<T, M, D>) => define_property(target, method, before(advice)),
        after : (method: M, advice: aop_factory. AFTER_ADVICE<T, M, D>) => define_property(target, method,  after(advice)),
        around: (method: M, advice: aop_factory.AROUND_ADVICE<T, M, D>) => define_property(target, method, around(advice)),
    })
}

namespace injective_aop_factory {

}

export default injective_aop_factory

function define_property(
    target: any, method: any,
    decorator: aop_factory.DECORATOR<any, any, any>,
) {
    let descriptor = { value: target[method] }
    decorator(target, method, descriptor);
    Object.defineProperty(target, method, descriptor);
}