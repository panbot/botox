import { typram } from "../types";
import class_____decorator_tools from "./class";
import method____decorator_tools from "./method";
import property__decorator_tools from "./property";
import parameter_decorator_tools from './parameter';

namespace decorator_tools {
    export const create_key = typram.factory<{}>();

    export import     class_tools = class_____decorator_tools;
    export import    method_tools = method____decorator_tools;
    export import  property_tools = property__decorator_tools;
    export import parameter_tools = parameter_decorator_tools;
}

export default decorator_tools