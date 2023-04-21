import { inspect } from "util";

namespace botox_module_factory {

    export function resolve_dependencies<T>(
        modules: T[],
        get_dependencies: (m: T) => T[] | undefined,
    ) {
        let visited = new Set<T>();
        let sorted: T[] = [];
        const visit = (
            module: T,
            path = new Set<T>()
        ) => {
            if (visited.has(module)) return;

            if (path.has(module)) throw new Error(`circular dependency`, { cause: {
                path: [ ...path, module ].map(v => inspect(v, false, 0)).join(' -> ')
            }});
            path.add(module);

            get_dependencies(module)?.forEach(
                dep => visit(dep, new Set<T>(path))
            );

            sorted.push(module);
            visited.add(module);
        }

        modules.forEach(m => visit(m));

        return sorted;
    }
}

export default botox_module_factory