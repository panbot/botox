import di from '@/lib/dependency-injection';
import proxitive_aop from '@/lib/aop/proxitive';
import logging from '@/lib/logging';
import { assert_true } from 'stories/asserts';
import { IS } from '@/lib/types';

const levels = {
    debug: 0,
    info: 1,
    warn: 2,
    crit: 3,
    log: 4,
};

const level = 2;

{
    const log = (...args: any) => {};

    const loggers = logging.create_loggers(log, levels, level);

    type LOGGERS = typeof loggers;

    assert_true<IS< LOGGERS, { [ P in keyof typeof levels]: typeof log } >>();
}

{
    const container = di();
    const aop = proxitive_aop(proxify => container.on('instantiated', proxify));

    const decorators = logging.create_decorators(
        aop.after,
        levels,
        level,
    );
    assert_true<IS<
        typeof decorators,
        {
            [ P in keyof typeof levels]: (callback: (error: any, result: any) => void) => MethodDecorator
        }
    >>();


    class MyService {

        @decorators.debug((e, r) => {

        })
        async someAsyncMethod(...args: number[]) {
            if (args.length > 5) throw new Error(`too many args`);
            return args.reduce((pv, cv) => pv + cv);
        }

        @decorators.debug((e, r) => {

        })
        someMethod(...args: number[]) {
            if (args.length > 5) throw new Error(`too many args`);
            return args.reduce((pv, cv) => pv + cv);
        }
    }

}
