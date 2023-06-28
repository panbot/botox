import botox from "../botox"

export function create_csrf_service(): CSRF_SERVICE {

    let counter = 0;

    return {
        async create_csrf_token(key) {
            ++counter;
            return counter.toString();
        },
        async get_csrf_token(key) {
            return counter.toString();
        },
        async clear_csrf_token(key) {
            counter = 0;
        }
    }
}

export type CSRF_SERVICE = {
    create_csrf_token(key: string): Promise<string>
    get_csrf_token(key: string): Promise<string>
    clear_csrf_token(key: string): Promise<void>
}
export const csrf_service_token = botox.container.create_token<CSRF_SERVICE>('csrf service');
