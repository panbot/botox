import botox_parameter_as_arg from "@/framework/api-arg/parameter-as-arg";
import botox_method_as_api from "@/framework/api/method-as-api";
import botox_validatable_factory from "@/framework/validatable";
const btx_validatable = botox_validatable_factory();

const btx_api_arg = botox_parameter_as_arg(btx_validatable);

const btx_api = botox_method_as_api(
    api => {},
    ctor => new ctor,
    (api, method, args) => (api[method] as any)(...args),
    btx_api_arg,
    btx_validatable
)
class MyApi {

    prop1: string;

    my_method(
        @btx_api_arg().validatable({
            parser: String,
        })
        arg1: string,
    ) {
        console.log('hello, %s!', arg1);
    }
}

btx_api.invoke(MyApi, 'my_method', [ 'world' ]);

() => {
    //@ts-expect-error
    btx_api.invoke(MyApi, 'prop1', [ 'world' ]);
}

btx_api.invoke(MyApi, 'my_method', [ 5 ]);

declare function invoke<
    T,
    K extends keyof {
        [ P in keyof T as T[P] extends (...args: any) => any ? P : never ]: any
    },
    ARGS extends T[K] extends (
        ...args: infer U
    ) => any ? U : never
>(
    t: T,
    k: K,
    args: ARGS
): T[K] extends (
    ...args: any
) => infer U ? U : never

() => {
    invoke(new MyApi, 'my_method', [ 's ']);
    //@ts-expect-error
    invoke(new MyApi, 'prop1', null as never);
}
