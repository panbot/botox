import types from "../types";
import decorator from "../../lib/decorator";
import expandify from "../../lib/expandify";
import botox_validatable_factory from "../validatable";
import mr from "../../lib/metadata-registry";

function botox_property_as_arg<OPTIONS extends types.API_ARG_OPTIONS>(
    validatable: botox_validatable_factory.VALIDATABLE,
    init_by: (base: types.API_ARG_OPTIONS) => OPTIONS,
) { return decorator.create_property_decorator.instance({
    init_by: (
        ctx,
    ) => init_by({
        validatable: validatable["get_options!"](ctx.design_type),
    })
})[expandify.expand]({

    for_each_arg<API extends Object>(
        api: API,
        callback: (property: keyof API, arg: OPTIONS) => void,
    ) {
        this[mr.get_registry][mr.get_properties](api).for_each(
            (p, gr) => callback(p as any, gr().get()!)
        )
    },
}) }

namespace botox_property_as_arg {
    export type API_ARG = ReturnType<typeof botox_property_as_arg>;
}

export default botox_property_as_arg