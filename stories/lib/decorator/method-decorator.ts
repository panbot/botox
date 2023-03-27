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

    const dec = decorator.create_method_decorator({
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
        some_instance_method() { }

        @dec()
        static some_static_method() { }
    }

    console.log(dec.get_registry(DummyTarget, 'some_static_method').get());
    console.log(dec.get_registry(new DummyTarget, 'some_instance_method').get());
}

{
    type EXPECTED = {};

    const dec = decorator.create_method_decorator.instance({
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

    const dec = decorator.create_method_decorator.static({
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
