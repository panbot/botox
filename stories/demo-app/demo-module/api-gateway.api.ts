import { Readable } from "stream";
import botox from "../botox";
import { ApiLookup } from "../services/api-lookup";
import { RequestContext } from "../services/request-context";
import { CONSTRUCTOR } from "@/types";

export class ApiGateway {

    @botox.inject()
    api_lookup: ApiLookup;

    @botox.inject_token('enabled_modules')
    modules: CONSTRUCTOR<botox.Module>[];

    @botox.route().content_type('application/json')
    async 'POST /api/'(
        res: botox.Res,
        req: botox.Req,
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

            await end(res, 200, await botox.invoke_api(botox.container.instantiate(api), params));
        } catch (e: any) {
            if (e instanceof botox.ArgumentError) {
                await end(res, 400, { ...e.cause!, message: e.message });
            } else if (typeof e == 'string') {
                await end(res, 400, { message: e });
            } else {
                console.error(e);
                await end(res, 500, { message: 'unexpected error' });
            }
        }
    }

    @botox.route()
    async 'GET /api-doc'(
        res: botox.Res,
    ) {
        let apis: any[] = [];

        this.modules.forEach(m => {
            const options = botox.module.get_options(m);
            if (!options) return;
            const module_options = options;

            botox.module.get_options(m)?.apis?.forEach(a => {
                const api_options = botox.api.get_options(a);
                if (!api_options) return;

                apis.push({
                    name: a.name,
                    doc: api_options.doc ?? a.name,
                    module: m.name,
                    moduleDoc: module_options.doc ?? m.name,
                    roles: api_options.roles,
                    path: [ 'api', m.name, a.name ].join('/'),
                    args: gen_args(a),
                })
            });
        });

        await end(res, 200, {
            apis,
            roles: RequestContext.Roles,
        })

        function gen_args(api: CONSTRUCTOR<botox.Api>) {
            let args: any[] = [];
            botox.api_arg.for_each_arg(api.prototype, (name, arg_options) => {
                if (
                    typeof name == 'symbol' ||
                    arg_options.virtual
                ) return;

                args.push({
                    doc: arg_options.doc,
                    name,
                    necessity: arg_options.optional ? 'optional' : 'required',
                    inputype: arg_options.inputype,
                })
            });

            return args;
        }
    }
}

async function end(res: botox.Res, statusCode: number, result: any) {
    let payload = await botox.jsonable.stringify(result)
    res.statusCode = statusCode;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(payload);
}

function drain(readable: Readable) {
    return new Promise<Buffer>((r, j) => {
        let chunks: Buffer[] = [];
        readable.on('data', c => chunks.push(c));
        readable.on('end', () => r(Buffer.concat(chunks)))
        readable.on('error', j);
    })
}
