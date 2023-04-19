import types from "../types";
import { CONSTRUCTOR } from "../../lib/types";
import decorator from "../../lib/decorator";
import expandify from "../../lib/expandify";
import mr from '../../lib/metadata-registry'

function botox_method_as_api<
    OPTIONS extends types.API_OPTIONS,
    ARGS extends any[],
>(
    init_by: (constructor: CONSTRUCTOR, property: PropertyKey, ...args: ARGS) => OPTIONS,
) { return decorator.create_method_decorator.instance({
    init_by: (
        ctx,
        ...args: ARGS
    ) => init_by(ctx.args[0].constructor as CONSTRUCTOR, ctx.args[1], ...args),
})[expandify.expand]({

    get_options(api: CONSTRUCTOR, property: PropertyKey) {
        return this[mr.get_registry](api, property)
    },

    for_each_api(
        api: CONSTRUCTOR,
        callback: (property: PropertyKey, arg: OPTIONS) => void,
    ) {
        this[mr.get_registry][mr.get_properties](api).for_each(
            (p, gr) => callback(p, gr().get_own()!)
        )
    }

    // get_options(api: CONSTRUCTOR) {
    //     return this[mr.get_registry](api).get_own()
    // },
}) }

namespace botox_method_as_api {
}

export default botox_method_as_api