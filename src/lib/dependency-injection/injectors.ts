import decorator from "../decorator";
import expandify from "../expandify";
import { MapMap } from "../map-map";
import { CONSTRUCTOR, MAYBE } from "../types";
import types from "./types";
import mr from "../metadata-registry";

export default function (
    get_by_service_key: <T>(service_key: types.SERVICE_KEY<T>) => T,
) {
    let injection_events: types.INJECTION[] = [];
    let injectors = create_injectors();

    const routes = new MapMap<
        [
            boolean, // typeof target == "function"
            boolean, // property != null
            boolean, // index != null
        ],
        typeof injectors[keyof typeof injectors]
    >();
    // typeof target == "function" | property | index
    routes.set(               true ,    false ,  true , injectors.constructor_parameter );
    routes.set(               true ,     true , false , injectors.static_property       );
    routes.set(              false ,     true , false , injectors.instance_property     );

    return {
        ...injectors,

        route: (
            service: MAYBE<types.INJECT_SERVICE>,
            args: [ target: any, property: any, index: any ],
        ) => {
            let [ target, property, index ] = args;

            let injector = routes.get(
                typeof target == 'function',
                property != null,
                index != null,
            );
            if (!injector) throw new types.InjectionError(
                'unsupported injection point',
                { target, property, index }
            );

            injector(service)(...args);
        },

        drain_injection_events: (
            handlers: types.EVENT_HANDLERS["injection"][],
        ) => {
            while (injection_events.length) {
                let i = injection_events.shift()!;
                handlers.forEach(h => h(i));
            }
        },
    };

    function create_injection<P extends types.POINT>(
        service: types.INJECT_SERVICE,
        point: P,
    ) {
        let injection: types.INJECTION<P> = {
            point,
            get_service: () => types.InjectionError.try(
                () => get_by_service_key(create_service_key()),
                point
            ),
        };
        injection_events.push(injection);

        return injection;

        function create_service_key(): types.SERVICE_KEY<unknown> {
            if (!service) {
                return { type: 'class', class: point.design_type };
            } else if (typeof service == 'function') {
                return { type: 'class', class: service() };
            } else if (typeof service == 'string') {
                return { type: 'name', name: service };
            } else if (service instanceof types.Token) {
                return { type: 'token', token: service };
            } else {
                return service;
            }
        }
    }

    function create_injectors() {
        let constructor_parameter = decorator.create_parameter_decorator.constructor({
            init_by: (
                { args: [ target, _property, index ], design_type },
                service: types.INJECT_SERVICE,
            ) => create_injection(service, { type: 'constructor_parameter', target, index, design_type }),
            target: decorator.target<Object>(),
        })[expandify.expand](d => ({

            instantiate: (ctor: CONSTRUCTOR<any>, args?: any[]) => new ctor(
                ...d[mr.get_registry](ctor).get()?.reduce(
                    (pv, cv) => ( pv[cv.point.index] = cv.get_service(), pv ),
                    args || []
                ) || [],
            ),
        }));

        let instance_property = decorator.create_property_decorator.instance({
            init_by: (
                { args: [ target, property ], design_type },
                service: types.INJECT_SERVICE,
            ) => create_injection(service, { type: 'instance_property', target, property, design_type }),
            target: decorator.target<Object>(),
        })[expandify.expand](d => ({

            inject: (instance: Object) => d[mr.get_registry][mr.get_properties](instance).for_each(
                (property, get_registry) => Reflect.defineProperty(
                    instance,
                    property,
                    { value: get_registry().get()!.get_service() }
                )
            ),
        }));

        let static_property = decorator.create_property_decorator.static({
            init_by: (
                { args: [ target, property ], design_type },
                service: types.INJECT_SERVICE,
            ) => create_injection(service, { type: 'static_property', target, property, design_type }),
            target: decorator.target<Object>(),
        })[expandify.expand](d => ({

            inject: (ctor: CONSTRUCTOR<Object>) => d[mr.get_registry][mr.get_properties](ctor).for_each(
                (property, get_registry) => Reflect.defineProperty(
                    ctor, property,
                    {
                        get: () => get_registry().get()!.get_service(),
                        set: instance => ( get_registry().get()!.get_service = () => instance, instance ),
                    }
                )
            ),
        }));

        return {
            constructor_parameter,
            instance_property,
            static_property,
        }
    }
}
