import { IS } from '@/lib/types';
import { assert_false, assert_true, assert_type } from './asserts';

assert_true<IS<never, never>>()

assert_false<IS<string, never>>()

assert_type<number>().can_be_satisfied_by<number>();
assert_type<number>().can_be_satisfied_by<5>();
assert_type<number>().can_be_satisfied_by(6);

assert_type<string>().can_be_satisfied_by('');
assert_type<string>().can_be_satisfied_by<''>();
//@ts-expect-error
assert_type<string>().can_be_satisfied_by(5);

// @FIXME:
// // @ts-expect-error
// assert_type<string>().can_be_satisfied_by<never>();

//@ts-expect-error
assert_type<number>().can_be_satisfied_by('');
//@ts-expect-error
assert_type<number>().can_be_satisfied_by<string>();

assert_type<5>().satisfies<number>();
//@ts-expect-error
assert_type<5>().satisfies<string>();
//@ts-expect-error
assert_type<number>().satisfies<5>();

// @FIXME:
// //@ts-expect-error
// assert_type<string>().satisfies<never>();
