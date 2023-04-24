import decorator_tools from "./decorator-tools";
import { FALSY, MAYBE } from "./types";

function validatable() {

    let tools = decorator_tools.class_tools(decorator_tools.create_key<OPTIONS<any>>());

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
            if (!options) options = { parser: () => { throw new Error('not validatable') } }
            return options;
        },
    });
}

namespace validatable {
    export type OPTIONS<T> = {
        parser: (input: unknown) => T
        validator?: (parsed: T) => string | FALSY
    }
}

import OPTIONS = validatable.OPTIONS;

export default validatable;