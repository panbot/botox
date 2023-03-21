import assert from "node:assert";
import decorator from "../lib/decorator";
import { Runnable } from "../lib/runnable";
import { Constructor, Instantiator } from "../lib/types";

export type ModuleOptions<Module extends {}> = {
    name: string,
    controllers?: Constructor<any>[],
    apis?: Runnable<any>,
    dependencies?: () => Constructor<Module>[],
}

export class ModuleManager<Module extends {}> {

    readonly decorator = decorator('class')<Module>()(target => this.createOptions(target));

    createOptions(target: Constructor<Module>) {
        let options: ModuleOptions<Module> = { name: target.name };
        return options;
    }

    getOptions(target: Constructor<Module>) {
        let options = this.decorator.getRegistry(target).getOwn();
        assert(options, `Module options for ${target.name} not found`);
        return options;
    }

    resolveDependencies(
        modules: Constructor<Module>[]
    ) {
        let visited = new Set<Constructor<Module>>();
        const visit = (
            module: Constructor<Module>,
            path = new Set<Constructor<Module>>()
        ) => {
            if (visited.has(module)) return;

            if (path.has(module)) throw new Error(
                `circular dependency found, ` + [ ...path, module ].map(v => v.name).join(' -> ')
            );
            path.add(module);

            this.getOptions(module).dependencies?.().forEach(
                d => visit(d, new Set<Constructor<Module>>(path))
            );

            sorted.push(module);
            visited.add(module);
        }

        let sorted: Constructor<Module>[] = [];

        modules.forEach(m => visit(m));

        return sorted;
    }
}
