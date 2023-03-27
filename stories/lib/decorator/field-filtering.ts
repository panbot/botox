import decorator from "@/lib/decorator";
import { IS } from "@/lib/types";
import { assert_true } from "stories/asserts";

class ValidatableOptions<T = any> {

    parser: (input: unknown) => T = (v) => v as any;
    validater?(parsed: T): string | undefined | false;

    // use "readonly" to filter this property out
    readonly validate = (input: unknown) => {
        let parsed = this.parser(input);
        let error = this.validater?.(parsed);
        if (error) throw new TypeError(error);

        return parsed;
    }
}

const Validatable = decorator.create_class_decorator({
    init_by: () => new ValidatableOptions(),
    target: decorator.target<{}>(),
})

type Keys = keyof ReturnType<typeof Validatable>;

type ParserKeyExists = Keys & "parser";
assert_true< IS<Keys & "parser", "parser"> >();

type ValidatorKeyExists = Keys & "validater";
assert_true< IS<Keys & "validater", "validater"> >();

type ValidateKeyExists = Keys & "validate";
assert_true< IS<Keys & "validate", never> >();
