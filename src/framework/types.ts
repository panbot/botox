import { CONSTRUCTOR } from "../lib/types";

namespace botox_framework_types {

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
        validatable: VALIDATABLE_OPTIONS,
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

    export type METHODS<T> = keyof {
        [ P in keyof T as T[P] extends (...args: any) => any ? P : never ]: any
    }

    export type METHOD_INVOKER = <
        T,
        K extends METHODS<T>,
        ARGS extends T[K] extends (...args: infer U) => any ? U : never
    >(
        t: T,
        k: K,
        args: ARGS
    ) => T[K] extends (...args: any) => infer U ? U : never
}

export default botox_framework_types