import factory from '@/framework/validatable';

const Validatable = factory();

Validatable({
    parser: String,
    inputype: 'text',
})(String);

Validatable.fromParser(
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

Validatable.fromParser(
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

Validatable.fromParser(
    input => typeof input == 'string' && new URL(input),
)(URL);

console.log(Validatable.get(Number)?.validate('5'));

try {
    Validatable.get(Number)?.validate('a');
} catch (e) { console.error(e) };

Validatable.get(URL)?.validate('scheme://domain');

try {
    Validatable.get(URL)?.validate('a');
} catch (e) { console.error(e) };
