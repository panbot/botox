export type CONSTRUCTOR<T> = new (...args: any[]) => T

export type INSTANTIATOR = <T>(type: CONSTRUCTOR<T>) => T

export type MAYBE<T> = T | undefined;

export type REQUIRED_KEY<T, K extends keyof T> = {
    [P in K]-?: T[P];
} & Omit<T, K>

export type IS_EQUAL<X, Y> = (
    <T>() => T extends X ? true : false
) extends (
    <T>() => T extends Y ? true : false
) ? true : false

export type REMOVE_HEAD<T> = T extends [ any, ...infer U ] ? U : never
export type RemoveTail<T> = T extends [ ...infer U, any ] ? U : never
export type GetHead<T> = T extends [ infer U, ...any ] ? U : never


export function typram<T>() { new typram.Param<T> }
export namespace typram {
    export class Param<T> {}
}
