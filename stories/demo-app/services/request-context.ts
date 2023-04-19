import { IncomingMessage, ServerResponse } from "http";
import botox from "../botox";

@botox.validatable(v => v)
export class RequestContext {
    req_id: string;

    req?: IncomingMessage;
    res?: ServerResponse<IncomingMessage>;

    user: {

    };
}

export namespace RequestContext {
    export const context = Symbol('RequestContext');

    export function has_request_context(o: any): o is { [context]: RequestContext } {
        return o?.[context] instanceof RequestContext
    }
}
