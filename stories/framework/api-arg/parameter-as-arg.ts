import botox_parameter_as_arg from "@/framework/api-arg/parameter-as-arg";
import botox_validatable_factory from "@/framework/validatable";
const btx_validatable = botox_validatable_factory();

const btx_api_arg = botox_parameter_as_arg(btx_validatable);

class MyApi {

    my_method(
        @btx_api_arg()
        arg1: string,
    ) {}
}

btx_api_arg.for_each_arg(new MyApi(), 'my_method', (index, arg) => {
    console.log(index, arg);
})
