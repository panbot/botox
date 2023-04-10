import { CONSTRUCTOR, MAYBE } from "../types";

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

    export type INJECTION_DECORATOR<
        T = any,
        P extends keyof T = any,
    > = (target: T, property?: P, index?: number) => void

    export type SERVICE_FACTORY<T = any> = (get: GET_SERVICE) => T

    export type SERVICE_KEY<T = any> = {
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

    export type POINT = ({
        type     : "constructor_parameter"
        target   : CONSTRUCTOR<Object>
        index    : number
    } | {
        type     : "static_property"
        target   : CONSTRUCTOR<Object>
        property : PropertyKey
    } | {
        type     : "instance_property"
        target   : Object
        property : PropertyKey
    }) & { design_type: any }

    export type INJECTION<P extends POINT = POINT> = {
        point: P,
        get_service: () => any,
    }

    export type INJECT_SERVICE = MAYBE<string | Token | ( () => CONSTRUCTOR ) | SERVICE_KEY>

    export type EVENT_HANDLERS = {
        'instantiated': <T>(instance: T) => T,
        'injection': (injection: INJECTION) => void,
    }

    export type EVENT = keyof EVENT_HANDLERS

    export class InjectionError extends Error {
        constructor(message: string, point: { target: any, property?: any, index?: any }) {
            super(message, { cause: point });
        }

        static try(cb: () => any, point: { target: any, property?: any, index?: any }) {
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
