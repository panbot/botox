import decorator from "../lib/decorator";
import expandify from "../lib/expandify";
import { Runnable } from "../lib/runnable";
import { Constructor } from "../lib/types";

export type ModuleOptions<Module extends {}> = {
    name: string,
    controllers?: Constructor<any>[],
    apis?: Runnable<any>,
    dependencies?: () => Constructor<Module>[],
}

export default <Module extends {}>() => expandify(decorator('class')<Module>()(
    target => ({ name: target.name } as ModuleOptions<Module>)
))[expandify.expand](d => ({

    getOptions(module: Constructor<Module>) {
        return d.getRegistry(module).getOwn()
    },

    resolveDependencies(modules: Constructor<Module>[]) {
        let visited = new Set<Constructor<Module>>();
        const visit = (
            module: Constructor<Module>,
            path = new Set<Constructor<Module>>()
        ) => {
            if (visited.has(module)) return;

            if (path.has(module)) throw new Error(`circular dependency`, { cause: {
                path: [ ...path, module ].map(v => v.name).join(' -> ')
            }});
            path.add(module);

            let options = this.getOptions(module);
            if (!options) throw new Error(`module options not found`, { cause: { module } });
            options.dependencies?.().forEach(
                dep => visit(dep, new Set<Constructor<Module>>(path))
            );

            sorted.push(module);
            visited.add(module);
        }

        let sorted: Constructor<Module>[] = [];

        modules.forEach(m => visit(m));

        return sorted;
    },

}))
