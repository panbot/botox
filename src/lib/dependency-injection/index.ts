import { CONSTRUCTOR } from '../types';
import create_injectors from './injectors';
import create_service from './service';
import types from './types';

function dependency_injection() {
    const service = create_service(instantiate);
    const get = service.get_service;
    const injectors = create_injectors(get.by_service_key);

    const event_handlers: {
        [ P in types.EVENT ]: types.EVENT_HANDLERS[P][]
    } = {
        instantiated: [],
        injection: [
            i => i.point.type == 'static_property'
                && injectors.static_property.inject(i.point.target)
        ],
    };

    // to handle depencency loop
    let instantiation_loop = new Map<CONSTRUCTOR<any>, any>();

    const inject: {
        <T, P extends P_EXTENDS<T>, I extends I_EXTENDS<P>>(            ): DECORATOR<T, P, I>
        <T, P extends P_EXTENDS<T>, I extends I_EXTENDS<P>>(name: string): DECORATOR<T, P, I>

        <T, P extends P_EXTENDS<T>, I extends I_EXTENDS<P>>(token    :       types.Token<TYPE<T, P, I>>) : DECORATOR<T, P, I>
        <T, P extends P_EXTENDS<T>, I extends I_EXTENDS<P>>(get_type : () => CONSTRUCTOR<TYPE<T, P, I>>) : DECORATOR<T, P, I>
        <T, P extends P_EXTENDS<T>, I extends I_EXTENDS<P>>(service  : types.SERVICE_KEY<TYPE<T, P, I>>) : DECORATOR<T, P, I>
     } = (
        service?: types.INJECT_SERVICE
    ) => (
        target: Object, property?: PropertyKey, index?: number
    ) => {
        injectors.route(service, [ target, property, index ]);
        injectors.drain_injection_events(event_handlers.injection);
    }

    return {
        create_token: <T>(
            description: string,
            multiple?: boolean,
        ) => new types.Token<T>(description, !!multiple),

        get,
        set: service.set_service,

        service,

        instantiate,

        inject,

        create_inject: <T, P extends P_EXTENDS<T>, I extends I_EXTENDS<P>>(
            factory: types.SERVICE_FACTORY<TYPE<T, P, I>>,
        ) => (t: T, p?: P, i?: I) => void inject({ type: 'factory', factory })(t, p, i),

        on: <E extends types.EVENT>(
            event: E,
            handler: types.EVENT_HANDLERS[E]
        ) => event_handlers[event].push(handler),
    }

    function instantiate<T>(
        constructor: CONSTRUCTOR<T>,
        args?: ConstructorParameters<CONSTRUCTOR<T>>,
    ): T {
        let instance = instantiation_loop.get(constructor);
        if (instance) return instance;

        instantiation_loop.set(
            constructor,
            instance = injectors.constructor_parameter.instantiate(constructor, args)
        );

        try {
            for (let handler of event_handlers.instantiated) {
                instance = handler(instance);
            }

            injectors.instance_property.inject(instance);

            return instance;
        } catch (e) {
            throw e;
        } finally {
            instantiation_loop.delete(constructor);
        }
    }
}

namespace dependency_injection {

    export type P_EXTENDS<T> = T extends abstract new (...args: any) => any ? undefined : any
    export type I_EXTENDS<P> = P extends undefined ? number : undefined

    type P_OF_T<P, T, O = never> = P extends keyof T ? T[P] : O
    type ARGS_OF_T<T>
        = T extends abstract new (...args: infer U) => any
        ? U
        : never
    ;
    export type TYPE<T, P, I> = P_OF_T<I, ARGS_OF_T<T>, P_OF_T<P, T>>

    export import Token = types.Token
}

export default dependency_injection

type DECORATOR<
    T,
    P extends P_EXTENDS<T>,
    I extends I_EXTENDS<P>,
> = (target: T, property?: P, index?: I) => void
import TYPE = dependency_injection.TYPE
import P_EXTENDS = dependency_injection.P_EXTENDS
import I_EXTENDS = dependency_injection.I_EXTENDS