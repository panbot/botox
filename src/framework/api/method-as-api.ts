import types from "../types";
import { CONSTRUCTOR } from "../../lib/types";
import decorator from "../../lib/decorator";

function botox_method_as_api<OPTIONS extends types.API_OPTIONS>(
    init_by: (constructor: CONSTRUCTOR, property: PropertyKey, options?: OPTIONS) => OPTIONS,
) { return decorator.create_method_decorator.instance({
    init_by: (
        ctx,
        options?: OPTIONS
    ) => init_by(ctx.args[0].constructor as CONSTRUCTOR, ctx.args[1], options),
}) }

namespace botox_method_as_api {
}

export default botox_method_as_api