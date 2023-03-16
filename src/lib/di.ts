import { Constructor } from './types';
import mr from './metadata-registry';

export default function () {

    type ServiceKey = string | Token<any> | Constructor<any>;
    let services = new Map<ServiceKey, {
        instance?: any,
        factory?: (getter: typeof get) => any,
        ctor?: Constructor<any>,
        multiple?: ServiceKey[],
    }>();
    type Events = 'instantiated';
    let eventHandlers: Record<Events, Function[]> = {
        instantiated: [],
    };

    function Inject(): Function;
    function Inject(name: string): Function;
    function Inject(type: () => any): Function;
    function Inject(token: TokenType<any>): Function;
    function Inject() {
        return (
            target: Object,
            property?: Property,
            index?: number,
        ) => {
            let injection = createInjection(target, property, index);

            const arg = arguments[0];
            if (typeof arg == 'string') {
                injection.name = arg;
            } else if (typeof arg == 'function') {
                injection.type = arg as () => any;
            } else if (arg instanceof Token) {
                injection.token = arg;
            } else if (arg != null) {
                throw { message: `unkonwn argument`, arg }
            }
        }
    }

    function Service(name: string): Function;
    function Service(token: TokenType<any>): Function;
    function Service(factory: (getter: typeof get) => any): Function;
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
        let v = services.get(arg);
        if (!v) {
            if (typeof arg == 'function') { // a construstor
                return instantiate(arg);
            } else {
                throw new Error(`service "${arg}" not found`);
            }
        }

        if (v.instance) return v.instance;

        if (v.factory) {
            v.instance = v.factory(get);
        } else if (v.ctor) {
            v.instance = instantiate(v.ctor);
        } else if (v.multiple) {
            v.instance = v.multiple.map(get as (arg: ServiceKey) => any);
        } else {
            throw new Error(`unable to create service instance due to exhaustion of options`);
        }

        return v.instance
    }

    function set(name: string, instance: any): void;
    function set<T>(type: Constructor<T>, instance: any): void;
    function set<T>(token: TokenType<T>, instance: T): void;
    function set(arg: any, instance: any) {
        services.set(arg, { instance });
    }

    function instantiate<T extends Object>(ctor: Constructor<T>) {
        let instance = new ctor(
            ...ConstructorParameterInjection.reg(ctor).get()?.reduce(
                (pv, cv) => ( pv[cv.index] = develop(cv), pv ),
                [] as any[]
            ) || []
        );

        try {
            for (let handler of eventHandlers.instantiated) {
                instance = handler(instance);
            }

            // to prevent infinite loop
            services.set(ctor, { instance });

            for (let [ property, injection ] of MemberPropertyInjection.getPropertyInjections(ctor.prototype)) {
                // @TODO:                                                                     ^ why not instance
                Reflect.defineProperty(instance, property, { value: develop(injection) });
            }

            return instance;
        } catch (e) {
            services.delete(ctor);
            throw e;
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

    class Injection {
        factory?: (getter: typeof get) => any;
        name?: string;
        type?: () => any;
        token?: Token<any>;
        ctor?: Constructor<any>;

        constructor() {
            this.init();
        }

        protected init() {}
    }

    class ConstructorParameterInjection extends Injection {

        constructor(
            public target: Object,
            public index: number,
        ) {
            super();
        }

        override init() {
            this.ctor = Reflect.getMetadata('design:paramtypes', this.target)[this.index];
            ConstructorParameterInjection.reg(this.target).getOrSet([]).push(this);
        }

        static reg = mr<ConstructorParameterInjection[]>().on('class');
    }

    abstract class PropertyInjection extends Injection {

        constructor(
            public target: Object,
            public property: Property
        ) {
            super();
        }

        override init() {
            this.ctor = Reflect.getMetadata('design:type', this.target, this.property);
        }
    }

    class StaticPropertyInjection extends PropertyInjection {
        override init() {
            super.init();

            let reg = StaticPropertyInjection.values(this.target, this.property);
            Object.defineProperty(this.target, this.property, {
                get() {
                    let value = reg.get();
                    if (!value) {
                        value = develop(this);
                        reg.set(value);
                    }
                    return value;
                },
                set(v) {
                    return this.value = v;
                },
            })
        }

        static values = mr<any>().on('property');
    }

    class MemberPropertyInjection extends PropertyInjection {
        override init() {
            super.init();

            const self = MemberPropertyInjection;
            self.names(this.target).getOrSet([]).push(this.property);
            self.reg(this.target, this.property).set(this);
        }

        static names = mr<Property[]>().on('class');
        static reg = mr<MemberPropertyInjection>().on('property');

        static getPropertyInjections(target: Object) {
            const self = MemberPropertyInjection;
            let ret = new Map<Property, Injection>();

            const properties = self.names(target).trace().flat();
            for (let property of properties) {
                const injection = self.reg(target, property).get();
                if (!injection) throw new Error(`no injections found for ${target}::${property.toString()}`);
                ret.set(property, injection);
            }

            return ret;
        }
    }

    return {
        Inject,
        Service,

        get,
        set,

        instantiate,

        createInject: (
            factory: (getter: typeof get) => any,
        ) => (
            target: Object,
            property: Property,
            index?: number,
        ) => {
            createInjection(target, property, index).factory = factory;
        },

        token: <T>(name: string, multiple: boolean = false): TokenType<T> => new Token<T>(name, multiple),

        on,
    }

    function develop(injection: Injection): any {
        if (injection.factory) {
            return injection.factory(get);
        } else if (injection.name) {
            return get(injection.name)
        } else if (injection.token) {
            return get(injection.token);
        } else if (injection.type) {
            return get(injection.type());
        } else if (injection.ctor) {
            return get(injection.ctor);
        } else {
            throw new Error([
                `cannot develop injection,`,
                `${JSON.stringify(injection, null, 4)},`,
                `insufficient information`,
            ].join(' '));
        }
    }

    function createInjection(
        target: Object,
        property?: Property,
        index?: number,
    ) {
        let injection: Injection = route();

        switch (injection.ctor) {
            case Object:
            case Number:
            case String:
            case Boolean:
                injection.ctor = undefined;
                if (!(injection.factory || injection.name || injection.token || injection.type)) {
                    throw new TypeError([
                        `injection signature required for generic types`,
                        `target=${target}`,
                        `property=${property?.toString()}`,
                        `constructor=${injection.ctor}`
                     ].join(', '))
                }
        }

        return injection;

        function route() {
            if (
                typeof target == 'function' &&
                property === undefined &&
                index !== undefined
            ) {
                return new ConstructorParameterInjection(target, index);
            } else if (
                property !== undefined &&
                index === undefined
            ) {
                if (typeof target == 'function') {
                    return new StaticPropertyInjection(target, property);
                } else {
                    return new MemberPropertyInjection(target, property);
                }
            } else {
                throw new Error(`unsupported decorator parameters`);
            }
        }
    }

}

class Token<T> {
    constructor(
        public name: string,
        public multiple: boolean,
    ) {

    }

    toString() {
        return this.name;
    }
}
export type TokenType<T> = Token<T>;

type Property = string | symbol;
