import fatory from '@/framework/api'

export class ApiOptions {
    constructor(
        public name: string,
    ) { }
}

export const Api = fatory<{}>().classAsApi(ctor => new ApiOptions(ctor.name));
