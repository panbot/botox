import * as mrf from "@/lib/metadata-registry-factory";

type BASE_DECORATOR
    =     ClassDecorator
    |    MethodDecorator
    |  PropertyDecorator
    | ParameterDecorator
;

const create_decorator = <
    BD extends BASE_DECORATOR,
>(
) => (
    create_get_registry: METADATA_REGISTRY_FACTORY,
    set: (
        args: Parameters<BD>,
        get_registry: ReturnType<METADATA_REGISTRY_FACTORY>
    ) => void
) => {
    type ARGS = Parameters<BD>;

    return <OPTIONS>(
        init: (...args: ARGS) => OPTIONS,
    ) => {
        let decorator = (...args: ARGS) => {
            set(args, get_registry)
        }

        let get_registry = create_get_registry(mrf.key<OPTIONS>())

        return decorator as BD;
    }
}

type CLASS_DECORATOR_ARGS = Parameters<ClassDecorator>
//   ^?
type METHOD_DECORATOR_ARGS = Parameters<MethodDecorator>
//   ^?
type PROPERTY_DECORATOR_ARGS = Parameters<PropertyDecorator>
//   ^?
type PARAMETER_DECORATOR_ARGS = Parameters<ParameterDecorator>
//   ^?

type GET_CLASS_REGISTRY_ARGS = Parameters<mrf.GET_CLASS_REGISTRY>
//   ^?
type GET_PROPERTY_REGISTRY_ARGS = Parameters<mrf.GET_PROPERTY_REGISTRY>
//   ^?

type METADATA_REGISTRY_FACTORY
    = typeof mrf.create_class_registry_factory
    | typeof mrf.create_property_registry_factory