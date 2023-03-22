import mr, { Anchors, AnchorType } from "./metadata-registry";
import { Constructor, IsReadonly, RemoveHead } from "./types";

export default <T extends keyof typeof DecorationTypes>(on: T) => DecorationTypes[on];

type AnyDecorator = (...args: any) => any
type ReplaceFirst<List extends Array<any>, First> = [ First, ...RemoveHead<List> ]
type IsConstructor<T extends AnyDecorator, U> = T extends ClassDecorator ? Constructor<U> : U
type ExposedArgs<T extends AnyDecorator, U> = ReplaceFirst<Parameters<T>, IsConstructor<T, U>>

type Getter<T extends AnyDecorator, U extends AnchorType> = (
    args: Parameters<T>,
    getRegistry: Anchors<any>[U],
) => any

type Setter<T extends AnyDecorator, U extends AnchorType> = (
    args: Parameters<T>,
    getRegistry: Anchors<any>[U],
    value: any,
) => void

export type Decorator<D, T> = D & Required<{
    [ P in keyof T as IsReadonly<T, P> extends true ? never : P ]: (v: T[P]) => Decorator<D, T>
}>;

const create = <DecoratorType extends AnyDecorator>(
) => <U extends AnchorType>(
    anchor: U,
) => (
    get: Getter<DecoratorType, U>,
    set: Setter<DecoratorType, U>,
) => <T>(
) => <Options extends {}>(
    init : (...args: ExposedArgs<DecoratorType, T>) => Options,
) => {
    type Args = Parameters<DecoratorType>;

    const createDecorator = (
        base: (...args: Args) => any
    ) => new Proxy(
        base,
        {
            get: (
                _,
                property
            ) => (
                value: any
            ) => createDecorator(
                (...args: Args) => { base(...args); get(args, getRegistry)[property as keyof Options] = value }
            )
        }
    ) as Decorator<DecoratorType, Required<Options>>;

    let decorator = (
        values?: Partial<Options>
                | ( (options: Options) => void )
    ) => createDecorator(
        (...args: Args) => {
            let options = init(...args as ExposedArgs<DecoratorType, T>);
            set(args, getRegistry, options);
            if (typeof values == 'function') values(options);
            else Object.assign(options, values);
        }
    );

    const getRegistry = mr<DecoratorType extends ParameterDecorator ? Options[] : Options>(decorator)(anchor);

    return Object.assign(decorator, {

        getRegistry: getRegistry as unknown as (
            ...args: ReplaceFirst<Parameters<typeof getRegistry>, IsConstructor<DecoratorType, T>>
        ) => ReturnType<typeof getRegistry>,

    })
}

type Accessor<T extends AnyDecorator, U extends AnchorType> = [ Getter<T, U>, Setter<T, U> ];
const Accessors: {
    class     : Accessor<     ClassDecorator, 'class'    >,
    property  : Accessor<  PropertyDecorator, 'property' >,
    parameter : Accessor< ParameterDecorator, 'property' >,
} = {
    class     : [ ([t   ], gr) => gr(t   ).getOwn()!, ([t   ], gr, v) => gr(t   ).set(v) ],
    property  : [ ([t, p], gr) => gr(t, p).getOwn()!, ([t, p], gr, v) => gr(t, p).set(v) ],
    parameter : [
        ([ target, property, index ], gr) => {
            let list = gr(target, property).getOwn() as any[];
            return list[index]!
        },
        ([ target, property, index ], gr, v) => {
            let list = gr(target, property).getOrSet([]) as any[];
            list[index] = v;
        }
    ],
}

const DecorationTypes = {
    class     : create<     ClassDecorator >()( 'class'    )( ...Accessors.class     ),
    method    : create<    MethodDecorator >()( 'property' )( ...Accessors.property  ),
    property  : create<  PropertyDecorator >()( 'property' )( ...Accessors.property  ),
    parameter : create< ParameterDecorator >()( 'property' )( ...Accessors.parameter ),
};
