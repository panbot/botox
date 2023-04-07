
function aop_factory(
    installer: (
        target: Object, method: PropertyKey, descriptor: TPD<any>,
        replacer: aop_factory.REPLACER,
    ) => void,
): aop_factory.AOP {
    const install = (
        advice: (pointcut: any) => any,
        target: any, method: any, descriptor: TPD<any>,
        shape: (advise: () => any, invoke: () => any) => any
    ) => void installer(
        target, method, descriptor,
        (
            f: FUNC
        ) => function (this: any, ...args: any) {
            let pointcut: aop_factory.POINTCUT<any, any, any> = {
                target, method, descriptor, args,
                result: undefined, error: false,
                invoke: () => f.apply(this, pointcut.args),
            }
            return shape(
                () => advice(pointcut),
                () => { try       { pointcut.result = pointcut.invoke() }
                        catch (e) { pointcut.result = e
                                    pointcut.error  = true              } }
            )
        }
    )

    return {
        before: a => (t, m, d) => install(a, t, m, d, (advise, invoke) => (           advise(), invoke() )) ,
        after : a => (t, m, d) => install(a, t, m, d, (advise, invoke) => ( invoke(), advise()           )) ,
        around: a => (t, m, d) => install(a, t, m, d, (advise        ) => (           advise()           )) ,
    }
}

namespace aop_factory {

    export type POINTCUT<T, M, D> = {

        target     : T,
        method     : M,
        descriptor : TPD<D>,

        args:         D extends (...arg: infer U) => any ? U : never,
        result:       D extends (...arg: any) => infer R ? R : never,
        invoke: () => D extends (...arg: any) => infer R ? R : never,

        error: boolean,
    }

    export type BEFORE_POINTCUT<T, M, D> = Omit<POINTCUT<T, M, D>, "invoke" | "result" | "error">
    export type  AFTER_POINTCUT<T, M, D> = Omit<POINTCUT<T, M, D>, "invoke"                     >
    export type AROUND_POINTCUT<T, M, D> = Omit<POINTCUT<T, M, D>,            "result" | "error">

    export type BEFORE_ADVICE<T, M, D> = (pointcut: BEFORE_POINTCUT<T, M, D>) => any
    export type  AFTER_ADVICE<T, M, D> = (pointcut:  AFTER_POINTCUT<T, M, D>) => any
    export type AROUND_ADVICE<T, M, D> = (pointcut: AROUND_POINTCUT<T, M, D>) => any

    export type DECORATOR<T, M, D> = (target: T, method: M, decorator: TPD<D>) => void

    export type BEFORE = <T, M, D>(advice: BEFORE_ADVICE<T, M, D>) => DECORATOR<T, M, D>
    export type  AFTER = <T, M, D>(advice:  AFTER_ADVICE<T, M, D>) => DECORATOR<T, M, D>
    export type AROUND = <T, M, D>(advice: AROUND_ADVICE<T, M, D>) => DECORATOR<T, M, D>

    export type AOP = {
        before : BEFORE
         after : AFTER
        around : AROUND
    }

    export type REPLACER = (f: FUNC) => FUNC
}

export default aop_factory

type FUNC = (...args: any) => any
type TPD<T> = TypedPropertyDescriptor<T>
