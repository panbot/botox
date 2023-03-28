import mrf from '@/lib/metadata-registry-factory';

{
    const get_registry = mrf.inventory_factory(
        mrf.key<string[]>(),
    );

    let target = {};

    get_registry(target, 'a').get_or_set([]).push('1');
    get_registry(target, 'b').get_or_set([]).push('2');
    get_registry(target, 'c').get_or_set([]).push('3');
    get_registry(target, 'd').get_or_set([]).push('4');

    console.log(get_registry.get_properties(target));
    get_registry.for_each_property(target, (p, gr) => {
        console.log(p, gr().get());
    })
}