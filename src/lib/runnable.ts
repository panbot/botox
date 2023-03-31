import { CONSTRUCTOR, INSTANTIATOR, REMOVE_HEAD, REQUIRED_KEY } from "./types";
import mr from './metadata-registry';

export namespace runnable {

    export const run = Symbol();

    export interface Runnable<T = unknown> {
        [run](...args: any[]): Promise<T>;
    }

    export interface RunArgFactory<RunArg = unknown> {

        produce_run_arg(for_runnable: Runnable, ...args: any): Promise<RunArg>;

        release_run_arg?(for_runnable: Runnable): Promise<void>;

        around_run?<T>(for_runnable: Runnable<T>, invoke: () => Promise<T>): Promise<T>;
    }

}

type GET_PRODUCER_ARGS<
    T extends runnable.RunArgFactory
> = REMOVE_HEAD<Parameters<T['produce_run_arg']>>;

type RUN_ARG<
    T extends runnable.RunArgFactory = runnable.RunArgFactory
> = {
    index: number,
    Factory: CONSTRUCTOR<T>,
    args: GET_PRODUCER_ARGS<T>,
};

type Arounder = REQUIRED_KEY<runnable.RunArgFactory, "around_run">;
function is_arounder(factory: runnable.RunArgFactory): factory is Arounder {
    return factory.around_run != null;
}

export default function (
    instantiate: INSTANTIATOR,
) {
    const get_registry = mr.property_factory(false)(mr.key<RUN_ARG[]>());

    return {
        run,

        run_arg: <T extends runnable.RunArgFactory>(
            Factory: CONSTRUCTOR<T>,
            ...args: GET_PRODUCER_ARGS<T>
        ) => <U>(
            proto: runnable.Runnable<U>,
            method: string,
            index: number,
        ) => get_registry(proto, method).get_or_set([]).push({ index, Factory, args }),
    }

    async function run<T>(
        instance: runnable.Runnable<T>,
    ) {
        let producers = get_registry(instance, runnable.run).get();
        if (!producers?.length) return await instance[runnable.run]();

        let args: any[] = [];
        let produce = async <U, T extends runnable.RunArgFactory<U>>(
            producer: RUN_ARG<T>,
            factory: T
        ) => args[producer.index] = await factory.produce_run_arg(
            instance,
            ...producer.args
        );

        let producing: Promise<any>[] = [];
        let releasing: (() => Promise<void> | void)[] = [];

        let arounders: Arounder[] = [];
        let around = (f: () => Promise<T>) => arounders.reduce(
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
            let invoke = () => instance[runnable.run](...args);

            if (!arounders.length) return await invoke();

            return await around(invoke)();
        } catch (e) {
            throw e;
        } finally {
            await Promise.all(releasing.map(r => r()));
        }
    }
}
