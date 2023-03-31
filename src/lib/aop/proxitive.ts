import mr, { metadata_registry } from '../metadata-registry';
import aop_factory, { ADVISED } from './factory';

export default (
    use: (proxifier: (object: any) => any) => any,
) => {
    const key = mr.create_key<ADVISED[]>();
    const get_registry = mr.property_factory(true)(
        mr.create_key<ADVISED[]>(),
        (t, p) => [ t[p as keyof typeof t] ]
    );

    use((target: any) => {
        let proxy = Object.create(target);

        get_registry[metadata_registry.get_properties](target).for_each(
            (p, gr) => proxy[p] = gr().get()?.reduce(
                (pv, cv) => aop_factory.apply_advised(cv, pv),
                target[p]
            ) || proxy[p]
        );

        return proxy;
    });

    return aop_factory(p => get_registry(p.prototype, p.method).get_or_set([]).push(p.advised));
}
