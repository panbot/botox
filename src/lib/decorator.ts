import { Constructor } from "./types";

export default function<TargetType>() {

    const DecorationTypes = {
        class     : create< TargetType,     ClassDecorator >(),
        method    : create< TargetType,    MethodDecorator >(),
        property  : create< TargetType,  PropertyDecorator >(),
        parameter : create< TargetType, ParameterDecorator >(),
    };

    return <T extends keyof typeof DecorationTypes>(on: T) => DecorationTypes[on];
}

type RemoveFirst<T> = T extends [ any, ...infer U ] ? U : never;
type ReplaceFirst<Array extends [], First> = [ First, ...RemoveFirst<Array> ];

function create<TargetType, DecoratorType extends (...args: any) => any>() {
    type Args = ReplaceFirst<Parameters<DecoratorType>, TargetType>

    return <Options extends {}>(
        init : (...args: Args) => Options,
        get  : (...args: Args) => Options,
    ) => {
        type CompleteOptions = Required<Options>;
        type Setter = {
            [ p in keyof CompleteOptions]: (v: CompleteOptions[p]) => Decorator
        };
        type Decorator = DecoratorType & Setter;

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
                    (...args: Args) => { base(...args); get(...args)[property as keyof Options] = value }
                )
            }
        ) as Decorator;

        return (
            values?: Partial<Options>
                   | ( (options: Options) => void )
        ) => createDecorator(
            (...args: Args) => {
                let options = init(...args);
                if (typeof values == 'function') values(options);
                else Object.assign(options, values);
            }
        )
    }
}
