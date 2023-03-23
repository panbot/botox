import decorator from "@/lib/decorator";

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

const Decorator = decorator("class").init(() => new ValidatableOptions())()
type Decorator = typeof Decorator;

type Keys = keyof Decorator;

type ParserKeyExists = Keys & "parser";
//   ^?

type ValidatorKeyExists = Keys & "validater";
//   ^?

type ValidateKeyExists = Keys & "validate";
//   ^?
