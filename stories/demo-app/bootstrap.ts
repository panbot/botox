import { CONSTRUCTOR } from "@/lib/types";
import botox from "./botox";
import enabled_modules from "./enabled-modules";

export async function init_modules(modules?: [ CONSTRUCTOR<botox.Module> ]) {
    for (let m of botox.module.resolve_dependencies(modules ?? enabled_modules)) {
        await botox.container.instantiate(m).init?.()
    }
}

