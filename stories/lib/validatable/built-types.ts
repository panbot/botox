import botox_validatable_factory from "@/validatable";
const btx_validatable = botox_validatable_factory();

function validate_type(input: any, type: any) {
    try {
        let options = btx_validatable["get_options!"](type);

        let parsed = options.parser(input);
        let error = options.validator?.(parsed);

        if (error) throw new Error(error, { cause: { input, type, }})
    } catch (e) {
        console.error(e);
    }
}

btx_validatable(String)(String);
validate_type('str', String);

btx_validatable(
    Number,
    parsed => isNaN(parsed) ? 'not a number'
                            : undefined,
)(Number);
validate_type(5, Number);
validate_type('5', Number);
validate_type('5.5', Number);
validate_type('5.5.5', Number);
validate_type('05', Number);
validate_type('0x5', Number);

btx_validatable(Boolean)(Boolean);
validate_type(1, Boolean);
validate_type(0, Boolean);
validate_type('', Boolean);
validate_type(true, Boolean);
validate_type(false, Boolean);

btx_validatable(
    input => {
        if (input instanceof Date) return input;

        switch (typeof input) {
            case 'string': case 'number': return new Date(input);
        }
    },
    parsed => {
        let s = parsed?.toString();
        return s == 'Invalid Date' && s
    }
)(Date);
validate_type('2023-4-5', Date);

btx_validatable(
    input => new URL(`${input}`),
)(URL);
validate_type('a', URL);
validate_type('scheme://domain', URL);
