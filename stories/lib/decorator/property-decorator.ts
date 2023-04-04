import "reflect-metadata";
import decorator from "@/lib/decorator";
import { CONSTRUCTOR, IS, MAYBE } from "@/lib/types";
import * as asserts from "stories/asserts";
import mr from '@/lib/metadata-registry';
import gr = mr.get_registry;
import gp = mr.get_properties;

class Options {
    constructor(
        public type: any,
    ) {}

}

{
    type EXPECTED = CONSTRUCTOR<{}> | {};

    const dec = decorator.create_property_decorator({
        init_by: ({ args: [ target, property, descriptor ], design_type }) => {
            asserts.assert_true<IS< typeof target      , EXPECTED                   >>();
            asserts.assert_true<IS< typeof property    , PropertyKey                >>();
            asserts.assert_true<IS< typeof descriptor  , MAYBE<PropertyDescriptor> >>();
            asserts.assert_true<IS< typeof design_type , any                       >>();
            return new Options(design_type);
        },
        target: decorator.target<{}>(),
    });
    type GET_REGISTRY_PARAMETERS = Parameters<typeof dec[typeof gr]>;
    asserts.assert_true< IS<GET_REGISTRY_PARAMETERS[0], EXPECTED> >();
}

{
    type EXPECTED = CONSTRUCTOR<{}>;

    const dec = decorator.create_property_decorator.static({
        init_by: ({ args: [ target, property, descriptor ], design_type }) => {
            asserts.assert_true<IS< typeof target      , EXPECTED                   >>();
            asserts.assert_true<IS< typeof property    , PropertyKey                >>();
            asserts.assert_true<IS< typeof descriptor  , MAYBE<PropertyDescriptor> >>();
            asserts.assert_true<IS< typeof design_type , any                       >>();
            return new Options(design_type);
        },
        target: decorator.target<{}>(),
    });
    type GET_REGISTRY_PARAMETERS = Parameters<typeof dec[typeof gr]>;
    asserts.assert_true< IS<GET_REGISTRY_PARAMETERS[0], EXPECTED> >();

    class DummyTarget {
        @dec()
        static some_string_property: string;
    }

    console.log(dec[gr](DummyTarget, 'some_string_property').get_own());

    let properties = dec[gr][gp](DummyTarget);
    console.log(properties.get().has('some_string_property'));
    properties.for_each((p, gr) => {
        console.log(p, gr().get(), gr().get_own());
    });
}

{
    type EXPECTED = {};

    const dec = decorator.create_property_decorator.instance({
        init_by: ({ args: [ target, property, descriptor ], design_type }) => {
            asserts.assert_true<IS< typeof target      , EXPECTED                   >>();
            asserts.assert_true<IS< typeof property    , PropertyKey                >>();
            asserts.assert_true<IS< typeof descriptor  , MAYBE<PropertyDescriptor> >>();
            asserts.assert_true<IS< typeof design_type , any                       >>();
            return new Options(design_type);
        },
        target: decorator.target<{}>(),
    });
    type GET_REGISTRY_PARAMETERS = Parameters<typeof dec[typeof gr]>;
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
        let registry = dec[gr](new DummyTarget(), 'some_string_property');
        console.log(registry.key === key);
        console.log(registry.get_own());
        console.log(registry.get());
    }

    {
        let properties = dec[gr][gp](new DummyTarget());
        console.log(properties.get().has('some_string_property'));
        properties.for_each((p, gr) => {
            console.log(p, gr().get(), gr().get_own());
        });
    }
}
