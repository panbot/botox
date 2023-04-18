import decorator from "../lib/decorator";
import { CONSTRUCTOR, FALSY } from "../lib/types";

namespace botox_framework_types {

    export type MODULE_OPTIONS = {
        dependencies?: () => CONSTRUCTOR[],
        controllers?: CONSTRUCTOR[],
        apis?: CONSTRUCTOR[],
    }

    export type API_OPTIONS = {

    }

    export type API_ARG_OPTIONS = {
        validatable: VALIDATABLE_OPTIONS & decorator.THIS_TYPE_IS_TARGET,
    }

    export type VALIDATABLE_OPTIONS<T = any> = {
        parser: (input: unknown) => T;
        validator?: (parsed: T) => string | FALSY;
    }

    export type METHODS<T> = keyof {
        [ P in keyof T as T[P] extends (...args: any) => any ? P : never ]: any
    }

    export type METHOD_INVOKER = <
        T,
        K extends METHODS<T>,
        ARGS extends T[K] extends (...args: infer U) => any ? U : never
    >(
        target: T,
        method: K,
        args: ARGS
    ) => T[K] extends (...args: any) => infer U ? U : never
}

export default botox_framework_types