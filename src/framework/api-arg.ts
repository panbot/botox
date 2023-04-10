import botox__property_as_arg from "./api-arg/property-as-arg"
import botox_parameter_as_arg from "./api-arg/parameter-as-arg"
import botox_framework_types from "./types"

namespace botox_api_arg_factory {
    export import  property_as_arg = botox__property_as_arg
    export import parameter_as_arg = botox_parameter_as_arg
}

export default botox_api_arg_factory