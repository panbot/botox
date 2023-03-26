import "reflect-metadata";
import decorator from "@/lib/decorator";
import { CONSTRUCTOR, IS, MAYBE } from "@/lib/types";
import * as asserts from "stories/asserts";

class Options {
    constructor(
        public type: any,
    ) { }

    static from_decorator(target: Object, property: MAYBE<PropertyKey>, index: number) {
        return new Options(
            Reflect.getMetadata('design:paramtypes', target, property as any)[index]
        )
    }
}

{
    type EXPECTED = CONSTRUCTOR<{}> | {};

    const parameter_decorator = decorator.create_parameter_decorator({
        init_by: (t, p, i) => {
            asserts.assert_true< IS<typeof t, EXPECTED> >();
            asserts.assert_true< IS<typeof p, MAYBE<PropertyKey>> >();
            asserts.assert_true< IS<typeof i, number> >();
            return Options.from_decorator(t, p, i);
        },
        target: decorator.target<{}>(),
    });
    type GET_REGISTRY_PARAMETERS = Parameters<typeof parameter_decorator["get_registry"]>;
    asserts.assert_true< IS<GET_REGISTRY_PARAMETERS[0], EXPECTED> >();
}

{
    type EXPECTED = {};

    const instance_method_parameter_decorator = decorator.create_parameter_decorator.instance_method({
        init_by: (t, p, i) => {
            asserts.assert_true< IS<typeof t, EXPECTED> >();
            asserts.assert_true< IS<typeof p, PropertyKey> >();
            asserts.assert_true< IS<typeof i, number> >();
            return Options.from_decorator(t, p, i);
        },
        target: decorator.target<{}>(),
    });
    type GET_REGISTRY_PARAMETERS = Parameters<typeof instance_method_parameter_decorator["get_registry"]>;
    asserts.assert_true< IS<GET_REGISTRY_PARAMETERS[0], EXPECTED> >();
}

{
    type EXPECTED = CONSTRUCTOR<{}>;

    const static_method_parameter_decorator = decorator.create_parameter_decorator.static_method({
        init_by: (t, p, i) => {
            asserts.assert_true< IS<typeof t, EXPECTED> >();
            asserts.assert_true< IS<typeof p, PropertyKey> >();
            asserts.assert_true< IS<typeof i, number> >();
            return Options.from_decorator(t, p, i);
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

    let registry = static_method_parameter_decorator.get_registry(Target, 'method');
    let args = registry.get_own();
    asserts.assert_true< IS<typeof args, MAYBE<Options[]>> >();
    console.log(args);
}