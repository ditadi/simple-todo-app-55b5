
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { getTodos } from '../handlers/get_todos';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();
    
    expect(result).toEqual([]);
  });

  it('should return all todos', async () => {
    // Create test todos
    await db.insert(todosTable)
      .values([
        {
          title: 'First Todo',
          description: 'First todo description',
          completed: false
        },
        {
          title: 'Second Todo',
          description: null,
          completed: true
        }
      ])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('First Todo');
    expect(result[0].description).toEqual('First todo description');
    expect(result[0].completed).toEqual(false);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].title).toEqual('Second Todo');
    expect(result[1].description).toBeNull();
    expect(result[1].completed).toEqual(true);
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].updated_at).toBeInstanceOf(Date);
  });

  it('should return todos in database order', async () => {
    // Create multiple todos
    await db.insert(todosTable)
      .values([
        { title: 'Todo A', description: 'Description A', completed: false },
        { title: 'Todo B', description: 'Description B', completed: true },
        { title: 'Todo C', description: null, completed: false }
      ])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    expect(result[0].title).toEqual('Todo A');
    expect(result[1].title).toEqual('Todo B');
    expect(result[2].title).toEqual('Todo C');
  });
});
