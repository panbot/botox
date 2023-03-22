import decorator, { Decorator } from "../lib/decorator";
import { Constructor } from "../lib/types";

export class ValidatableOptions<T = any> {

    constructor(
        public type: Constructor<any>,
    ) { }

    parser: (input: unknown) => T = (v) => v as any;
    validater?(parsed: T): string | undefined | false;
    inputype?: HTML_INPUT_TYPE;

    // "readonly" make this property invisible to decorator
    readonly validate = (input: unknown) => {
        let parsed = this.parser(input);
        let error = this.validater?.(parsed);
        if (error) throw new TypeError(error, {
            cause: {
                input,
                validatable: this.type.name,
            }
        });

        return parsed;
    }
}

export default function () {

    const Validatable = decorator('class')<{}>()(type => new ValidatableOptions(type));

    return Object.assign(Validatable, {

        fromParser: <T>(
            parser: (input: unknown) => T,
        ) => Validatable({ parser }) as Decorator<ClassDecorator, ValidatableOptions<T>>,

        get: (target: Constructor<any>) => Validatable.getRegistry(target).get(),

    })
}

export type HTML_INPUT_TYPE
    = 'checkbox'
    | 'date'
    | 'datetime-local'
    | 'email'
    | 'file'
    | 'hidden'
    | 'image'
    | 'month'
    | 'number'
    | 'password'
    | 'radio'
    | 'range'
    | 'tel'
    | 'text'
    | 'time'
    | 'url'
    | 'week'
;