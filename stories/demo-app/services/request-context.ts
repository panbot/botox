import botox from "../botox";
import { randomUUID } from "crypto";
import { CONSTRUCTOR } from "@/types";
import decorator_tools from "@/decorator-tools";

@botox.validatable(v => RequestContext.parser(
    botox.validatable.assert_instance_of(v, botox.Req)
))
export class RequestContext {

    constructor(
        public req_id: string,
        public device?: string,
    ) { }

    req?: botox.Req;

    user?: RequestContext.User;
}

export namespace RequestContext {

    export const Roles = {
        Anonymous: 0,
    }

    export function parser(req: botox.Req) {
        let ctx = new RequestContext(
            randomUUID(),
            get_last_header('x-client-id')
        );

        ctx.req = req;

        let jwt_token = req.headers['authorization'];
        if (jwt_token != null && jwt_token.startsWith('Bearer ')) {
            try {
                const { uid } = get_auth_token_coder().decode(jwt_token.substring('Bearer '.length));
                ctx.user = new RequestContext.User(uid);
            } catch (e) {
                console.error(e);
            }
        }

        return ctx;

        function require_header(key: string) {
            let header = get_last_header(key);
            if (!header) throw new Error(`header "${key}" required`);
            return header;
        }

        function get_last_header(key: string) {
            let v = req.headers[key];
            let header = v instanceof Array ? v.pop() : v;
            return header;
        }
    }

    @botox.jsonable(o => get_auth_token_coder().encode(o))
    export class User {
        constructor(
            public uid: string,
        ) { }
    }

    export const context = Symbol('RequestContext');

    export type HAS_REQUEST_CONTEXT = {
        [context]: RequestContext
    }

    export function get_request_context(o: any): RequestContext | undefined {
        let ctx = o?.[context];
        if (ctx instanceof RequestContext) return ctx;
    }

    export const codable = create_codable();

    function create_codable() {
        let tools = decorator_tools.class_tools(decorator_tools.create_key<{ id: string }>());

        return <T extends HAS_REQUEST_CONTEXT>(
            id: string
        ) => assert_unique(id) && tools.create_decorator<CONSTRUCTOR<T>>(
            ctx => {
                botox.validatable.set_options(
                    ctx.target,
                    function (this: any, v: unknown) {
                        const ctx = get_request_context(this);
                        if (!ctx) throw new Error(`ctx required`);

                        const coder = botox.container.get(botox.tokens.jwt_factory)([
                            id,
                            ctx.device,
                            ctx.user?.uid ?? '',
                        ].join(''));

                        return coder.decode(String(v))
                    }
                );

                botox.jsonable((o: HAS_REQUEST_CONTEXT) => {
                    const ctx = o[RequestContext.context];

                    const coder = botox.container.get(botox.tokens.jwt_factory)([
                        id,
                        ctx.device,
                        ctx.user?.uid ?? '',
                    ].join(''));

                    return coder.encode(o)
                })(ctx.target);

                return { id }
            }
        )
    }

    const codable_id_set = new Set<string>();
    function assert_unique(id: string): true {
        if (codable_id_set.has(id)) throw new Error(`codable "${id}" already exists`);
        codable_id_set.add(id);
        return true;
    }
}

function get_auth_token_coder() {
    return botox.container.get(botox.tokens.jwt_factory)(('auth token'));
}
