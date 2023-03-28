import mrf from '../metadata-registry-factory';
import aop_factory, { ADVISED } from './factory';

export default (
    use: (proxifier: (object: any) => any) => any,
) => {
    let get_registry = mrf.inventory_factory(mrf.key<ADVISED[]>(), (t, p) => [ t[p as keyof typeof t] ]);

    use((target: any) => {
        let proxy = Object.create(target);

        get_registry.for_each_property(
            target,
            (p, gr) => proxy[p] = gr().get()?.reduce(
                (pv, cv) => aop_factory.apply_advised(cv, pv),
                target[p]
            ) || proxy[p]
        );

        return proxy;
    });

    return aop_factory(p => get_registry(p.prototype, p.method).get_or_set([]).push(p.advised));
}
