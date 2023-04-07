import botox_parameter_as_arg from "@/framework/api-arg/parameter-as-arg";
import botox_method_as_api from "@/framework/api/method-as-api";
import botox_framework_types from "@/framework/types";
import botox_validatable_factory from "@/framework/validatable";
import { CONSTRUCTOR } from "@/lib/types";
import { assert_of_type } from "stories/asserts";
const btx_validatable = botox_validatable_factory();

const btx_api_arg = botox_parameter_as_arg(btx_validatable);

type OPTIONS = botox_framework_types.API_OPTIONS & {
    doc: string,
}

const btx_api = botox_method_as_api(
    (api, property, options?: OPTIONS) => options || { doc: '' }
)

class MyApi {

    prop1: string;

    @btx_api().doc('my method api')
    my_method(
        @btx_api_arg().validatable({
            parser: String,
        })
        arg1: string,
    ) {
        console.log('hello, %s!', arg1);

        return 0;
    }
}

let r = invoke(MyApi, 'my_method', [ 'world' ]);
assert_of_type<number>(r);

() => {
    //@ts-expect-error
    btx_api.invoke(new MyApi, 'prop1', [ 'world' ]);
}

invoke(MyApi, 'my_method', [ 5 ]);

function invoke<
    T,
    K extends botox_framework_types.METHODS<T>
>(
    api: CONSTRUCTOR<T>,
    method: K,
    args: any,
) {
    let instance = new api;
    let validated_args: any[] = [];
    btx_api_arg.for_each_arg(
        instance,
        method,
        (i, arg) => {
            const { parser, validator} = arg.validatable;
            let value = parser(args?.[i]);
            let error = validator?.(value);
            if (error) throw error;

            validated_args[i] = value;
        }
    );

    let invoker: botox_framework_types.METHOD_INVOKER = (
        t, k, args
    ) => {
        return (t[k] as any)(...args) as any;
    }
    return invoker(instance, method, validated_args as any)
}

declare const invoke_instance: botox_framework_types.METHOD_INVOKER

() => {
    invoke_instance(new MyApi, 'my_method', [ 's ']);
    //@ts-expect-error
    invoke_instance(new MyApi, 'prop1', null as never);
}
