import runnable from "@/lib/runnable";
import botox from "../botox";

@botox.api()
export class DemoApi implements runnable.Runnable {



    async [runnable.run]() {
        console.log('hello world!')
    }

}