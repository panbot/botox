import decorator, { Decorator } from "../lib/decorator";
import expandify from "../lib/expandify";
import { CONSTRUCTOR } from "../lib/types";

export class Validatable<T = any> {

    constructor(
        public type: CONSTRUCTOR<any>,
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

export default () => decorator('class')<{}>()(
    type => new Validatable(type)
)[expandify.expand](d => ({

    fromParser: <T>(
        parser: (input: unknown) => T,
    ) => d({ parser }) as Decorator<ClassDecorator, Validatable<T>>,

    get: (target: CONSTRUCTOR<any>) => d.getRegistry(target).get(),
}))

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