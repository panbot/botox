import di from '@/lib/dependency-injection';

const container = di();

class FailedInjection {

    constructor(
        @container.inject()
        public str: string,
    ) { }
}

container.instantiate(FailedInjection);
