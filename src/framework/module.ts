import assert from "node:assert";
import decorator from "../lib/decorator";
import { Runnable } from "../lib/runnable";
import { Constructor, Instantiator } from "../lib/types";

type Module = { init?: () => any }
type ModuleConstructor = Constructor<Module>;

export type ModuleOptions = {
    name: string,
    controllers?: Constructor<any>[],
    apis?: Runnable<any>,
    dependencies?: () => ModuleConstructor[],
}

export class ModuleManager {

    members = new Map<ModuleConstructor, ModuleOptions>();
    #inited = new Set<ModuleConstructor>();

    createDecorator() {
        return decorator<ModuleConstructor>()('class')(
            target => this.createOptions(target),
            target => this.   getOptions(target)
        )
    }

    createOptions(target: ModuleConstructor): ModuleOptions {
        let options: ModuleOptions = { name: target.name };
        this.members.set(target, options);
        return options;
    }

    getOptions(target: ModuleConstructor) {
        let options = this.members.get(target);
        assert(options, `Module options for ${target.name} not found`);
        return options;
    }

    async init(instantiate: Instantiator) {
        for (let module of this.resolveDependencies()) {
            if (this.#inited.has(module)) continue;

            let instance = instantiate(module);

            await instance.init?.();
            this.#inited.add(module);
        }
    }

    resolveDependencies() {
        let visited = new Set<ModuleConstructor>();
        const visit = (
            options: ModuleOptions,
            module: ModuleConstructor,
            path = new Set<ModuleConstructor>()
        ) => {
            if (visited.has(module)) return;

            if (path.has(module)) throw new Error(
                `circular dependency found, ` + [ ...path, module ].map(v => v.name).join(' -> ')
            );
            path.add(module);

            options.dependencies?.().forEach(
                d => visit(this.getOptions(d), d, new Set<ModuleConstructor>(path))
            );

            sorted.push(module);
            visited.add(module);
        }

        let sorted: ModuleConstructor[] = [];

        this.members.forEach((o, m) => visit(o, m));

        return sorted;
    }
}
