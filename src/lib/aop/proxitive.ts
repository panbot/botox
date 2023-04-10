import mr from '../metadata-registry'
import aop_factory from './factory'

function proxitive_aop_factory(
    use: (proxifier: <T>(object: T) => T) => void
) {
    const get_registry = mr.property_factory(true)(
        mr.create_key<aop_factory.REPLACER[]>(),
        (t: any, p) => [ t[p] ]
    );

    use((target: any) => {
        let proxy = Object.create(target)

        get_registry[mr.get_properties](target).for_each(
            (p, gr) => proxy[p] = gr().get()?.reduce(
                (pv, cv) => cv(pv),
                target[p]
            ) || proxy[p]
        )

        return proxy
    })

    return aop_factory((t, m, _d, r) => get_registry(t, m).get_or_set([]).push(r))
}

namespace proxitive_aop_factory {

}

export default proxitive_aop_factory