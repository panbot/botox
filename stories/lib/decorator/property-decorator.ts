import "reflect-metadata";
import decorator from "@/lib/decorator";
import { CONSTRUCTOR, IS } from "@/lib/types";
import * as asserts from "stories/asserts";

class Options {
    constructor(
        public type: any,
    ) {}

}

{
    type EXPECTED = CONSTRUCTOR<{}> | {};

    const dec = decorator.create_property_decorator({
        init_by: (target, property, descriptor, type) => {
            asserts.assert_true<IS< typeof target   , EXPECTED    >>();
            asserts.assert_true<IS< typeof property , PropertyKey >>();
            asserts.assert_true<IS< typeof type     , any         >>();
            return new Options(type);
        },
        target: decorator.target<{}>(),
    });
    type GET_REGISTRY_PARAMETERS = Parameters<typeof dec["get_registry"]>;
    asserts.assert_true< IS<GET_REGISTRY_PARAMETERS[0], EXPECTED> >();
}

{
    type EXPECTED = CONSTRUCTOR<{}>;

    const dec = decorator.create_property_decorator.static({
        init_by: (target, property, descriptor, type) => {
            asserts.assert_true<IS< typeof target   , EXPECTED    >>();
            asserts.assert_true<IS< typeof property , PropertyKey >>();
            asserts.assert_true<IS< typeof type     , any         >>();
            return new Options(type);
        },
        target: decorator.target<{}>(),
    });
    type GET_REGISTRY_PARAMETERS = Parameters<typeof dec["get_registry"]>;
    asserts.assert_true< IS<GET_REGISTRY_PARAMETERS[0], EXPECTED> >();

    class DummyTarget {
        @dec()
        static some_string_property: string;
    }

    console.log(dec.get_registry(DummyTarget, 'some_string_property').get_own());

    let properties = dec.get_properties(DummyTarget);
    console.log(properties.get().has('some_string_property'));
    properties.for_each((p, gr) => {
        console.log(p, gr().get(), gr().get_own());
    });
}

{
    type EXPECTED = {};

    const dec = decorator.create_property_decorator.instance({
        init_by: (target, property, descriptor, type) => {
            asserts.assert_true<IS< typeof target   , EXPECTED    >>();
            asserts.assert_true<IS< typeof property , PropertyKey >>();
            asserts.assert_true<IS< typeof type     , any         >>();
            return new Options(type);
        },
        target: decorator.target<{}>(),
    });
    type GET_REGISTRY_PARAMETERS = Parameters<typeof dec["get_registry"]>;
    asserts.assert_true< IS<GET_REGISTRY_PARAMETERS[0], EXPECTED> >();

    class DummyTarget {
        @dec()
        some_string_property!: string;
    }

    console.log(Reflect.getMetadataKeys(DummyTarget));
    console.log(Reflect.getMetadataKeys(new DummyTarget(), 'some_string_property'));
    console.log(Reflect.getMetadata('design:type', new DummyTarget(), 'some_string_property'));
    let key = Reflect.getMetadataKeys(new DummyTarget(), 'some_string_property')[1];

    {
        let registry = dec.get_registry(new DummyTarget(), 'some_string_property');
        console.log(registry.key === key);
        console.log(registry.get_own());
        console.log(registry.get());
    }

    {
        let properties = dec.get_properties(new DummyTarget());
        console.log(properties.get().has('some_string_property'));
        properties.for_each((p, gr) => {
            console.log(p, gr().get(), gr().get_own());
        });
    }
}
