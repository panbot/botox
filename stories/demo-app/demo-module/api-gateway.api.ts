import botox from "../botox";

export class ApiGateway {

    @botox.route().content_type('application/json')
    'POST /api'(
        req: botox.Req,
        res: botox.Res,
    ) {
        console.log(req.headers);
        res.statusCode = 200;
        res.end('ok');
    }
}