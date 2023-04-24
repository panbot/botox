import factory from '@/hashcash';

const hashcash = factory('sha256');

@hashcash.protect(5)
class MyProtectedApi {

    @hashcash.protect(5)
    some_method() {

    }
}


let request = {
    body: JSON.stringify(({api: 'MyProtectedApi', params: {}})),
    headers: {
        get 'x-hashcash'() {
            while (true) {
                let cash = Math.random().toString();
                let zeros = hashcash.consume_hashcash(request.body, cash);
                if (zeros >= 4) return cash;
            }
        },
    }
};

hashcash.set_provided_difficulty(
    request,
    hashcash.consume_hashcash(request.body, request.headers['x-hashcash']),
);

let api = new MyProtectedApi();
if (hashcash.check(request, api)) {
    console.log('pass');
} else {
    console.log(
        'fail',
        'required difficulty', hashcash.get_resource_difficulty(api),
        'provided difficulty', hashcash.get_provided_difficulty(request),
    );
}
