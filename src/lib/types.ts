export type Constructor<T> = new (...args: any[]) => T;
export type Instantiator = <T>(type: Constructor<T>) => T;
export type RequiredKey<T, K extends keyof T> = {
    [P in K]-?: T[P];
} & Omit<T, K>;
