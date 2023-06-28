import { CONSTRUCTOR } from "@/types";
import botox from "./botox";
import enabled_modules from "./enabled-modules";
import jwt from "./services/jwt";
import { create_csrf_service, csrf_service_token } from "./services/csrf";

export async function init_modules(modules?: [ CONSTRUCTOR<botox.Module> ]) {
    for (let m of botox.module.resolve_dependencies(modules ?? enabled_modules)) {
        await botox.container.instantiate(m).init?.()
    }
}

let parameters: botox.APP_PARAMETERS = require('./parameters.json');
botox.container.set(botox.tokens.parameters, parameters);

botox.container.set(botox.tokens.jwt_factory, (salt: string) => jwt(parameters.secret + salt, 'sha256'));

botox.container.set(csrf_service_token, create_csrf_service());
