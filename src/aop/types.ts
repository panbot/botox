namespace aop_types {

    export type POINTCUT = { target: any, method: PropertyKey, args: any[] }

    export type BEFORE_POINTCUT = POINTCUT
    export type  AFTER_POINTCUT = POINTCUT & { result: any, error: boolean }
    export type AROUND_POINTCUT = POINTCUT & { invoke: () => any }

    export type BEFORE = ( before: (pointcut: BEFORE_POINTCUT) => any ) => MethodDecorator
    export type  AFTER = (  after: (pointcut:  AFTER_POINTCUT) => any ) => MethodDecorator
    export type AROUND = ( around: (pointcut: AROUND_POINTCUT) => any ) => MethodDecorator

    export type ADVICES = {
        before : BEFORE
        after  : AFTER
        around : AROUND
    }

    export type ADVISED = <T>(invoke: (p: POINTCUT) => T, target: any, args: any[]) => T

    export type BLUEPRINT = {
        origin     : Function,
        advised    : ADVISED,
        prototype  : Object,
        method     : PropertyKey,
        descriptor : PropertyDescriptor,
    }

}

export default aop_types;
