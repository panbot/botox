import botox from "../botox";
import { RequestContext } from "../services/request-context";

@botox.api()
export class Auth implements botox.Api {

    @botox.api_arg()
    uid: string;

    run() {
        return {
            jwt: new RequestContext.User(this.uid),
        }
    }
}

@botox.api()
export class WhoAmI implements botox.Api {

    @botox.api_arg()
    [RequestContext.context]: RequestContext;

    run() {
        const ctx = this[RequestContext.context];

        return {
            user: { ...ctx.user },
        }
    }
}

export default [
    Auth,
    WhoAmI,
]