import types from "../types";
import OPTIONS = types.API_OPTIONS;
import { CONSTRUCTOR, INSTANTIATOR } from "../../lib/types";
import decorator from "../../lib/decorator";
import expandify from "../../lib/expandify";
import botox_property_as_arg from "../api-arg/property-as-arg";
import validatable from "../validatable";

function botox_class_as_api(
    register: (api: CONSTRUCTOR<any>) => void,
    instantiate: INSTANTIATOR,
    invoke: (api: any) => any,
    api_arg: botox_property_as_arg.API_ARG,
    validatable: validatable.VALIDATABLE,
) { return decorator.create_class_decorator({
    init_by: (
        ctx,
        options?: OPTIONS
    ) => {
        register(ctx.args[0]);
        return options || {} satisfies OPTIONS;
    }
})[expandify.expand]({

    invoke: <API>(
        api: CONSTRUCTOR<API>,
        parameters: any,
    ) => {
        let instance = instantiate(api);
        api_arg.for_each_arg(
            instance,
            (p, arg) => instance[p as keyof API] = validatable.validate(
                parameters?.[p],
                arg.validatable
            )
        );

        return invoke(instance);
    }
}) }

namespace botox_class_as_api {
    export type API = ReturnType<typeof botox_class_as_api>
}

export default botox_class_as_api