import decorator from "../lib/decorator";
import expandify from "../lib/expandify";
import { Runnable } from "../lib/runnable";
import { CONSTRUCTOR } from "../lib/types";

export type ModuleOptions<MODULE extends {}> = {
    name: string,
    controllers?: CONSTRUCTOR<any>[],
    apis?: Runnable<any>,
    dependencies?: () => CONSTRUCTOR<MODULE>[],
}

export default <MODULE extends {}>() => decorator.create_class_decorator({
    init_by: target => ({ name: target.name } as ModuleOptions<MODULE>),
    target: decorator.target<MODULE>(),
})[expandify.expand]({

    get_options(module: CONSTRUCTOR<MODULE>) {
        return this.get_registry(module).get_own()
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