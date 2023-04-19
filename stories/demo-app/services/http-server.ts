import { IncomingMessage, ServerResponse, createServer } from "http";
import { parse } from "url";

type HANDLER = (req: IncomingMessage, res: ServerResponse<IncomingMessage>) => void

function create_http_server(
) {
    let routes: {
        route: string,
        method: string,
        handler: HANDLER,
    }[] = [];

    const server = createServer({

    }, (req, res) => {
        if (!req.url) {
            res.end();
            return;
        }

        const url = parse(req.url, true);
        const route = routes.find(r => r.route == url.pathname && r.method == req.method);
        if (!route) {
            res.statusCode = 404;
            res.end('404 not found');
            return;
        }

        route.handler(req, res);
    });

    return {
        add_route: (route: string, method: string, handler: HANDLER) => routes.push({ route, method, handler }),
        start: (port: number) => server.listen(port),
    }
}

export default create_http_server
