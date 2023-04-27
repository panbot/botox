import { Readable } from "stream";
import botox from "../botox";
import { ApiLookup } from "../services/api-lookup";
import { RequestContext } from "../services/request-context";

export class ApiGateway {

    @botox.inject()
    api_lookup: ApiLookup;

    @botox.route().content_type('application/json')
    async 'POST /api/'(
        req: botox.Req,
        res: botox.Res,
    ) {
        try {
            let parts = req.url?.split('/');
            let module_name = parts?.[2];
            let api_name = parts?.[3];

            if (!module_name || !api_name) {
                throw `${module_name} / ${api_name} empty`;
            }

            let api = this.api_lookup.get_api(module_name, api_name);
            if (!api) {
                throw `${module_name} / ${api_name} not found`;
            }

            let params: any;
            try {
                params = JSON.parse((await drain(req)).toString());
            } catch (e: any) {
                throw new botox.ArgumentError(e.message);
            }

            params[RequestContext.context] = req;

            end(200, await botox.invoke_api(botox.container.instantiate(api), params));
        } catch (e: any) {
            if (e instanceof botox.ArgumentError) {
                end(400, { message: e.message });
            } else if (typeof e == 'string') {
                end(400, { message: e });
            } else {
                console.error(e);
                end(500, { message: 'unexpected error' });
            }
        }

        function end(statusCode: number, result: any) {
            res.statusCode = statusCode;
            res.end(botox.jsonable.stringify(result));
        }
    }
}

function drain(readable: Readable) {
    return new Promise<Buffer>((r, j) => {
        let chunks: Buffer[] = [];
        readable.on('data', c => chunks.push(c));
        readable.on('end', () => r(Buffer.concat(chunks)))
        readable.on('error', j);
    })
}
