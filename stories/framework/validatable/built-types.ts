import botox_validatable_factory from "@/framework/validatable";
const btx_validatable = botox_validatable_factory();

function validate_type(v: any, type: any) {
    try {
        btx_validatable.validate(v, btx_validatable["get!"](type))
    } catch (e) {
        console.error(e);
    }
}

btx_validatable({
    parser: String,
    inputype: 'text',
})(String);
validate_type('str', String);

btx_validatable.from_parser(
    Number
).validater(
    parsed => isNaN(parsed) ? 'not a number'
                            : undefined,
).inputype(
    'number'
)(Number);
validate_type(5, Number);
validate_type('5', Number);
validate_type('5.5', Number);
validate_type('5.5.5', Number);
validate_type('05', Number);
validate_type('0x5', Number);

btx_validatable({
    parser: Boolean,
    inputype: 'checkbox'
})(Boolean);
validate_type(1, Boolean);
validate_type(0, Boolean);
validate_type('', Boolean);
validate_type(true, Boolean);
validate_type(false, Boolean);

btx_validatable.from_parser(
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
validate_type('2023-4-5', Date);

btx_validatable.from_parser(
    input => typeof input == 'string' && new URL(input),
)(URL);
validate_type('a', URL);
validate_type('scheme://domain', URL);
