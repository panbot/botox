import { createHmac } from 'node:crypto';

function jwt(secret: string, algorithm: string) {

    return {

        encode: (object: Object) => {
            let buf = Buffer.from(JSON.stringify(object));
            return trim(buf.toString('base64')) + '.' + trim(sign(buf));
        },

        decode: (jwt: string) => {
            return JSON.parse(verify(jwt).toString('utf8'));
        },
    }

    function sign(s: Buffer) {
        return createHmac(algorithm, secret).update(s).digest('base64');
    }

    function verify(jwt: string) {
        let parts = jwt.split('.');
        let signature_to_test  : string;
        let signature_to_match : string;
        let payload: string;
        switch (parts.length) {
            case 3:
            payload = parts[1]!;
            signature_to_match = sign(Buffer.from(parts[0]! + '.' + parts[1]!));
            signature_to_test  = parts[2]!;
            break;

            case 2:
            payload = parts[0]!;
            signature_to_match = sign(Buffer.from(parts[0]!, 'base64'));
            signature_to_test  = parts[1]!;
            break;

            default:
            throw new Error(`invalid jwt: wrong part size`);
        }

        if (trim(signature_to_match) != trim(signature_to_test)) {
            throw new Error(`invalid jwt: signature mismatch`)
        }

        return Buffer.from(payload, 'base64');
    }

}

function trim(base64: string) {
    let i = base64.length - 1;
    for (; i >= 0 && base64[i] == '='; --i);
    return base64.substring(0, i + 1);
}

export default jwt;