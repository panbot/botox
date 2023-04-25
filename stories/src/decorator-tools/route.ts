import { IncomingMessage, ServerResponse } from "http";
import method_decorator_tools from '@/decorator-tools/method';
import { typram } from "@/types";
import assert from "node:assert";

type ALLOWED_HTTP_METHOD
    = 'GET'
    | 'POST'
    | 'PUT'
    | 'DELETE'
;

type OPTIONS = {
    route: string,
    parameters: any[],
    http_method: string,
    content_type?: string,
}

{

    const factory = method_decorator_tools(typram<OPTIONS>());
    const route =  <
        T,
        P extends `${ALLOWED_HTTP_METHOD} /${string}`,
        D,
    >(

    ) => factory.create_decorator<T, P, D>(
        ctx => {
            console.log(ctx);
            const [ http_method, route ] = ctx.property.split(' ', 2);
            assert(http_method);
            assert(route);
            return {
                http_method,
                route,
                parameters: ctx.design_types.parameters,
            }
        }
    ).as_setter();

    class Req extends IncomingMessage {}
    class Res extends ServerResponse<Req> {}

    class A {

        @route()
        @route().content_type('text/html')
        'GET /api'(
            req: Req,
            res: Res,
        ) {

        }

        @route().content_type('application/json')
        'POST /api'(
            req: Req,
            res: Res,
        ) {

        }

        //@ts-expect-error
        @route().http_method('GET')
        //@ts-expect-error
        @route()
        3() {}

        //@ts-expect-error
        @route()
        //@ts-expect-error
        @route().content_type('application/json')
        method() {}

    }

    const get_options = <T>(target: T, property: keyof T) => factory.get_registry(target, property).get();

    console.log(get_options(new A, 'GET /api'));
    console.log(get_options(new A, 'POST /api'));
}
