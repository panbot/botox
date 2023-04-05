import botox_property_as_arg from "@/framework/api-arg/property-as-arg";
import botox_validatable_factory from "@/framework/validatable";
const btx_validatable = botox_validatable_factory();

const btx_api_arg = botox_property_as_arg(btx_validatable);

class MyApi {

    @btx_api_arg()
    arg1: string;
}

btx_api_arg.for_each_arg(new MyApi(), (p, arg) => {
    console.log(p, arg)
})
