import decorator_tools from "./decorator-tools";
import { CONSTRUCTOR, FALSY, MAYBE } from "./types";

function validatable() {

    const tools = decorator_tools.class_tools(decorator_tools.create_key<OPTIONS<any>>());

    let validatable = <T>(
        parser     : OPTIONS<INSTANCE<T>>["parser"],
        validator? : OPTIONS<INSTANCE<T>>["validator"],
    ) => tools.create_decorator<T>(
        (): OPTIONS<INSTANCE<T>> => ({
            parser,
            validator,
        })
    );

    const set_options = <T>(
        type: T,
        options: OPTIONS<INSTANCE<T>>,
    ) => tools.get_registry(type).set(options);

    return Object.assign(validatable, {

        get_options: <T>(type: T): MAYBE<OPTIONS<INSTANCE<T>>> => tools.get_registry(type).get(),

        "get_options!": <T>(type: T): OPTIONS<INSTANCE<T>> => {
            let options = tools.get_registry(type).get();
            if (!options) options = { parser: () => { throw new Error('not validatable') } }
            return options;
        },

        set_options,

        "set options for built-in types": () => {

            set_options(String, { parser: String });

            set_options(Boolean, { parser: Boolean });

            set_options(Number, {
                parser: Number,
                validator: parsed => isNaN(parsed)  ? 'not a number'
                                                    : undefined,
            });

            set_options(Date, {
                parser: input => {
                    if (input instanceof Date) return input;

                    switch (typeof input) {
                        case 'string': case 'number': return new Date(input);
                    }

                    return new Date(`Invalid Date`);
                },
                validator: parsed => parsed.toString() == 'Invalid Date' && "Invalid Date",
            });

            set_options(URL, { parser: input => new URL(`${input}`) });
        },

        assert_instance_of: <T>(v: unknown, type: CONSTRUCTOR<T>, error?: string): T => {
            if (v instanceof type) return v;
            throw new Error(error ?? `${type.name} required`);
        },
    });
}

namespace validatable {
    export type OPTIONS<T> = {
        parser: (input: unknown) => MAYBE_PROMISE<T>
        validator?: (parsed: T) => MAYBE_PROMISE<string | FALSY>
    }
}

type MAYBE_PROMISE<T> = T | Promise<T>

type INSTANCE<T>
    = T extends StringConstructor
    ? string
    : T extends NumberConstructor
    ? number
    : T extends BooleanConstructor
    ? boolean
    : T extends abstract new (...args: any) => infer U
    ? U
    : never
;

import OPTIONS = validatable.OPTIONS;

export default validatable;