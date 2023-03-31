import decorator from "../decorator";
import expandify from "../expandify";
import { CONSTRUCTOR, INSTANTIATOR } from "../types";
import { dependency_injection as di } from "./types";
import { metadata_registry as mr } from "../metadata-registry";

export default function (
    instantiate: INSTANTIATOR,
) {
    type TARGET = Object;
    type INSTANCE_KEY = string | di.Token | CONSTRUCTOR;
    let names = new Map<string, CONSTRUCTOR<TARGET>>();
    let instances = new Map<INSTANCE_KEY, any>();

    const by_name = create_get_by((name: string) => {
        let constructor = names.get(name);
        return constructor && by_class(constructor)
    });
    const by_token = create_get_by((token: di.Token) => {
        if (!token.services.length) not_found(token.toString());

        return token.multiple
            ? token.services.map(by_class)
            : by_class(token.services[0]!);
    });
    const by_class = create_get_by((type: CONSTRUCTOR) => {
        let instance
            =  service_decorator[mr.get_registry](type).get_own()?.factory?.(get_service)
            || instantiate(type);
        instances.set(type, instance);
        return instance;
    });

    const by_get_class = ( get_class : () => CONSTRUCTOR  ) => by_class(get_class());
    const by_factory   = ( factory   : di.SERVICE_FACTORY ) => factory (get_service);

    const getters = {
        by_name,
        by_token,
        by_class,
        by_get_class,
        by_factory,

        by_service_key(service_key: di.SERVICE_KEY) {
            switch (service_key.type) {
                case 'name'      : return by_name      (service_key.name       )
                case 'token'     : return by_token     ( service_key.token     )
                case 'class'     : return by_class     ( service_key.class     )
                case 'get_class' : return by_get_class ( service_key.get_class )
                case 'factory'   : return by_factory   ( service_key.factory   )

                default: throw new Error('should not be here');
            }
        },
    };

    const get_service: di.GET_SERVICE = (service_key: INSTANCE_KEY | di.SERVICE_KEY) => {
        if      ( typeof service_key == 'string'   ) return getters.by_name (service_key)
        else if ( typeof service_key == 'function' ) return getters.by_class(service_key)
        else if ( service_key instanceof di.Token  ) return getters.by_token(service_key)

        return getters.by_service_key(service_key);
    }

    const set_service: {
        (name: string, instance: any): void
        <T>(token: di.Token<T>, instance: T): void
        <T>(constructor: CONSTRUCTOR<T>, instance: T): void
    } = (k: any, v: any) => void instances.set(k, v);

    class ServiceDecoratorOption {

        #name?: string;
        get name() { return this.#name }
        set name(v: string | undefined) {
            this.#name = v;
            if (!v) return;

            names.set(v, this.type);
        }

        #token?: di.Token;
        get token() { return this.#token }
        set token(v: di.Token | undefined) {
            this.#token = v;
            if (!v) return;

            v.services.push(this.type);
        }

        public factory?: di.SERVICE_FACTORY;

        constructor (
            public type: CONSTRUCTOR<TARGET>,
        ) {  }
    };

    const service_decorator = decorator.create_class_decorator({
        init_by: (
            ctx,
            value: string | di.Token | di.SERVICE_FACTORY,
        ) => {
            let options = new ServiceDecoratorOption(ctx.args[0]);

            if      ( typeof value == 'string'   ) options.name    = value;
            else if ( typeof value == 'function' ) options.factory = value;
            else if ( value instanceof di.Token  ) options.token   = value;

            return options;
        },
        target: decorator.target<TARGET>(),
    });

    return service_decorator[expandify.expand]({
        get_service: Object.assign(get_service, getters),
        set_service,
    })

    function create_get_by<T extends [ any ]>(
        cb: (...args: T) => any
    ) {
        return (
            ...args: T
        ) => {
            let instance = instances.get(args[0]);
            if (instance) return instance;

            return cb(...args);
        }
    }

    function not_found(service: string): never {
        throw new Error(`service ${service} not found`);
    }
}