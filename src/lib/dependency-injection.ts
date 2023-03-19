import { Constructor } from './types';
import mr from './metadata-registry';

export default function () {
    let services = new Map<ServiceKey, {
        instance?: any,
        factory?: (getter: Getter) => any,
        ctor?: Constructor<any>,
        multiple?: ServiceKey[],
    }>();
    let eventHandlers: Record<Events, Function[]> = {
        instantiated: [],
    };

    function Inject(): Function;
    function Inject(name: string): Function;
    function Inject(type: () => any): Function;
    function Inject(token: TokenType<any>): Function;
    function Inject() {
        const arg = arguments[0];

        return (
            target: Object,
            property?: Property,
            index?: number,
        ) => {
            let injection = route(target, property, index);

            if (typeof arg == 'string') {
                injection.name = arg;
            } else if (typeof arg == 'function') {
                injection.type = arg as () => any;
            } else if (arg instanceof Token) {
                injection.token = arg;
            } else if (arg != null) {
                error(`unkonwn argument`, { target, property, index });
            }
        }
    }

    function Service(name: string): Function;
    function Service(token: TokenType<any>): Function;
    function Service(factory: (getter: Getter) => any): Function;
    function Service() {
        const arg = arguments[0];

        return (ctor: Constructor<any>) => {
            if (typeof arg == 'string') {
                services.set(arg, { ctor });
            } else if (arg instanceof Token) {
                if (arg.multiple) {
                    let def = services.get(arg);
                    if (def) {
                        def.multiple!.push(ctor);
                    } else {
                        services.set(arg, { multiple: [ ctor ] })
                    }
                } else {
                    services.set(arg, { ctor });
                }
           } else if (typeof arg == 'function') {
               services.set(ctor, {
                   factory: arg,
               })
           }
        }
    }

    function get(name: string): any;
    function get<T>(type: Constructor<T>): T;
    function get<T>(token: TokenType<T>): T;
    function get(arg: ServiceKey): any {
        let service = services.get(arg);
        if (!service) {
            if (typeof arg == 'function') { // a construstor
                let instance = instantiate(arg);
                services.set(arg, { instance });
                return instance;
            } else {
                error(`service "${arg.toString()}" not found`);
            }
        }

        if (service.instance) return service.instance;

        if (service.factory) {
            service.instance = service.factory(get as Getter);
        } else if (service.ctor) {
            service.instance = instantiate(service.ctor);
        } else if (service.multiple) {
            service.instance = service.multiple.map(get as Getter);
        } else {
            error(`unable to create service instance for "${arg.toString()}"`);
        }

        return service.instance;
    }

    const injections = {
        constructorParameter: new ConstructorParameterInjectionManager(develop),
        memberProperty:       new MemberPropertyInjectionManager(develop),
        staticProperty:       new StaticPropertyInjectionManager(develop),
    } as const;

    // to handle depencency loop
    let loop = new Map<Constructor<any>, any>();
    function instantiate<T extends Object>(ctor: Constructor<T>): T {
        if (loop.has(ctor)) return loop.get(ctor);

        let instance = injections.constructorParameter.instantiate(ctor);
        loop.set(ctor, instance);

        try {
            for (let handler of eventHandlers.instantiated) {
                instance = handler(instance);
            }

            injections.memberProperty.inject(instance);

            return instance;
        } catch (e) {
            throw excavateUnknownError(e);
        } finally {
            loop.delete(ctor);
        }
    }

    function on(event: 'instantiated', handler: <T>(i: T) => T): void;
    function on(event: string, handler: Function) {
        switch (event) {
            case 'instantiated':
            eventHandlers.instantiated.push(handler);
            break;

            default: throw new Error(`unknown event "${event}"`);
        }
    }

    function set<T>(name: string, instance: T): void;
    function set<T>(type: Constructor<T>, instance: T): void;
    function set<T>(token: TokenType<T>, instance: T): void;
    function set(k: any, instance: any) { services.set(k, { instance }) }

    function token<T>(
        name: string,
        multiple = false,
    ) {
        return new Token<T>(name, multiple);
    }

    return {
        token,
        Inject,
        Service,
        get,
        set,
        instantiate,
        on,

        createInject: (
            factory: (getter: typeof get) => any,
        ) => (
            target: Object,
            property: Property,
            index?: number,
        ) => {
            route(target, property, index).factory = factory;
        },
    }

    function route(
        target: Object,
        property?: Property,
        index?: number,
    ) {
        if (
            typeof target == 'function' &&
            property === undefined &&
            index !== undefined
        ) {
            return injections.constructorParameter.create(target, index);
        } else if (
            property !== undefined &&
            index === undefined
        ) {
            if (typeof target == 'function') {
                return injections.staticProperty.create(target, property);
            } else {
                return injections.memberProperty.create(target, property);
            }
        } else {
            error('unsupported decorator parameters', { target, property, index });
        }
    }

    function develop(injection: Injection): any {
        if (injection.factory) {
            return injection.factory(get as Getter);
        } else if (injection.name) {
            return get(injection.name)
        } else if (injection.token) {
            return get(injection.token);
        } else if (injection.type) {
            return get(injection.type());
        } else if (injection.ctor) {
            switch (injection.ctor) {
                case Number: case String: case Boolean: case Date: case Function: case Object:
                error(`injection signature required for generic type "${injection.ctor.name}"`, injection.point);
            }
            return get(injection.ctor);
        } else {
            error('unable to develop injection', injection.point);
        }
    }
}

