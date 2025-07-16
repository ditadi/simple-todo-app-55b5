
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // Create a test todo first
    const insertResult = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo to be deleted',
        completed: false
      })
      .returning()
      .execute();

    const todoId = insertResult[0].id;

    // Delete the todo
    const deleteInput: DeleteTodoInput = { id: todoId };
    const result = await deleteTodo(deleteInput);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify todo no longer exists in database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent todo', async () => {
    // Try to delete a todo that doesn't exist
    const deleteInput: DeleteTodoInput = { id: 999 };
    const result = await deleteTodo(deleteInput);

    // Should return success false
    expect(result.success).toBe(false);
  });

  it('should not affect other todos when deleting', async () => {
    // Create multiple test todos
    const insertResult = await db.insert(todosTable)
      .values([
        { title: 'Todo 1', description: 'First todo', completed: false },
        { title: 'Todo 2', description: 'Second todo', completed: true },
        { title: 'Todo 3', description: 'Third todo', completed: false }
      ])
      .returning()
      .execute();

    const todoToDelete = insertResult[1]; // Delete the second todo

    // Delete one specific todo
    const deleteInput: DeleteTodoInput = { id: todoToDelete.id };
    const result = await deleteTodo(deleteInput);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify other todos still exist
    const remainingTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(remainingTodos).toHaveLength(2);
    expect(remainingTodos.map(t => t.title)).toEqual(['Todo 1', 'Todo 3']);
  });
});
