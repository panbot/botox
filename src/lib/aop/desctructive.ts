import aop_factory from "./factory";

function desctructive_aop_factory() {
    return aop_factory((_, __, d, r) => d.value = r(d.value));
}

namespace desctructive_aop_factory {

}
export default desctructive_aop_factory;
