import botox_class_as_api from "@/framework/api/class-as-api";
import botox_property_as_arg from "@/framework/api-arg/property-as-arg";
import botox_validatable_factory from "@/framework/validatable";
const btx_validatable = botox_validatable_factory();

const btx_api_arg = botox_property_as_arg(btx_validatable);

const btx_api = botox_class_as_api(
    api => {},
    ctor => new ctor,
    api => api.run(),
    btx_api_arg,
    btx_validatable,
);

@btx_api()
class MyApi {

    @btx_api_arg().validatable({
        parser: String,
    })
    arg1: string;

    run() {
        console.log('hello, %s!', this.arg1);
    }
}

btx_api.invoke(MyApi, {
    arg1: 'world'
});

