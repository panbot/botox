import decorator from "@/lib/decorator";
import { CONSTRUCTOR, IS } from "@/lib/types";
import * as asserts from "stories/asserts";

class Options {

}

{
    type EXPECTED = CONSTRUCTOR<{}> | {};

    const dec = decorator.create_property_decorator({
        init_by: (t, p, ...args) => {
            asserts.assert_true< IS<typeof t, EXPECTED> >();
            asserts.assert_true< IS<typeof p, PropertyKey> >();
            asserts.assert_true< IS<typeof args, []> >();
            return new Options();
        },
        target: decorator.target<{}>(),
    });
    type GET_REGISTRY_PARAMETERS = Parameters<typeof dec["get_registry"]>;
    asserts.assert_true< IS<GET_REGISTRY_PARAMETERS[0], EXPECTED> >();
}

{
    type EXPECTED = {};

    const dec = decorator.create_property_decorator.instance({
        init_by: (t, p, ...args) => {
            asserts.assert_true< IS<typeof t, EXPECTED> >();
            asserts.assert_true< IS<typeof p, PropertyKey> >();
            asserts.assert_true< IS<typeof args, []> >();
            return new Options();
        },
        target: decorator.target<{}>(),
    })
    type GET_REGISTRY_PARAMETERS = Parameters<typeof dec["get_registry"]>;
    asserts.assert_true< IS<GET_REGISTRY_PARAMETERS[0], EXPECTED> >();
}

{
    type EXPECTED = CONSTRUCTOR<{}>;

    const dec = decorator.create_property_decorator.static({
        init_by: (t, p, ...args) => {
            asserts.assert_true< IS<typeof t, EXPECTED> >();
            asserts.assert_true< IS<typeof p, PropertyKey> >();
            asserts.assert_true< IS<typeof args, []> >();
            return new Options();
        },
        target: decorator.target<{}>(),
    })
    type GET_REGISTRY_PARAMETERS = Parameters<typeof dec["get_registry"]>;
    asserts.assert_true< IS<GET_REGISTRY_PARAMETERS[0], EXPECTED> >();
}
