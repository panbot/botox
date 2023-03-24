import decorator from "../lib/decorator";
import expandify from "../lib/expandify";
import { Runnable } from "../lib/runnable";
import { CONSTRUCTOR } from "../lib/types";

export type ModuleOptions<Module extends {}> = {
    name: string,
    controllers?: CONSTRUCTOR<any>[],
    apis?: Runnable<any>,
    dependencies?: () => CONSTRUCTOR<Module>[],
}

export default <Module extends {}>() => expandify(decorator('class')<Module>()(
    target => ({ name: target.name } as ModuleOptions<Module>)
))[expandify.expand](d => ({

    getOptions(module: CONSTRUCTOR<Module>) {
        return d.getRegistry(module).getOwn()
    },

    resolveDependencies(modules: CONSTRUCTOR<Module>[]) {
        let visited = new Set<CONSTRUCTOR<Module>>();
        const visit = (
            module: CONSTRUCTOR<Module>,
            path = new Set<CONSTRUCTOR<Module>>()
        ) => {
            if (visited.has(module)) return;

            if (path.has(module)) throw new Error(`circular dependency`, { cause: {
                path: [ ...path, module ].map(v => v.name).join(' -> ')
            }});
            path.add(module);

            let options = this.getOptions(module);
            if (!options) throw new Error(`module options not found`, { cause: { module } });
            options.dependencies?.().forEach(
                dep => visit(dep, new Set<CONSTRUCTOR<Module>>(path))
            );

            sorted.push(module);
            visited.add(module);
        }

        let sorted: CONSTRUCTOR<Module>[] = [];

        modules.forEach(m => visit(m));

        return sorted;
    },

}))
