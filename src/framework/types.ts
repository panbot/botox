import { CONSTRUCTOR } from "../lib/types";

namespace botox_api_framework_types {

    export type MODULE_OPTIONS<MODULE extends {}> = {
        dependencies?: () => CONSTRUCTOR<MODULE>[],
        controllers?: CONSTRUCTOR<any>[],
        apis?: CONSTRUCTOR<any>[],
    }

    export type API_OPTIONS = {

    }

    export type API_ARG_OPTIONS = {
        doc?: string,
        optional?: boolean,
        default?: any,
        priority?: number,
        validatable?: VALIDATABLE_OPTIONS,
    }

    export type VALIDATABLE_OPTIONS<T = any> = {
        parser: (input: unknown) => T;
        validater?: (parsed: T) => string | undefined | false;
        inputype?: HTML_INPUT_TYPE;
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
}

export default botox_api_framework_types