import di from '@/dependency-injection';

const container = di();

class FailedInjection {

    constructor(
        @container.inject()
        public str: string,
    ) { }
}

container.instantiate(FailedInjection);
