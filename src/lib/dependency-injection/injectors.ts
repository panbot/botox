import decorator from "../decorator";
import expandify from "../expandify";
import { MapMap } from "../map-map";
import { CONSTRUCTOR, MAYBE } from "../types";
import { dependency_injection as di } from "./types";
import service_factory from './service';

export default function (
    get: ReturnType<typeof service_factory>["get_service"],
) {
    let injection_events: di.INJECTION[] = [];
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

        route:  (
            service: MAYBE<di.INJECT_SERVICE>,
            args: Parameters<di.INJECTION_DECORATOR>,
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

            injector(service)(...args as Parameters<di.DECORATOR_OF_INJECTOR<typeof injector>>);
        },

        drain_injection_events: (
            handlers: di.EVENT_HANDLERS["injection"][],
        ) => {
            while (injection_events.length) {
                let i = injection_events.shift()!;
                handlers.forEach(h => h(i));
            }
        },
    };

    function create_injection<P extends di.POINT>(
        service: di.INJECT_SERVICE,
        point: P,
    ) {
        let injection: di.INJECTION<P> = {
            point,
            get_service: create(),
        };
        injection_events.push(injection);

        return injection;

        function create() {
            if (!service) {
                assert_not_built_in(point.design_type);
                return () => get.by_service_key({ type: 'class', class: point.design_type });
            } else if (typeof service == 'function') {
                return () => get.by_service_key({ type: 'class', class: service() });
            } else if (typeof service == 'string') {
                return () => get.by_name(service);
            } else if (service instanceof di.Token) {
                return () => get.by_token(service);
            } else {
                return () => get.by_service_key(service);
            }
        }
    }

    function create_injectors() {
        let constructor_parameter = decorator.create_parameter_decorator.constructor({
            init_by: (
                service: di.INJECT_SERVICE,
                [ target, _, index ],
                design_type,
            ) => create_injection(service, { type: 'constructor_parameter', target, index, design_type }),
            target: decorator.target<Object>(),
        })[expandify.expand](d => ({

            instantiate: (ctor: CONSTRUCTOR<any>, args?: any[]) => new ctor(
                ...d.get_registry(ctor).get()?.reduce(
                    (pv, cv) => ( pv[cv.point.index] = cv.get_service(), pv ),
                    args || []
                ) || [],
            ),
        }));

        let instance_property = decorator.create_property_decorator.instance({
            init_by: (
                service: di.INJECT_SERVICE,
                [ target, property ],
                design_type,
            ) => create_injection(service, { type: 'instance_property', target, property, design_type }),
            target: decorator.target<Object>(),
        })[expandify.expand](d => ({

            inject: (instance: Object) => d.get_properties(instance).for_each(
                (property, get_registry) => Reflect.defineProperty(
                    instance,
                    property,
                    { value: get_registry().get()!.get_service() }
                )
            ),
        }));

        let static_property = decorator.create_property_decorator.static({
            init_by: (
                service: di.INJECT_SERVICE,
                [ target, property ],
                design_type,
            ) => create_injection(service, { type: 'static_property', target, property, design_type }),
            target: decorator.target<Object>(),
        })[expandify.expand](d => ({

            inject: (ctor: CONSTRUCTOR<Object>) => d.get_properties(ctor).for_each(
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

function assert_not_built_in(type: any) {
    // @TODO:
}