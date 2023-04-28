import { init_modules } from "./bootstrap";
import botox from "./botox";
import { CONSTRUCTOR } from "@/types";
import create_http_server from "./services/http-server";

export default class {

    @botox.inject_token('enabled_modules')
    modules: CONSTRUCTOR<botox.Module>[];

    server = create_http_server();

    async run() {
        await init_modules();

        this.modules.forEach(
            m => botox.module.get_options(m)?.routes?.forEach(
                r => botox.route.for_each_route(
                    r.prototype,
                    (p, options) => this.add_handler(r, p, options)
                )
            )
        );

        this.server.start(80);
    }

    add_handler(route: CONSTRUCTOR, property: PropertyKey, options: botox.ROUTE_OPTIONS) {
        this.server.add_route(options.route, options.method, async (req, res) => {
            let instance = botox.container.instantiate(route);

            if (options.content_type && options.content_type != req.headers["content-type"]) {
                res.statusCode = 415;
                res.end();
                return;
            }

            instance[property](res, req);
        });
    }
}
