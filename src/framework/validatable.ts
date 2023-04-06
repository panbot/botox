import decorator from "../lib/decorator";
import expandify from "../lib/expandify";
import mr from "../lib/metadata-registry";
import { CONSTRUCTOR } from "../lib/types";
import types from "./types";

import OPTIONS = types.VALIDATABLE_OPTIONS;

function botox_validatable_factory() { return decorator.create_class_decorator({
    init_by: (
        _,
        options: OPTIONS
    ) => options,
    target: decorator.target<{}>(),
})[expandify.expand](d => {

    const get = (type: CONSTRUCTOR<any>) => d[mr.get_registry](type).get();

    function validate<T>(input: unknown, options: OPTIONS<T>): T {
        const { parser, validater } = options;

        let parsed = parser(input);
        let error = validater?.(parsed);
        if (error) throw new TypeError(error, { cause: { input } });

        return parsed;
    }

    return {
        get,
        validate,
        from_parser: <T>(
            parser: (input: unknown) => T,
        ) => d(
            { parser } as OPTIONS<T>
        ) as decorator.DECORATOR<ClassDecorator, OPTIONS<T>>,
        "get!": (type: CONSTRUCTOR<any>) => {
            let options = get(type);
            if (!options) options = {
                parser: () => { throw new TypeError('not validatable') }
            }
            return options;
        },
    }
}) }

namespace botox_validatable_factory {
    export type VALIDATABLE = ReturnType<typeof botox_validatable_factory>;
}

export default botox_validatable_factory