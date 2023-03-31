import decorator_factory, { decorator } from "../lib/decorator";
import expandify from "../lib/expandify";
import { metadata_registry } from "../lib/metadata-registry";
import { CONSTRUCTOR } from "../lib/types";

export interface Validatable<T = any> {
    parser: (input: unknown) => T;
    validater?: (parsed: T) => string | undefined | false;
    inputype?: HTML_INPUT_TYPE;
}

export default () => decorator_factory.create_class_decorator({
    init_by: (
        _ctx,
        values: Validatable,
    ) => values,
    target: decorator_factory.target<{}>(),
})[expandify.expand](d => {
    const get = (target: CONSTRUCTOR<any>) => d[metadata_registry.get_registry](target).get();

    function validate<T>(input: unknown, against_validatable: Validatable<T>): T
    function validate<T>(input: unknown, against_type: CONSTRUCTOR<T>): T
    function validate(input: unknown, against: Validatable | CONSTRUCTOR) {
        let v: Validatable;
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
        ) => d({ parser } as Validatable<T>) as decorator.DECORATOR<ClassDecorator, Validatable<T>>,
    }
})

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