class Token<T> {
    constructor(
        public name: string,
        public multiple: boolean,
    ) { }
}

export type TokenType<T = any> = Token<T>;

type Property   = string | symbol;
type ServiceKey = string | TokenType | Constructor<any>;
type Getter     = (v: ServiceKey) => any;
type Developer  = (v: Injection) => any;
type Events     = 'instantiated';

type Point = {
    target: Object,
    property?: Property,
    index?: number,
}
interface Injection<P extends Point = Point> {
    point: P,

    factory?: (getter: Getter) => any;
    name?: string;
    type?: () => any;
    token?: TokenType;
    ctor?: Constructor<any>;
}

type ConstructorParameterInjection = Injection<{
    target: Object,
    index: number,
}>;
class ConstructorParameterInjectionManager {

    private getRegistry = mr<ConstructorParameterInjection[]>().on('class');

    constructor(
        public develop: Developer,
    ) { }

    create(target: Object, index: number) {
        let injection: ConstructorParameterInjection = {
            point: { target, index },
            ctor: Reflect.getMetadata('design:paramtypes', target)[index],
        }

        this.getRegistry(target).getOrSet([]).push(injection);

        return injection;
    }

    instantiate<T>(ctor: Constructor<T>) {
        return new ctor(
            ...this.getRegistry(ctor).get()?.reduce(
                (pv, cv) => ( pv[cv.point.index] = this.develop(cv), pv ),
                [] as any[]
            ) || []
        );
    }
}

type PropertyInjection = Injection<{
    target: Object,
    property: Property,
}>;

class StaticPropertyInjectionManager {

    private getRegistry = mr<{ value: any }>().on('property');

    constructor(
        public develop: Developer,
    ) { }

    create(target: Object, property: Property) {
        let injection: PropertyInjection = {
            point: { target, property },
            ctor: Reflect.getMetadata('design:type', target, property),
        }

        // inject on create
        let registry = this.getRegistry(target, property);
        Object.defineProperty(target, property, {
            get: () => registry.getOrSet({ value: this.develop(injection) }).value,
            set: value => registry.set({ value }),
        });

        return injection;
    }
}

class MemberPropertyInjectionManager {
    private getRegistry = mr<PropertyInjection>().on('property');
    private getPropertyRegistry = mr<Property[]>().on('class');

    constructor(
        public develop: Developer,
    ) { }

    create(target: Object, property: Property) {
        let injection: PropertyInjection = {
            point: { target, property },
            ctor: Reflect.getMetadata('design:type', target, property),
        }

        this.getRegistry(target, property).set(injection);
        this.getPropertyRegistry(target).getOrSet([]).push(property);

        return injection;
    }

    inject(instance: Object) {
        let injections = new Map<Property, Injection>();
        const properties = this.getPropertyRegistry(instance).trace().flat();
        for (let property of properties) {
            const injection = this.getRegistry(instance, property).get();
            if (!injection) error('no injections found', { target: instance, property });

            // this overrides parent injections if exists
            injections.set(property, injection);
        }

        injections.forEach((i, p) => Reflect.defineProperty(instance, p, { value: this.develop(i) }));
    }
}

function error(message: string, point?: {
    target: Object,
    property?: Property,
    index?: number,
}): never {
    let location = '';
    if (point) {
        location = ' @ ';
        let { target, property, index } = point;

        location += typeof target == 'function' ? target.name
                                                : target.constructor.name;
        if (property) location += '::' + property.toString();
        else if (index != null) location += `::constructor(#${index})`;
    }

    throw new Error(message + location);
}

function excavateUnknownError(unknownError: any) {
    if (unknownError instanceof Error) throw unknownError;

    return new Error(
        asString(unknownError) ||
        asString(unknownError?.message) ||
        'unknown error');

    function asString(v: unknown) {
        if (typeof v == 'string') return v;
    }
}
