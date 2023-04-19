import { IncomingMessage, ServerResponse } from "http";
import expandify from "@/lib/expandify";
import method_decorator_tools from '@/lib/decorator-tools/method';

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

    const factory = method_decorator_tools();
    const route = factory.create(create_decorator => <
        T,
        P extends `${ALLOWED_HTTP_METHOD} /${string}`,
        D,
    >(

    ) => create_decorator<T, P, D>(
        ctx => {
            console.log(ctx);
            const [ method, route ] = ctx.property.split(' ', 2);
            return {
                method,
                route,
                parameters: ctx.design_types.parameters,
            }
        }
    ).as_setter<OPTIONS>())[expandify.expand]({
        get_options: <T>(target: T, property: keyof T) => factory.get_registry(target, property).get(),
    })


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

    console.log(route.get_options(new A, 'GET /api'));
    console.log(route.get_options(new A, 'POST /api'));
}
