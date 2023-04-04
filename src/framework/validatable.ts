import decorator from "../lib/decorator";
import expandify from "../lib/expandify";
import mr from "../lib/metadata-registry";
import { CONSTRUCTOR } from "../lib/types";
import types from "./types";

import OPTIONS = types.VALIDATABLE_OPTIONS;

namespace validatable {
    export const factory = () => decorator.create_class_decorator({
        init_by: (
            _ctx,
            values: OPTIONS,
        ) => values,
        target: decorator.target<{}>(),
    })[expandify.expand](d => {
        const get = (target: CONSTRUCTOR<any>) => d[mr.get_registry](target).get();

        function validate<T>(input: unknown, against_validatable: OPTIONS<T>): T
        function validate<T>(input: unknown, against_type: CONSTRUCTOR<T>): T
        function validate(input: unknown, against: OPTIONS | CONSTRUCTOR) {
            let v: OPTIONS;
            if (typeof against == 'function') {
                let found = get(against);
                if (!found) throw new Error(`${against.name} is not validatable`);

                v = found;
            } else {
                v = against;
            }
            const { parser, validater } = v;

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
        }
    });

    export type VALIDATABLE = ReturnType<typeof factory>;

}

export default validatable