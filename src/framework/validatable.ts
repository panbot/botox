import expandify from "../lib/expandify";
import types from "./types";
import class_decorator_tools from "../lib/decorator-tools/class";
import assert from 'node:assert';

import OPTIONS = types.VALIDATABLE_OPTIONS;
function botox_validatable_factory() {

    let factory = class_decorator_tools();

    type CONSTRUCTOR<T>
        = T extends string
        ? StringConstructor
        : T extends number
        ? NumberConstructor
        : T extends boolean
        ? BooleanConstructor
        : abstract new (...args: any) => T
    ;

    let validatable = factory.create(
        create_decorator => <T>(
            parser     : OPTIONS<T>["parser"],
            validator? : OPTIONS<T>["validator"],
        ) => create_decorator<CONSTRUCTOR<T>>(
            (ctx): OPTIONS<T> => ({
                parser,
                validator,
            })
        )
    );

    return validatable[expandify.expand]({

        get_options: (type: any) => factory.get_registry(type).get(),

        "get_options!": (type: any) => {
            let options = factory.get_registry(type).get();
            if (!options) options = { parser: () => assert(false, 'not validatable') }
            return options;
        },
    });
}

namespace botox_validatable_factory {
    export type VALIDATABLE = ReturnType<typeof botox_validatable_factory>;
}

export default botox_validatable_factory