export interface IRepository<T extends { id: string }> {
  getAll(): T[];
  getById(id: string): T | undefined;
  create(item: T): T;
  update(id: string, item: Partial<T>): T;
  delete(id: string): boolean;
  query(predicate: (item: T) => boolean): T[];
}
