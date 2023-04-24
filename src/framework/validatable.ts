import types from "./types";
import assert from 'node:assert';
import { MAYBE } from "../lib/types";

import OPTIONS = types.VALIDATABLE_OPTIONS;
import decorator_tools from "../lib/decorator-tools";

function botox_validatable_factory() {

    let tools = decorator_tools.class_tools(decorator_tools.create_key<OPTIONS>());

    type TYPE_OF<T>
        = T extends string
        ? StringConstructor
        : T extends number
        ? NumberConstructor
        : T extends boolean
        ? BooleanConstructor
        : abstract new (...args: any) => T
    ;

    let validatable = <T>(
        parser     : OPTIONS<T>["parser"],
        validator? : OPTIONS<T>["validator"],
    ) => tools.create_decorator<TYPE_OF<T>>(
        (): OPTIONS<T> => ({
            parser,
            validator,
        })
    );

    return Object.assign(validatable, {

        get_options: <T>(type: TYPE_OF<T>): MAYBE<OPTIONS<T>> => tools.get_registry(type).get(),

        "get_options!": <T>(type: TYPE_OF<T>): OPTIONS<T> => {
            let options = tools.get_registry(type).get();
            if (!options) options = { parser: () => assert(false, 'not validatable') }
            return options;
        },
    });
}

namespace botox_validatable_factory {
    export type VALIDATABLE = ReturnType<typeof botox_validatable_factory>;
}

export default botox_validatable_factory