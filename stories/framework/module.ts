import botox_module_factory from "@/framework/module";
import botox_framework_types from "@/framework/types";

interface Module {
    init?(): Promise<void>
}

type OPTIONS = botox_framework_types.MODULE_OPTIONS & {
    doc: string,
}

const btx_module = botox_module_factory(
    (module, options?: OPTIONS) => options || { doc: '' }
);

@btx_module({
    doc: 'aaa'
}).apis([

]).controllers([

]).dependencies(() => [

]).doc(
    'my module'
)
class MyModule {

}

console.log(btx_module.get_options(MyModule));
