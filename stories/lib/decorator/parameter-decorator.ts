import "reflect-metadata";
import decorator from "@/lib/decorator";
import { CONSTRUCTOR, IS, MAYBE } from "@/lib/types";
import * as asserts from "stories/asserts";

class Options {
    constructor(
        public type: any,
    ) { }
}

{
    type EXPECTED = CONSTRUCTOR<{}> | {};

    const parameter_decorator = decorator.create_parameter_decorator({
        init_by: (target, property, index, type) => {
            asserts.assert_true<IS< typeof target   , EXPECTED           >>();
            asserts.assert_true<IS< typeof property , MAYBE<PropertyKey> >>();
            asserts.assert_true<IS< typeof index    , number             >>();
            asserts.assert_true<IS< typeof type     , any                >>();

            return new Options(type);
        },
        target: decorator.target<{}>(),
    });
    type GET_REGISTRY_PARAMETERS = Parameters<typeof parameter_decorator["get_registry"]>;
    asserts.assert_true< IS<GET_REGISTRY_PARAMETERS[0], EXPECTED> >();
}

{
    type EXPECTED = {};

    const d = decorator.create_parameter_decorator.instance_method({
        init_by: (target, property, index, type) => {
            asserts.assert_true<IS< typeof target   , EXPECTED    >>();
            asserts.assert_true<IS< typeof property , PropertyKey >>();
            asserts.assert_true<IS< typeof index    , number      >>();
            asserts.assert_true<IS< typeof type     , any         >>();

            return new Options(type);
        },
        target: decorator.target<{}>(),
    });
    type GET_REGISTRY_PARAMETERS = Parameters<typeof d["get_registry"]>;
    asserts.assert_true< IS<GET_REGISTRY_PARAMETERS[0], EXPECTED> >();

    class DummyTarget {
        some_method(
            @d()
            some_param: string,
        ) { }
    }

    let instance = new DummyTarget();
    let registry = d.get_registry(instance, 'some_method');
    let keys = Reflect.getMetadataKeys(instance, 'some_method');
    console.log(keys);
    console.log(registry.key == keys[3]);

    console.log(registry.get());
}

{
    type EXPECTED = CONSTRUCTOR<{}>;

    const static_method_parameter_decorator = decorator.create_parameter_decorator.static_method({
        init_by: (target, property, index, type) => {
            asserts.assert_true<IS< typeof target   , EXPECTED    >>();
            asserts.assert_true<IS< typeof property , PropertyKey >>();
            asserts.assert_true<IS< typeof index    , number      >>();
            asserts.assert_true<IS< typeof type     , any         >>();

            return new Options(type);
        },
        target: decorator.target<{}>(),
    });
    type GET_REGISTRY_PARAMETERS = Parameters<typeof static_method_parameter_decorator["get_registry"]>;
    asserts.assert_true< IS<GET_REGISTRY_PARAMETERS[0], EXPECTED> >();
    asserts.assert_true< IS<GET_REGISTRY_PARAMETERS[1], PropertyKey> >();

    class Target {
        static method(
            @static_method_parameter_decorator()
            arg1: string,
        ) {

        }
    }

    class AnotherTarget {
        static method(
            @static_method_parameter_decorator()
            arg1: number,
        ) {

        }
    }

    let registry = static_method_parameter_decorator.get_registry(Target, 'method');
    let args = registry.get_own();
    asserts.assert_true< IS<typeof args, MAYBE<Options[]>> >();
    console.log(args);

    console.log(static_method_parameter_decorator.get_registry(Target, 'method2').get_own());
    console.log(static_method_parameter_decorator.get_registry(AnotherTarget, 'method').get_own());
    console.log(static_method_parameter_decorator.get_registry(AnotherTarget, 'method2').get_own());

}

{
    type EXPECTED = CONSTRUCTOR<{}>;

    let dec = decorator.create_parameter_decorator.constructor({
        init_by: (target, property, index, type) => {
            asserts.assert_true<IS< typeof target   , EXPECTED    >>();
            asserts.assert_true<IS< typeof property , never       >>();
            asserts.assert_true<IS< typeof index    , number      >>();
            asserts.assert_true<IS< typeof type     , any         >>();

            return new Options(type);
        },
        target: decorator.target<{}>(),
    });
    type GET_REGISTRY_PARAMETERS = Parameters<typeof dec["get_registry"]>;

    class DummyTarget {
        constructor(

        ) { }
    }

    let registry = dec.get_registry(DummyTarget);
    let options = registry.get();
    asserts.assert_true< IS<typeof options, MAYBE<Options[]> >>();
}