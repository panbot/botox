import types from "../types";
import OPTIONS = types.API_OPTIONS;
import { CONSTRUCTOR, INSTANTIATOR } from "../../lib/types";
import decorator from "../../lib/decorator";
import expandify from "../../lib/expandify";
import botox_parameter_as_arg from "../api-arg/parameter-as-arg";
import validatable from "../validatable";

function botox_method_as_api(
    register: (api: CONSTRUCTOR<any>, method: PropertyKey) => void,
    instantiate: INSTANTIATOR,
    invoke: types.METHOD_INVOKER,
    api_arg: botox_parameter_as_arg.API_ARG,
    validatable: validatable.VALIDATABLE,
) {
    return decorator.create_method_decorator.instance({
        init_by: (
            ctx,
            options?: OPTIONS
        ) => {
            register(ctx.args[0].constructor, ctx.args[1]);
            return options || {} satisfies OPTIONS;
        },
        target: decorator.target<any>(),
    })[expandify.expand]({

        invoke: <
            API,
            METHOD extends types.METHODS<API>,
        >(
            api: CONSTRUCTOR<API>,
            method: METHOD,
            args: any[],
        ) => {
            let instance = instantiate(api);
            let validated_args: any[] = [];
            api_arg.for_each_arg(
                instance,
                method,
                (i, arg) => {
                    validated_args[i] = validatable.validate(
                        args?.[i],
                        arg.validatable
                    )
                }
            );

            return invoke(instance, method, validated_args as any);
        }
    })
}

namespace botox_method_as_api {
    export type API = ReturnType<typeof botox_method_as_api>
}

export default botox_method_as_api