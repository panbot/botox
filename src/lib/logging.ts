import { isPromise } from 'node:util/types';
import aop_factory from './aop/factory';

namespace logging {
    export type LEVEL = number;

    export const create_loggers = <
        LEVELS extends Record<PropertyKey, logging.LEVEL>,
        LOGGERS extends Record<keyof LEVELS, (args: any) => void>,
    >(
        levels: LEVELS,
        loggers: LOGGERS,
        level: logging.LEVEL,
    ): LOGGERS => {
        return Object.fromEntries(Object.entries(levels).map(
            ([ k, v ]) => [
                k,
                v < level
                    ? () => {}
                    : loggers[k]
            ]
        )) as any
    }

    export const create_decorators = <
        LEVELS extends Record<PropertyKey, logging.LEVEL>,
        LOGGERS extends Record<keyof LEVELS, (args: any) => void>,
    >(
        after: aop_factory.AOP["after"],
        levels: LEVELS,
        loggers: LOGGERS,
        level: logging.LEVEL,
    ): {
        [ P in keyof LOGGERS ]: <T, M, D>(
            on_success?: (
                log: LOGGERS[P],
                result: aop_factory.RETURN_TYPE<D> extends Promise<infer U> ? U : aop_factory.RETURN_TYPE<D>,
                pointcut: aop_factory.AFTER_POINTCUT<T, M, D>,
                loggers: LOGGERS,
            ) => void,
            on_failure?: (
                log: LOGGERS[P],
                error: any,
                pointcut: aop_factory.AFTER_POINTCUT<T, M, D>,
                loggers: LOGGERS,
            ) => void,
        ) => ( aop_factory.DECORATOR<T, M, D> )
    } => Object.fromEntries(Object.entries(levels).map(
        ([ k, v ]) => [
            k,
            v < level
                ? () => () => {}
                : <T, M, D>(
                    on_success?: (
                        log: any,
                        result: any,
                        pointcut : aop_factory.AFTER_POINTCUT<T, M, D>,
                        loggers: LOGGERS,
                    ) => void,
                    on_failure?: (
                        log: any,
                        error: any,
                        pointcut : aop_factory.AFTER_POINTCUT<T, M, D>,
                        loggers: LOGGERS,
                    ) => void,
                ) => after<T, M, D>(p => {
                    if (isPromise(p.result)) {
                        p.result.then(
                            r => on_success?.(loggers[k], r, p, loggers)
                        ).catch(
                            e => on_failure?.(loggers[k], e, p, loggers)
                        );

                        return p.result;
                    } else if (p.error) {
                        on_failure?.(loggers[k], p.result, p, loggers);

                        throw p.result;
                    } else {
                        on_success?.(loggers[k], p.result, p, loggers);

                        return p.result;
                    }
                })
        ]
    )) as any
}

export default logging;
