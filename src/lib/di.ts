import decorator from './decorator';
import expandify from './expandify';
import { MapMap } from './map-map';
import { CONSTRUCTOR, MAYBE, typram } from './types';

export default function () {

    const injectors = create_injectors();
    type INJECTORS = typeof injectors;

    let event_handlers: {
        [ P in EVENT ]: EVENT_HANDLERS[P][]
    } = {
        instantiated: [],
        injection: [
            i =>    i.point.type == 'static_property'
                &&  injectors.static_property.inject(i.point.target as CONSTRUCTOR<any>),
        ],
    };

    let injection_events: INJECTION[] = [];

    // to handle depencency loop
    let loop = new Map<CONSTRUCTOR<any>, any>();

    let services = new Map<any, any>();

    const route = create_route();

    return {

        inject: create_inject(),

        instantiate,

        create_inject: (
            factory: (getter: typeof get) => any,
        ) => create_inject({ type: 'factory', factory }),

        on: <E extends EVENT>(event: E, handler: EVENT_HANDLERS[E]) => event_handlers[event].push(handler),
    }

    function create_inject(
        preset_service?: SERVICE_ARG
    ) {
        let inject = (
            service?: SERVICE_ARG
        ) => (
            ...args: Parameters<INJECTION_DECORATOR>
        ) => route(service, args)

        return preset_service
            ? inject(preset_service)
            : inject
    }

    function instantiate<T>(
        ctor: CONSTRUCTOR<T>,
        args?: ConstructorParameters<CONSTRUCTOR<T>>,
    ): T {
        if (loop.has(ctor)) return loop.get(ctor);

        let instance = injectors.constructor_parameter.instantiate(ctor, args);
        loop.set(ctor, instance);

        try {
            for (let handler of event_handlers.instantiated) {
                instance = handler(instance);
            }

            injectors.instance_property.inject(instance);

            return instance;
        } catch (e) {
            throw e;
        } finally {
            loop.delete(ctor);
        }
    }

    function develop(injection: INJECTION): any {
        if (injection.service) {
            return services.get(injection.service)
        } else if (injection.point.design_type) {
            return get(injection.point.design_type)
        } else {
            throw new Error('unable to develop injection', { cause: { injection } });
        }
    }

    function create_injectors() {
        return {

            constructor_parameter: decorator.create_parameter_decorator.constructor({
                init_by: (
                    service: SERVICE_ARG,
                    [ target, _, index ],
                    design_type,
                ) => create_injection(service, { type: 'constructor_parameter', target, index, design_type }),
                target: decorator.target<Object>(),
            })[expandify.expand](d => ({

                instantiate: (ctor: CONSTRUCTOR<any>, args?: any[]) => new ctor(
                    ...d.get_registry(ctor).get()?.reduce(
                        (pv, cv) => ( pv[cv.point.index] = develop(cv), pv ),
                        args || []
                    ) || [],
                ),
            })),

            instance_property: decorator.create_property_decorator.instance({
                init_by: (
                    service: SERVICE_ARG,
                    [ target, property ],
                    design_type,
                ) => create_injection(service, { type: 'instance_property', target, property, design_type }),
                target: decorator.target<Object>(),
            })[expandify.expand](d => ({

                inject: (instance: Object) => d.get_properties(instance).for_each(
                    (property, get_registry) => Reflect.defineProperty(
                        instance,
                        property,
                        { value: develop(get_registry().get()!) }
                    )
                ),
            })),

            static_property: decorator.create_property_decorator.static({
                init_by: (
                    service: SERVICE_ARG,
                    [ target, property ],
                    design_type,
                ) => create_injection(service, { type: 'static_property', target, property, design_type }),
                target: decorator.target<Object>(),
            })[expandify.expand](d => ({

                inject: (ctor: CONSTRUCTOR<any>) => d.get_properties(ctor).for_each(
                    (property, get_registry) => Reflect.defineProperty(
                        ctor, property,
                        {
                            get: () => {
                                let injection = get_registry().get()!;
                                if (!injection.developed) injection.developed = { value: develop(injection) }
                                return injection.developed.value;
                            },
                            set: value => get_registry().get()!.developed = { value }
                        }
                    )
                ),
            })),
        };
    }

    function create_injection<P extends POINT>(
        service: SERVICE_ARG,
        point: P,
    ) {
        let injection: INJECTION<P> = {
            point,
            developed: null,
            service: create_service(),
        };
        injection_events.push(injection);

        return injection;

        function create_service(): MAYBE<SERVICE> {
            if (!service) return;

            if (typeof service == 'string') {
                return { name: service };
            } else if (typeof service == 'function') {
                return { get_type: service };
            } else if (service instanceof Token) {
                return { token: service }
            } else if (service.type) {
                return { factory: service }
            }
        }
    }

    function drain_injection_events() {
        while (injection_events.length) {
            let i = injection_events.shift()!;
            event_handlers.injection.forEach(h => h(i));
        }
    }

    function create_route() {
        const routes = new MapMap<
            [
                boolean, // typeof target == "function"
                boolean, // property != null
                boolean, // index != null
            ],
            INJECTORS[INJECTOR]
        >();
        // typeof target == "function" | property | index
        routes.set(               true ,    false ,  true , injectors.constructor_parameter );
        routes.set(               true ,     true , false , injectors.static_property       );
        routes.set(              false ,     true , false , injectors.instance_property     );

        return (
            service: SERVICE_ARG,
            args: Parameters<INJECTION_DECORATOR>,
        ) => {
            let [ target, property, index ] = args;

            let injector = routes.get(
                typeof target == 'function',
                property != null,
                index != null,
            );
            if (!injector) throw new Error(
                'unsupported injection point',
                { cause: { target, property, index }}
            );

            injector(service)(...args as Parameters<DECORATOR_OF_INJECTOR<typeof injector>>);

            drain_injection_events();
        }
    }

    function create_service() {
        let services = new Map<any, any>();
        return {
            get: (service: SERVICE_VALUE) => {
                let key: any;

                if (typeof service == 'string') {
                    key = service;
                } else if (typeof service == 'function') {
                    key = service();
                } else if (service instanceof Token) {
                    key = service;
                } else {

                }
            },
            set: () => {

            },
        }
    }
}


