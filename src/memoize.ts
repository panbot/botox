import aop_factory from "./aop/factory";
import metadata_registry from "./metadata-registry";

function memoize(around: aop_factory.AOP["around"]) {
    const registry = metadata_registry.property_factory(false)(metadata_registry.create_key<any>());
    return () => around<Object, PropertyKey, any>(
        p => registry(p.target, p.method).get_or_set(p.invoke)
    )
}

namespace memoize {

}

export default memoize