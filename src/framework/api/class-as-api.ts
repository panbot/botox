import types from "../types";
import { CONSTRUCTOR } from "../../lib/types";
import decorator from "../../lib/decorator";

function botox_class_as_api<OPTIONS extends types.API_OPTIONS>(
    init_by: (constructor: CONSTRUCTOR, options?: OPTIONS) => OPTIONS,
) { return decorator.create_class_decorator({
    init_by: (
        ctx,
        options?: OPTIONS
    ) => init_by(ctx.args[0], options),
}) }

namespace botox_class_as_api {

}

export default botox_class_as_api