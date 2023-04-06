import types from "../types";
import OPTIONS = types.API_ARG_OPTIONS;
import decorator from "../../lib/decorator";
import expandify from "../../lib/expandify";
import botox_validatable_factory from "../validatable";
import mr from "../../lib/metadata-registry";

function botox_parameter_as_arg(
    validatable: botox_validatable_factory.VALIDATABLE,
) { return decorator.create_parameter_decorator.instance_method({
    init_by: (
        ctx,
    ): OPTIONS => ({
        validatable: validatable["get!"](ctx.design_type),
    })
})[expandify.expand]({

    for_each_arg(
        api: any,
        property: PropertyKey,
        callback: (index: number, arg: OPTIONS) => void,
    ) {
        this[mr.get_registry](api, property).get()?.forEach(
            (arg, index) => callback(index, arg)
        );
    }
}) }

namespace botox_parameter_as_arg {
    export type API_ARG = ReturnType<typeof botox_parameter_as_arg>;
}

export default botox_parameter_as_arg