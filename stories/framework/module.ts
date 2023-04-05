import botox_module_factory from "@/framework/module";
import { CONSTRUCTOR } from "@/lib/types";

interface Module {
    init?(): Promise<void>
}

const btx_module = botox_module_factory(
    (module: CONSTRUCTOR<Module>) => {

    }
);

@btx_module().apis([

]).controllers([

]).dependencies(() => [

])
class MyModule {

}