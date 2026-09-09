/**
 * Makes a user-supplied string safe to drop into a `$regex`.
 *
 * Every search term reaching Mongo goes through this. Unescaped, `c++` fails to
 * compile and a term of nested quantifiers (`(a+)+$`) is a denial of service —
 * which is exactly what `MongoQuery` used to hand straight to the driver.
 */
export const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
