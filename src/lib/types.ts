export type CONSTRUCTOR<T> = new (...args: any[]) => T

export type INSTANTIATOR = <T>(type: CONSTRUCTOR<T>) => T

export type MAYBE<T> = T | undefined;

export type REQUIRED_KEY<T, K extends keyof T> = {
    [P in K]-?: T[P];
} & Omit<T, K>;

export type IS<X, Y> = (
    <T>() => T extends X ? true : false
) extends (
    <T>() => T extends Y ? true : false
) ? true : false;

export type GET_HEAD<T> = T extends any[] ? T[0] : never;
export type REMOVE_HEAD<T> = T extends [ any, ...infer U ] ? U : never;

export function typram<T>() { return new typram.Typram<T>() }
export namespace typram {

    export function factory<CONSTRAINT = any>() {
        return <T extends CONSTRAINT>() => new Typram<T>
    }

    export class Typram<T> {
        // an impossible signature to match to avoid mistakes like:
        // let t: typram.Param<any> = typram<T>
        #t!: T
    }
}
