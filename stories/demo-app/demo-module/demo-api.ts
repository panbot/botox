import botox from "../botox";

@botox.api()
export class DemoApi implements botox.Api {


    @botox.logging.decorators.debug(
        (log, r) => log(r),
        (log, e) => log(e),
    )
    async run() {
        console.log('hello world!')

        return 0;
    }

}