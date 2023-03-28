import desctructive from "./desctructive";
import { ADVICES } from "./factory";

export default function () {
    const aop = desctructive();

    return {
        before: create("before"),
        after: create("after"),
        around: create("around"),
    }

    type PARAMETERS = {
        [ K in keyof ADVICES ]: Parameters<ADVICES[K]>
    }

    function create<ADVICE extends keyof ADVICES>(
        advice: ADVICE,
    ) {
        return (
            target: any,
            method: PropertyKey,
            ...args: PARAMETERS[ADVICE]
        ) => {
            let descriptor = { value: target[method] } satisfies PropertyDescriptor;
            aop[advice](...args as [ any ])(
                target,
                method as any,
                descriptor
            )
            Reflect.defineProperty(target, method, descriptor);
        }
    }
}
