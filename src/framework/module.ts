import decorator from "../lib/decorator";
import expandify from "../lib/expandify";
import mr from "../lib/metadata-registry";
import { CONSTRUCTOR } from "../lib/types";
import types from "./types";

function botox_module_factory<OPTIONS extends types.MODULE_OPTIONS>(
    init_by: (constructor: CONSTRUCTOR, options?: OPTIONS) => OPTIONS,
) { return decorator.create_class_decorator({
    init_by: (
        ctx,
        options?: OPTIONS,
    ) => init_by(ctx.args[0], options),
})[expandify.expand]({

    get_options(module: CONSTRUCTOR) {
        return this[mr.get_registry](module).get_own()
    },

    resolve_dependencies(modules: CONSTRUCTOR[]) {
        let visited = new Set<CONSTRUCTOR>();
        const visit = (
            module: CONSTRUCTOR,
            path = new Set<CONSTRUCTOR>()
        ) => {
            if (visited.has(module)) return;

            if (path.has(module)) throw new Error(`circular dependency`, { cause: {
                path: [ ...path, module ].map(v => v.name).join(' -> ')
            }});
            path.add(module);

            let options = this.get_options(module);
            if (!options) throw new Error(`module options not found`, { cause: { module } });
            options.dependencies?.().forEach(
                dep => visit(dep, new Set<CONSTRUCTOR>(path))
            );

            sorted.push(module);
            visited.add(module);
        }

        let sorted: CONSTRUCTOR[] = [];

        modules.forEach(m => visit(m));

        return sorted;
    }
}) }

namespace botox_module_factory {
}

export default botox_module_factory