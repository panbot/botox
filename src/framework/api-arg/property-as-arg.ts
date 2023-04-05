import types from "../types";
import OPTIONS = types.API_ARG_OPTIONS;
import decorator from "../../lib/decorator";
import expandify from "../../lib/expandify";
import botox_validatable_factory from "../validatable";
import mr from "../../lib/metadata-registry";

function botox_property_as_arg(
    validatable: botox_validatable_factory.VALIDATABLE,
) { return decorator.create_property_decorator.instance({
    init_by: (
        ctx,
    ): OPTIONS => ({
        validatable: validatable["get!"](ctx.design_type),
    })
})[expandify.expand]({

    for_each_arg(
        api: any,
        callback: (property: PropertyKey, arg: OPTIONS) => void,
    ) {
        this[mr.get_registry][mr.get_properties](api).for_each(
            (p, gr) => callback(p, gr().get()!)
        )
    },
}) }

namespace botox_property_as_arg {
    export type API_ARG = ReturnType<typeof botox_property_as_arg>;
}

export default botox_property_as_arg