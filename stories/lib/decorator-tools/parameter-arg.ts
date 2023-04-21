import { typram } from "@/lib/types";
import parameter_decorator_tools from '@/lib/decorator-tools/parameter';

type OPTIONS<T> = {
    parse: (v: unknown) => T,
}

const arg = create_arg();

class A {

    constructor(
        @arg(() => '')
        //@ts-expect-error
        @arg(() => 5)
        a: string,

        //@ts-expect-error
        @arg(() => '')
        @arg(() => 5)
        b: number,
    ) {}

    method(
        @arg(() => '')
        //@ts-expect-error
        @arg(() => 5)
        a: string,

        //@ts-expect-error
        @arg(() => '')
        @arg(() => 5)
        b: number,
    ) { }
}

{
    type t = parameter_decorator_tools.TYPE<A, 'method', 0>;
}

function create_arg() {
    const tools = parameter_decorator_tools(typram<OPTIONS<unknown>>());

    const arg = <
        T,
        P,
        I,
    >(
        parse: OPTIONS<parameter_decorator_tools.TYPE<T, P, I>>["parse"],
    ) => tools.create_decorator<T, P, I>(
        ctx => ({ parse })
    );

    return arg;
}