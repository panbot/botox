import aop_factory from "./factory";

export default () => aop_factory(bp => bp.descriptor.value = aop_factory.apply_advised(bp.advised, bp.origin));
