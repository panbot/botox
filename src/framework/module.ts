import decorator from "../lib/decorator";
import expandify from "../lib/expandify";
import { metadata_registry } from "../lib/metadata-registry";
import { CONSTRUCTOR } from "../lib/types";
import { botox_api_framework as botox } from "./types";

export default <MODULE extends {}>(
    register: (constructor: CONSTRUCTOR<MODULE>) => void,
) => decorator.create_class_decorator({
    init_by: (
        ctx,
        module_options?: botox.MODULE_OPTIONS<MODULE>,
    ) => ( register(ctx.args[0]), module_options || {} as botox.MODULE_OPTIONS<MODULE>),
    target: decorator.target<MODULE>(),
})[expandify.expand]({

    get_options(module: CONSTRUCTOR<MODULE>) {
        return this[metadata_registry.get_registry](module).get_own()
    },

    resolve_dependencies(modules: CONSTRUCTOR<MODULE>[]) {
        let visited = new Set<CONSTRUCTOR<MODULE>>();
        const visit = (
            module: CONSTRUCTOR<MODULE>,
            path = new Set<CONSTRUCTOR<MODULE>>()
        ) => {
            if (visited.has(module)) return;

            if (path.has(module)) throw new Error(`circular dependency`, { cause: {
                path: [ ...path, module ].map(v => v.name).join(' -> ')
            }});
            path.add(module);

            let options = this.get_options(module);
            if (!options) throw new Error(`module options not found`, { cause: { module } });
            options.dependencies?.().forEach(
                dep => visit(dep, new Set<CONSTRUCTOR<MODULE>>(path))
            );

            sorted.push(module);
            visited.add(module);
        }

        let sorted: CONSTRUCTOR<MODULE>[] = [];

        modules.forEach(m => visit(m));

        return sorted;
    }
})