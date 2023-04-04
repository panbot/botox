import { CONSTRUCTOR } from '../types';
import create_injectors from './injectors';
import create_service from './service';
import types from './types';

export default function dependency_injection() {
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

    const inject = (
        service?: types.INJECT_SERVICE
    ) => (
        ...args: Parameters<types.INJECTION_DECORATOR>
    ) => {
        injectors.route(service, args);
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
        create_inject: (
            factory: types.SERVICE_FACTORY,
        ) => inject({ type: 'factory', factory }),

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