class Token<T> {
    #t!: T;
}

type INJECTION_DECORATOR
    = ParameterDecorator
    | PropertyDecorator
;

type POINT = {
    type        : INJECTOR,
    target      : Object
    property?   : PropertyKey
    index?      : number
    design_type : any
}

type SERVICE = {
    name: string,
} | {
    get_type: () => any,
} | {
    token: Token<any>,
} | {
    factory: SERVICE_FACTORY,
}
type UNION_VALUES<U>
    = U extends { [ _: PropertyKey ]: infer T }
    ? T
    : never
type SERVICE_VALUE = UNION_VALUES<SERVICE>
type SERVICE_ARG = MAYBE<SERVICE_VALUE>

type INJECTION<P extends POINT = POINT> = {
    point: P,
    service: MAYBE<SERVICE>,
    developed: MAYBE<{ value: any }>,
}

type INJECTOR
    = 'constructor_parameter'
    | 'static_property'
    | 'instance_property'
;

type DECORATOR_OF_INJECTOR<
    I extends { decorator: any }
> = I["decorator"] extends typram.Typram<infer D> ? D : never

type EVENT_HANDLERS = {
    'instantiated': <T>(instance: T) => T,
    'injection': (injection: INJECTION) => void,
}
type EVENT = keyof EVENT_HANDLERS

type SERVICE_FACTORY = {
    type: 'factory',
    factory: (getter: GETTER) => any;
}

type GETTER = (v: SERVICE_KEY) => any;
