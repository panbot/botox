import mr from '../metadata-registry';
import aop_factory from './factory';
import types from './types';

export default (
    use: (proxifier: (object: any) => any) => any,
) => {
    const get_registry = mr.property_factory(true)(
        mr.create_key<types.ADVISED[]>(),
        (t, p) => [ t[p as keyof typeof t] ]
    );

    use((target: any) => {
        let proxy = Object.create(target);

        get_registry[mr.get_properties](target).for_each(
            (p, gr) => proxy[p] = gr().get()?.reduce(
                (pv, cv) => aop_factory.apply_advised(cv, pv),
                target[p]
            ) || proxy[p]
        );

        return proxy;
    });

    return aop_factory(p => get_registry(p.prototype, p.method).get_or_set([]).push(p.advised));
}
