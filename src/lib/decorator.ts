import expandify from "./expandify";
import mr, { Anchors, AnchorType } from "./metadata-registry";
import { Constructor, IsEqual, IsReadonly, RemoveHead } from "./types";

export default <T extends keyof typeof DecorationTypes>(on: T) => DecorationTypes[on];

type AnyDecorator = (...args: any) => any
type ReplaceFirst<List extends Array<any>, First> = [ First, ...RemoveHead<List> ]
type IsConstructor<T, U> = IsEqual<T, ClassDecorator> extends true ? Constructor<U> : U
type ExposedArgs<T extends AnyDecorator, U> = ReplaceFirst<Parameters<T>, IsConstructor<T, U>>

type Setter<T extends AnyDecorator, U extends AnchorType> = (
    args: Parameters<T>,
    getRegistry: Anchors<any>[U],
    value: any,
) => void

type NonReadonly<T> = {
    [ P in keyof T as IsReadonly<T, P> extends true ? never : P ]: T[P]
}

export type Decorator<D, T> = D & Required<{
    [ P in keyof NonReadonly<T> ]: (v: T[P]) => Decorator<D, T>
}>;

const create = <DecoratorType extends AnyDecorator>(
) => <U extends AnchorType>(
    anchor: U,
) => (
    set: Setter<DecoratorType, U>,
) => <T>(
) => <Options extends {}>(
    init : (...args: ExposedArgs<DecoratorType, T>) => Options,
) => {
    type Args = Parameters<DecoratorType>;
    type Work = (options: Options) => {};

    const decorator = expandify((
        values?: Partial<Options>
               | ( (options: Options) => void )
    ) => {
        let works: Work[] = [];
        return new Proxy(
            (...args: Args) => {
                let options = init(...args as ExposedArgs<DecoratorType, T>);

                if (typeof values == 'function') values(options);
                else Object.assign(options, values);

                works.forEach(w => w(options));

                set(args, getRegistry, options);
            },
            {
                get: (_, k, r) => (v: any) => {
                    works.push(o => o[k as keyof Options] = v);
                    return r;
                }
            }
        ) as Decorator<DecoratorType, Options>;
    });

    const getRegistry = mr<IsEqual<DecoratorType, ParameterDecorator> extends true ? Options[] : Options>(decorator)(anchor);
    type GeRegistry = (
        ...args: ReplaceFirst<Parameters<typeof getRegistry>, IsConstructor<DecoratorType, T>>
    ) => ReturnType<typeof getRegistry>;

    return decorator[expandify.expand](() => ({
        getRegistry: getRegistry as unknown as GeRegistry,
    }))
}

const Setters: {
    class     : Setter<     ClassDecorator, 'class'    >,
    property  : Setter<  PropertyDecorator, 'property' >,
    parameter : Setter< ParameterDecorator, 'property' >,
} = {
    class     : ([ t       ], gr, v) => gr(t   ).set(v),
    property  : ([ t, p    ], gr, v) => gr(t, p).set(v),
    parameter : ([ t, p, i ], gr, v) => gr(t, p).getOrSet([])[i] = v,
}

const DecorationTypes = {
    class     : create<     ClassDecorator >()( 'class'    )( Setters.class     ),
    method    : create<    MethodDecorator >()( 'property' )( Setters.property  ),
    property  : create<  PropertyDecorator >()( 'property' )( Setters.property  ),
    parameter : create< ParameterDecorator >()( 'property' )( Setters.parameter ),
};
