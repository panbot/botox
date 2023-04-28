import { IncomingMessage, ServerResponse, createServer } from "http";

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

        if (req.method == 'OPTIONS') {
            cors();
        } else {
            handle();
        }

        function handle() {
            const route = routes.find(r => req.url?.startsWith(r.route) && r.method == req.method);
            if (!route) {
                res.statusCode = 404;
                res.end('404 not found');
                return;
            }

            res.setHeader('access-control-allow-credentials' , 'true');
            res.setHeader('access-control-allow-origin'      , req.headers['origin'] ?? '*');
            res.setHeader('access-control-max-age'           , 3600);

            route.handler(req, res);
        }

        function cors() {
            const route = routes.find(
                r => req.url?.startsWith(r.route)
                    && r.method == req.headers['access-control-request-method']
            );
            if (!route) {
                res.statusCode = 404;
                res.end();
                return;
            }

            res.statusCode = 204;

            res.setHeader('access-control-allow-credentials' ,  'true');
            res.setHeader('access-control-allow-headers'     ,  [
                                                                    'content-type',
                                                                    'authorization',
                                                                ].join(', '));
            res.setHeader('access-control-allow-methods'     ,  route.method);
            res.setHeader('access-control-allow-origin'      ,  req.headers['origin'] ?? '*');
            res.setHeader('access-control-max-age'           ,  3600);

            res.end();
        }
    });

    return {
        add_route: (route: string, method: string, handler: HANDLER) => routes.push({ route, method, handler }),
        start: (port: number) => server.listen(port),
    }
}

export default create_http_server
