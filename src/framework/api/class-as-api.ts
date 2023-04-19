import types from "../types";
import { CONSTRUCTOR } from "../../lib/types";
import decorator from "../../lib/decorator";
import expandify from "../../lib/expandify";
import mr from '../../lib/metadata-registry'

function botox_class_as_api<
    OPTIONS extends types.API_OPTIONS,
    ARGS extends any[],
>(
    init_by: (constructor: CONSTRUCTOR, ...args: ARGS) => OPTIONS,
) { return decorator.create_class_decorator({
    init_by: (
        ctx,
        ...args: ARGS
    ) => init_by(ctx.args[0], ...args),
})[expandify.expand]({

    get_options(api: CONSTRUCTOR) {
        return this[mr.get_registry](api).get_own()
    },
}) }

namespace botox_class_as_api {

}

export default botox_class_as_api