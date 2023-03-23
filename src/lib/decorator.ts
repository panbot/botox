import expandify from "./expandify";
import mr, { ANCHORS, METADATA_REGISTRY_ANCHOR } from "./metadata-registry";
import { Constructor, IsReadonly, RemoveHead } from "./types";

export default function<DT extends DECORATOR_TYPE>(on: DT) {
    return decorators[on];
}

export type Decorator<D, T> = D & Required<{
    [ P in keyof NonReadonly<T> ]: (v: T[P]) => Decorator<D, T>
}>;

type DECORATOR  =     ClassDecorator
                |    MethodDecorator
                |  PropertyDecorator
                | ParameterDecorator
;

export type DECORATOR_TYPE
    = 'class'
    | 'method'
    | 'property'
    | 'parameter'
    | 'instance_method'
    |   'static_method'
    | 'instance_property'
    |   'static_property'
    | 'instance_method_parameter'
    |   'static_method_parameter'
    |     'constructor_parameter'
;

type ReplaceFirst<List extends Array<any>, First> = [ First, ...RemoveHead<List> ]
type NonReadonly<T> = {
    [ P in keyof T as IsReadonly<T, P> extends true ? never : P ]: T[P]
}

const create = <
    TARGET_AS,
    REGISTRY_VALUE_AS,
    D extends DECORATOR,
>(
) => <MRA extends METADATA_REGISTRY_ANCHOR>(
    anchor: MRA,
    set: SETTER<D, MRA>,
) => {
    type REGISTRY_VALUE<T> = REGISTRY_VALUE_AS extends `array` ? T[] : T;

    return {
        target: createTarget(),
        init: createInit<Object>(),
    }

    function createTarget() {
        return <TARGET>() => ({ init: createInit<TARGET>() })
    }

    function createInit<TARGET>() {
        type ARG0 = TARGET_AS extends 'constructor'
            ? Constructor<TARGET>
            : TARGET_AS extends 'instance'
                ? TARGET
                : TARGET | Constructor<TARGET>
        ;
        type ARGS = ReplaceFirst<Parameters<D>, ARG0>;

        return <OPTIONS extends {}>(
            initBy: (...args: ARGS) => OPTIONS
        ) => {
            const factory = (
                values?: Partial<OPTIONS>
                        | ( (options: OPTIONS) => void )
            ) => {
                let works: ((o: OPTIONS) => void)[] = [];
                return new Proxy(
                    (...args: Parameters<D>) => {
                        let options = initBy(...args as any as ARGS);

                        if (typeof values == 'function') values(options);
                        else Object.assign(options, values);

                        works.forEach(work => work(options));

                        set(args, getRegistry, options);
                    },
                    {
                        get: (_, k, r) => (v: any) => {
                            works.push(o => o[k as keyof OPTIONS] = v);
                            return r;
                        }
                    }
                ) as Decorator<D, OPTIONS>;
            };

            const getRegistry = mr<REGISTRY_VALUE<OPTIONS>>(factory)(anchor);
            type GeRegistry = (
                ...args: ReplaceFirst<Parameters<typeof getRegistry>, ARG0>
            ) => ReturnType<typeof getRegistry>;

            return expandify(factory)[expandify.expand]({
                getRegistry: getRegistry as unknown as GeRegistry,
            })
        }
    }
}

type SETTER<D extends DECORATOR, MRA extends METADATA_REGISTRY_ANCHOR> = (
    args: Parameters<D>,
    registry: ANCHORS<any>[MRA],
    value: any,
) => void

const SETTERS: {
    class     : SETTER<     ClassDecorator, 'class'    >,
    property  : SETTER<  PropertyDecorator, 'property' >,
    parameter : SETTER< ParameterDecorator, 'property' >,
} = {
    class     : ([ t       ], gr, v) => gr(t   ).set(v),
    property  : ([ t, p    ], gr, v) => gr(t, p).set(v),
    parameter : ([ t, p, i ], gr, v) => gr(t, p).getOrSet([])[i] = v,
}

const decorators = {
    'class': create<'constructor', '', ClassDecorator>()('class', SETTERS.class),

             'method': create<           '', '', MethodDecorator>()('property', SETTERS.property),
    'instance_method': create<   'instance', '', MethodDecorator>()('property', SETTERS.property),
      'static_method': create<'constructor', '', MethodDecorator>()('property', SETTERS.property),

             'property': create<           '', '', PropertyDecorator>()('property', SETTERS.property),
    'instance_property': create<   'instance', '', PropertyDecorator>()('property', SETTERS.property),
      'static_property': create<'constructor', '', PropertyDecorator>()('property', SETTERS.property),

                    'parameter': create<           '', 'array', ParameterDecorator>()('property', SETTERS.parameter),
    'instance_method_parameter': create<   'instance', 'array', ParameterDecorator>()('property', SETTERS.parameter),
      'static_method_parameter': create<'constructor', 'array', ParameterDecorator>()('property', SETTERS.parameter),
        'constructor_parameter': create<'constructor', 'array', ParameterDecorator>()('property', SETTERS.parameter),
}
