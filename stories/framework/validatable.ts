import factory from '@/framework/validatable';

const Validatable = factory();

Validatable({
    parser: String,
    inputype: 'text',
})(String);

Validatable.from_parser(
    Number
).validater(
    parsed => isNaN(parsed) ? 'not a number'
                            : undefined,
).inputype(
    'number'
)(Number);

Validatable({
    parser: Boolean,
    inputype: 'checkbox'
})(Boolean);

Validatable.from_parser(
    input => {
        switch (typeof input) {
            case 'string': case 'number': return new Date(input);
        }
        if (input instanceof Date) return input;
    }
).validater(
    parsed => {
        let s = parsed?.toString();
        return s == 'Invalid Date' && s
    }
).inputype(
    'datetime-local'
)(Date);

Validatable.from_parser(
    input => typeof input == 'string' && new URL(input),
)(URL);

console.log(Validatable.validate('5', Number));

try {
    Validatable.validate('a', Number);
} catch (e) { console.error(e) };

Validatable.validate('scheme://domain', URL);

try {
    Validatable.validate('a', URL);
} catch (e) { console.error(e) };
