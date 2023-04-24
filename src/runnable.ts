import { CONSTRUCTOR, INSTANTIATOR, REMOVE_HEAD, REQUIRED_KEY } from "./types";
import mr from './metadata-registry';

function runnable<M extends PropertyKey>(
    instantiate: INSTANTIATOR,
    method: M,
) {
    if (typeof method == 'symbol') {
        console.warn(
            `Parameter decorator doesn't work with symbol method at the moment.`,
            `(https://github.com/microsoft/TypeScript/issues/50305)`
        );
    }

    const get_registry = mr.property_factory(false)(mr.create_key<RUN_ARG[]>());

    return {
        run,

        run_arg: <
            O extends Object,
            P extends PropertyKey,
            I extends number,
            F extends runnable.RunArgFactory<RUN_ARG_TYPE<ARG_TYPE<O, P, I>>>
        >(
            Factory: CONSTRUCTOR<F>,
            ...args: PRODUCER_ARGS<F>
        ) => (
            proto: O,
            method: P,
            index: I,
        ) => void get_registry(proto, method).get_or_set([]).push({ index, Factory, args }),
    }

    async function run<
        T extends { [ P in M ]: (...args: any) => R },
        R extends T[M] extends (...args: any) => infer U ? U : never,
    >(
        instance: T,
    ) {
        let producers = get_registry(instance, method).get();
        if (!producers?.length) return await instance[method]();

        let args: any[] = [];
        let produce = async <T extends runnable.RunArgFactory>(
            producer: RUN_ARG<T>,
            factory: T
        ) => args[producer.index] = await factory.produce_run_arg(
            instance,
            ...producer.args
        );

        let producing: Promise<any>[] = [];
        let releasing: (() => Promise<void> | void)[] = [];

        let arounders: Arounder[] = [];
        let around = (f: () => R) => arounders.reduce(
            (pv, cv) => () => cv.around_run(instance, pv),
            f,
        )

        for (let producer of producers) {
            let factory = instantiate(producer.Factory);
            producing.push(produce(producer, factory));

            releasing.push(() => factory.release_run_arg?.(instance));

            if (is_arounder(factory)) arounders.push(factory);
        }

        try {
            await Promise.all(producing);
            let invoke = () => instance[method](...args);

            if (!arounders.length) return await invoke();

            return await around(invoke)();
        } catch (e) {
            throw e;
        } finally {
            await Promise.all(releasing.map(r => r()));
        }
    }
}

namespace runnable {

    export interface RunArgFactory<T = unknown> {
        produce_run_arg (for_runnable: any, ...args: any     ): T;
        release_run_arg?(for_runnable: any                   ): Promise<void> | void;
             around_run?(for_runnable: any, invoke: () => any): any;
    }

}

export default runnable;

type P_OF_T<P, T, O = never> = P extends keyof T ? T[P] : O
type ARGS_OF_T<T>
    = T extends (...args: infer U) => any
    ? U
    : never
;
type ARG_TYPE<T, P, I> = P_OF_T<I, ARGS_OF_T<P_OF_T<P, T>>, P_OF_T<P, T>>
type RUN_ARG_TYPE<T> = T | Promise<T>

type PRODUCER_ARGS<
    T extends runnable.RunArgFactory
> = REMOVE_HEAD<Parameters<T['produce_run_arg']>>;

type RUN_ARG<
    T extends runnable.RunArgFactory = runnable.RunArgFactory
> = {
    index: number,
    Factory: CONSTRUCTOR<T>,
    args: PRODUCER_ARGS<T>,
};

type Arounder = REQUIRED_KEY<runnable.RunArgFactory, "around_run">;
function is_arounder(factory: runnable.RunArgFactory): factory is Arounder {
    return factory.around_run != null;
}
