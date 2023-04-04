import types from './types';
import destructive_factory from './desctructive';
import proxitive_factory from './proxitive';
import injective_factory from './injective';

namespace aop {
    export type POINTCUT = types.POINTCUT
    export type AOP = types.ADVICES

    export const destructive = destructive_factory;
    export const proxitive   =   proxitive_factory;
    export const injective   =   injective_factory;
}

export default aop;
