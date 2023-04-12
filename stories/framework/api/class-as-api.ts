import botox_class_as_api from "@/framework/api/class-as-api";
import botox_property_as_arg from "@/framework/api-arg/property-as-arg";
import botox_validatable_factory from "@/framework/validatable";
import botox_framework_types from "@/framework/types";
const btx_validatable = botox_validatable_factory();

type OPTIONS = botox_framework_types.API_OPTIONS & {
    doc: string,
}

const btx_api_arg = botox_property_as_arg(btx_validatable);

const btx_api = botox_class_as_api(
    (api, options?: OPTIONS) => options ?? { doc: '' }
);

@btx_api({
    doc: 'my api'
})
class MyApi {

    @btx_api_arg().validatable({
        parser: String,
    })
    arg1: string;

    run() {
        console.log('hello, %s!', this.arg1);
    }
}

let params: any = {
    arg1: 'world'
};

let api = new MyApi();
btx_api_arg.for_each_arg(api, (p, arg) => {
    const { parser, validator} = arg.validatable;
    let value = parser(params?.[p]);
    let error = validator?.(value);
    if (error) throw error;

    Object.defineProperty(api, p, { value });
})
api.run();
