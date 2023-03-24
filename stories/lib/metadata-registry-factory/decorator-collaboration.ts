import { metadata_registry_factory as mrf } from "@/lib/metadata-registry-factory";
import assert from "assert";

type DECORATORS = {
    class: ClassDecorator,
    property: PropertyDecorator,
    method: MethodDecorator,
    parameter: ParameterDecorator,
};
type DECORATOR_TYPE = keyof DECORATORS;

type REGISTRY_SIGNATURES<T> = {
    class     : (target: Object                        ) => mrf.Reflection<T>,
    property  : (target: Object, property : PropertyKey) => mrf.Reflection<T>,
    method    : (target: Object, property?: PropertyKey) => mrf.Reflection<T>,
    parameter : (target: Object, property?: PropertyKey) => mrf.Reflection<T[]>,
}

function registry_factory<
    T,
    DT extends DECORATOR_TYPE
>(
    key: mrf.Key<T>,
    type: DT
): REGISTRY_SIGNATURES<T>[DT];
function registry_factory(k: any, t: any) {
    switch (t) {
        case 'class':     return mrf.class_factory(k);
        case 'property':  return (t: any, p : any) => mrf.property_factory(k)(t, p);
        case 'method':
        case 'parameter': return (t: any, p?: any) => mrf.property_factory(k)(t, p);

        default: assert(false, 'should not be here');
    }
}

const create_decorator_5 = <
    DT extends DECORATOR_TYPE,
>(
    decorator_type: DT,
    set: <T>(
        args: Parameters<DECORATORS[DT]>,
        get_registry: REGISTRY_SIGNATURES<T>[DT],
        value: T
    ) => void,
) => {
    const factory = <OPTIONS>(
        init_by: (...args: Parameters<DECORATORS[DT]>) => OPTIONS,
    ) => {
        let factory = (
            values: Partial<OPTIONS>
        ) => {
            const decorator = (
                ...args: Parameters<DECORATORS[DT]>
            ) => {
                let options: OPTIONS = init_by(...args);
                set(args, get_registry, options);
            };
            return decorator as DECORATORS[DT]
        }

        const key = mrf.key<OPTIONS>();

        const get_registry = registry_factory(key, decorator_type);

        return Object.assign(factory, { get_registry });
    }

    return factory;

}
const test5 = create_decorator_5(
    'class',
    (
        args,
        get_registry,
        value,
    ) => {

    }
)(target => 2);
test5.get_registry

const test5_parameter = create_decorator_5(
    'parameter',
    (
        [ t, p , i ],
        get_registry,
        value,
    ) => get_registry(t, p).get_or_set([])[i] = value,
)(
    (t, p, i) => ''
)
test5_parameter.get_registry
