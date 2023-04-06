import "reflect-metadata";
import decorator from "@/lib/decorator";
import { CONSTRUCTOR, IS } from "@/lib/types";
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

    const dec = decorator.create_method_decorator({
        init_by: ({ args: [ target, property, descriptor ], design_type }) => {
            asserts.assert_true<IS< typeof target      , EXPECTED                         >>();
            asserts.assert_true<IS< typeof property    , PropertyKey                      >>();
            asserts.assert_true<IS< typeof descriptor  , TypedPropertyDescriptor<unknown> >>();
            asserts.assert_true<IS< typeof design_type , any                              >>();

            console.log(descriptor);

            return new Options(design_type);
        },
        target: decorator.target<{}>(),
    });
    type GET_REGISTRY_PARAMETERS = Parameters<typeof dec[typeof gr]>;
    asserts.assert_true< IS<GET_REGISTRY_PARAMETERS[0], EXPECTED> >();
}

{
    type EXPECTED = {};

    const dec = decorator.create_method_decorator.instance({
        init_by: ({ args: [ target, property, descriptor ], design_type }) => {
            asserts.assert_true<IS< typeof target      , EXPECTED                         >>();
            asserts.assert_true<IS< typeof property    , PropertyKey                      >>();
            asserts.assert_true<IS< typeof descriptor  , TypedPropertyDescriptor<unknown> >>();
            asserts.assert_true<IS< typeof design_type , any                              >>();

            console.log(descriptor);

            return new Options(design_type);
        },
        target: decorator.target<{}>(),
    });
    type GET_REGISTRY_PARAMETERS = Parameters<typeof dec[typeof gr]>;
    asserts.assert_true< IS<GET_REGISTRY_PARAMETERS[0], EXPECTED> >();
}

{
    type EXPECTED = CONSTRUCTOR<{}>;

    const dec = decorator.create_method_decorator.static({
        init_by: ({ args: [ target, property, descriptor ], design_type }) => {
            asserts.assert_true<IS< typeof target      , EXPECTED                         >>();
            asserts.assert_true<IS< typeof property    , PropertyKey                      >>();
            asserts.assert_true<IS< typeof descriptor  , TypedPropertyDescriptor<unknown> >>();
            asserts.assert_true<IS< typeof design_type , any                              >>();

            console.log(descriptor);

            return new Options(design_type);
        },
        target: decorator.target<{}>(),
    });
    type GET_REGISTRY_PARAMETERS = Parameters<typeof dec[typeof gr]>;
    asserts.assert_true< IS<GET_REGISTRY_PARAMETERS[0], EXPECTED> >();
}
