import { FALSY, typram } from "@/lib/types";

export default null;

const create_helper = <
    OPTIONS,
    INIT_KEYS extends keyof OPTIONS,
>() => {
    return {
        get_registry: (t: any): Required<Pick<OPTIONS, INIT_KEYS>> => null as any,

        create_decorator: <T>(
            init_options: (
                ctx: {
                    target: T,
                }
            ) => Required<Pick<OPTIONS, INIT_KEYS>>,
        ) => (
            target: T,
        ) => {

        }
    }
}

type OPTIONS<T = unknown> = {
    name: string,
    parser: (v: unknown) => T,
    validator?: (v: T) => string | FALSY,
    inputype?: string;
}

const helper = create_helper<OPTIONS, 'parser'>()

const validatable = <T>(
    parser: OPTIONS<T>["parser"],
) => helper.create_decorator<T>(
    ctx => ({
        parser,
    }),
)
