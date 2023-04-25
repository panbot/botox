import property_decorator_tools from '@/decorator-tools/property';
import { P_OF_T, typram } from '@/types';

type OPTIONS<T> = {
    parse?: (v: unknown) => T,
}

const arg = create_arg();

const s = Symbol();

class Api {

    //@ts-expect-error
    @arg(v => 5)
    @arg(v => '')
    @arg().parse(v => '')
    //@ts-expect-error
    @arg().parse(v => 5)
    arg1: string;

    @arg(function(v) { return Number(this.arg1) })
    @arg().parse(function (v) { return Number(this.arg1) })
    arg2: number;

    //@ts-expect-error
    @arg(v => 5)
    //@ts-expect-error
    @arg().parse(v => 5)
    [s]: any;
}


function create_arg() {
    const tools = property_decorator_tools(typram<OPTIONS<unknown>>());

    let arg = <
        T,
        P extends string,
        V extends P_OF_T<P, T>,
    >(
        parse?: (this: T, v: unknown) => V
    ) => tools.create_decorator<T, P>(
        (): OPTIONS<V> => ({ parse })
    ).as_setter() as DECORATOR_OPTION_SETTER<T, P>;

    type DECORATOR<T, P> = (target: T, property: P) => void

    type SET_THIS_T<F, T>
        = F extends (...args: infer U) => infer R
        ? (this: T, ...args: U) => R
        : F
    ;

    type DECORATOR_OPTION_SETTER<T, P> = DECORATOR<T, P> & {
        [ K in keyof Required<OPTIONS<any>> ] :
            <
                T1 extends T,
                P1 extends P,
                V1 extends P_OF_T<P1, T1>,
            >(
                value: SET_THIS_T<Required<OPTIONS<V1>>[K], T1>
            ) => DECORATOR_OPTION_SETTER<T1, P1>
    }

    return arg
}
