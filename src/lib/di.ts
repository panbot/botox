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
            i => i.point.type == 'static_property'
                && injectors.static_property.inject(i.point.target as CONSTRUCTOR<any>),
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
            factory: SERVICE_FACTORY,
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
            return get(injection.service)
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

        function create_service(): MAYBE<SERVICE_KEY> {
            if (!service) return;

            if (typeof service == 'string') {
                return { type: 'name', name: service };
            } else if (typeof service == 'function') {
                return { type: 'get_type', get_type: service };
            } else if (service instanceof Token) {
                return { type: 'token', token: service };
            } else {
                return service;
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

    type SERVICE_OPTIONS = {
        factory?: (get: GETTER) => any,
        name?: string,
        token?: Token,
    }
    function create_service_decorator() {
        return decorator.create_class_decorator({
            init_by: (
                value: string | Token | ((get: GETTER) => any),
                [ constructor ],
            ): SERVICE_OPTIONS => {
                let options: SERVICE_OPTIONS = {};
                if (typeof value == 'string') {
                    options.name = value;

                } else if (value instanceof Token) {
                    options.token = value;
                    options.token.services.push({ type: 'class', constructor });
                } else {
                    options.factory = value;
                }
                return options;
            },
            target: decorator.target<{}>(),
        });
    }
}


class Token<T = any> {
    #t!: T;

    public services: SERVICE_KEY[] = [];

    constructor(
        public description: string,
        public multiple: boolean = false,
    ) { }
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

type SERVICE_VALUE = string | Token | (() => any) | SERVICE_KEY
type SERVICE_ARG = MAYBE<SERVICE_VALUE>

type INJECTION<P extends POINT = POINT> = {
    point: P,
    service: MAYBE<SERVICE_KEY>,
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

type SERVICE_KEY = {
    type: 'name',
    name: string,
} | {
    type: 'token',
    token: Token,
} | {
    type: 'get_type',
    get_type: () => any,
} | {
    type: 'factory',
    factory: (getter: GETTER) => any;
} | {
    type: 'class',
    constructor: CONSTRUCTOR<any>,
}

type GETTER = (v: SERVICE_KEY) => any;

type SERVICE_FACTORY = (get: GETTER) => any