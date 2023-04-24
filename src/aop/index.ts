import proxitive_factory from './proxitive';
import injective_factory from './injective';
import aop_factory from './factory';

namespace aop {
    export const destructive = () => aop_factory((_t, _m, d, r) => d.value = r(d.value));
    export const   proxitive =   proxitive_factory;
    export const   injective =   injective_factory;
}

export default aop;
