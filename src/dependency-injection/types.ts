import { CONSTRUCTOR } from "../types";

namespace dependency_injection_types {

    export class Token<T = any> {
        #t!: T;

        services: CONSTRUCTOR<T>[] = [];

        constructor(
            public description: string,
            public multiple: boolean,
        ) { }

        toString() {
            return `Token(${this.description})`
        }
    }

    export type SERVICE_FACTORY<T = unknown> = (get: GET_SERVICE) => T

    export type SERVICE_KEY<T = unknown> = {
        type: 'name',
        name: string,
    } | {
        type: 'token',
        token: Token<T>,
    } | {
        type: 'get_class',
        get_class: () => CONSTRUCTOR<T>,
    } | {
        type: 'factory',
        factory: SERVICE_FACTORY<T>;
    } | {
        type: 'class',
        class: CONSTRUCTOR<T>,
    }

    export type GET_SERVICE = {
           (name        : string         ): any
        <T>(token       : Token<T>       ): T
        <T>(constructor : CONSTRUCTOR<T> ): T
        <T>(servic_key  : SERVICE_KEY<T> ): T
    }

    export type CONSTRUCTOR_PARAMETER_POINT = {
        type        : 'constructor_parameter'
        target      : CONSTRUCTOR<Object>
        index       : number
        design_type : any
    }
    export type STATIC_PROPERTY = {
        type        : 'static_property'
        target      : CONSTRUCTOR<Object>
        property    : PropertyKey
        design_type : any
    }
    export type INSTANCE_PROPERTY = {
        type        : 'instance_property'
        target      : Object
        property    : PropertyKey
        design_type : any
    }
    export type POINT
        = CONSTRUCTOR_PARAMETER_POINT
        | STATIC_PROPERTY
        | INSTANCE_PROPERTY
    ;

    export type INJECTION<P extends POINT> = {
        point: P,
        get_service: () => any,
    }

    export type INJECT_SERVICE<T> = string | Token<T> | ( () => CONSTRUCTOR<T> ) | SERVICE_KEY<T>

    export type EVENT_HANDLERS = {
        'instantiated': <T>(instance: T) => T,
        'injection': (injection: INJECTION<POINT>) => void,
    }

    export type EVENT = keyof EVENT_HANDLERS

    export class InjectionError extends Error {
        constructor(message: string, point: { target: any, property?: any, index?: any }) {
            super(message, { cause: point });
        }

        static try<T>(cb: () => T, point: { target: any, property?: any, index?: any }) {
            try {
                return cb();
            } catch (e) {
                let message = (e as any)?.message;
                throw new this(typeof message == 'string' ? message : `${e}`, point);
            }
        }
    }
}

export default dependency_injection_types;
