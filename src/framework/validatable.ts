import decorator from "../lib/decorator";

export type ValidatableOptions = {
    parse?(input: unknown): any;
    validate?(parsed: any): string | undefined;
    inputype?: HTML_INPUT_TYPE,
}

export default function () {

    const decorate = decorator('class')<{}>()(() => ({}) as ValidatableOptions);

    const Validatable = <T>(
        parse: (input: unknown) => T,
        validate?: (parsed: T) => string | undefined,
        inputype?: HTML_INPUT_TYPE,
    ) => decorate({ parse, validate, inputype });

    return {
        Validatable,
        get: decorate.getRegistry,
    }
}

// TypedValidatable<string>()({
//     parse: String,
//     inputype: 'text',
// })(String);

// TypedValidatable<number>()({
//     parse: Number,
//     validate: parsed => isNaN(parsed) ? 'not a number'
//                                       : undefined,
//     inputype: 'number',
// })(Number);

// TypedValidatable<boolean>()({
//     parse: Boolean,
//     inputype: 'checkbox',
// })(Boolean);

// TypedValidatable<Date | undefined>()({
//     parse: input => {
//         switch (typeof input) {
//             case 'string': case 'number': return new Date(input)
//         }
//         if (input instanceof Date) return input;
//     },
//     validate: parsed => parsed?.toString() == 'Invalid Date' ? 'Invalid Date'
//                                                             : undefined,
// })(Date)


// Validatable(
//     input => {
//         switch (typeof input) {
//             case 'string': case 'number': return new Date(input)
//         }
//         if (input instanceof Date) return input;
//     },
//     parsed => {
//         let s = parsed?.toString();
//         if (s == 'Invalid Date') return s;
//     },
//     'datetime-local'
// )(Date);

export type HTML_INPUT_TYPE = 'checkbox'
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