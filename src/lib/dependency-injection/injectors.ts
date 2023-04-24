import { MapMap } from "../map-map";
import { CONSTRUCTOR, P_OF_T } from "../types";
import types from "./types";
import mr from "../metadata-registry";
import decorator_tools from "../decorator-tools";

export default function (
    get_by_service_key: <T>(service_key: types.SERVICE_KEY<T>) => T,
) {
    let injection_events: types.INJECTION<types.POINT>[] = [];
    let injectors = {
        constructor_parameter : create_constructor_parameter_injector(),
        instance_property     : create_instance_property_injector(),
        static_property       : create_static_property_injector(),
    }
    const routes = new MapMap<
        [
            boolean, // typeof target == "function"
            boolean, // property != null
            boolean, // index != null
        ],
        (service?: types.INJECT_SERVICE<any>) => (...args: any) => void
    >();
    // typeof target == "function" , property != null , index != null , injector
    routes.set(               true ,            false ,          true , injectors.constructor_parameter );
    routes.set(               true ,             true ,         false , injectors.static_property       );
    routes.set(              false ,             true ,         false , injectors.instance_property     );

    return {
        ...injectors,

        route: (
            service: types.INJECT_SERVICE<any> | undefined,
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
        service: types.INJECT_SERVICE<unknown> | undefined,
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

    function create_constructor_parameter_injector() {
        let tools = decorator_tools.parameter_tools(
            decorator_tools.create_key<types.INJECTION<types.CONSTRUCTOR_PARAMETER_POINT>>()
        );

        let decorator = <T extends Object, I extends number>(
            service?: types.INJECT_SERVICE<T>,
        ) => tools.create_decorator<CONSTRUCTOR<T>, undefined, I>(
            ({ target, index, design_type }) => create_injection(
                service,
                { type: 'constructor_parameter', target, index, design_type }
            )
        );

        return Object.assign(decorator, {
            instantiate: <T>(ctor: CONSTRUCTOR<T>, args?: any[]) => new ctor(
                ...tools.get_registry(ctor, undefined).get()?.reduce(
                    (pv, cv) => ( pv[cv.point.index] = cv.get_service(), pv ),
                    args ?? []
                ) ?? [],
            ),
        })
    }

    function create_instance_property_injector() {
        let tools = decorator_tools.property_tools(
            decorator_tools.create_key<types.INJECTION<types.INSTANCE_PROPERTY>>()
        );

        let decorator = <T extends Object, P extends PropertyKey>(
            service?: types.INJECT_SERVICE<P_OF_T<P, T>>
        ) => tools.create_decorator<T, P>(
            ({ target, property, design_type }) => create_injection(
                service,
                { type: 'instance_property', target, property, design_type }
            )
        );

        return Object.assign(decorator, {
            inject: (instance: Object) => tools.get_registry[mr.get_properties](instance).for_each(
                (property, get_registry) => Reflect.defineProperty(
                    instance,
                    property,
                    { value: get_registry().get()!.get_service() }
                )
            ),
        })
    }

    function create_static_property_injector() {
        let tools = decorator_tools.property_tools(
            decorator_tools.create_key<types.INJECTION<types.STATIC_PROPERTY>>()
        );

        let decorator = <T extends CONSTRUCTOR<Object>, P extends PropertyKey>(
            service?: types.INJECT_SERVICE<P_OF_T<P, T>>
        ) => tools.create_decorator<T, P>(
            ({ target, property, design_type }) => create_injection(
                service,
                { type: 'static_property', target, property, design_type }
            )
        );

        return Object.assign(decorator, {
            inject: (ctor: CONSTRUCTOR<Object>) => tools.get_registry[mr.get_properties](ctor).for_each(
                (property, get_registry) => Reflect.defineProperty(
                    ctor, property,
                    {
                        get: () => get_registry().get()!.get_service(),
                        set: instance => ( get_registry().get()!.get_service = () => instance, instance ),
                    }
                )
            ),
        })
    }
}
