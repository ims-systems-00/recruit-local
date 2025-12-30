/**
 * Recursively swaps "id" keys to "_id" for Mongoose compatibility
 */
export const mapCaslQueryToMongo = (query: any): any => {
  if (Array.isArray(query)) {
    return query.map(mapCaslQueryToMongo);
  } else if (query !== null && typeof query === "object") {
    return Object.keys(query).reduce((acc, key) => {
      // If the key is 'id', rename it to '_id'
      const newKey = key === "id" ? "_id" : key;
      acc[newKey] = mapCaslQueryToMongo(query[key]);
      return acc;
    }, {} as any);
  }
  return query;
};
