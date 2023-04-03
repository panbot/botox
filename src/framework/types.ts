import { runnable } from "../lib/runnable";
import { CONSTRUCTOR } from "../lib/types";

export namespace botox_api_framework {

    export type MODULE_OPTIONS<MODULE extends {}> = {
        controllers?: CONSTRUCTOR<any>[],
        apis?: runnable.Runnable<any>,
        dependencies?: () => CONSTRUCTOR<MODULE>[],
    }

    export type VALIDATABLE<T = any> = {
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
