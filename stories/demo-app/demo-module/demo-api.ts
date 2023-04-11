import runnable from "@/lib/runnable";
import botox from "../botox";

@botox.api()
export class DemoApi implements runnable.Runnable {


    @botox.logging.decorators.debug(
        (log, r) => log(r),
        (log, e) => log(e),
    )
    async [runnable.run]() {
        console.log('hello world!')

        return 0;
    }

}