
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoCompletionInput, type CreateTodoInput } from '../schema';
import { updateTodoCompletion } from '../handlers/update_todo_completion';
import { eq } from 'drizzle-orm';

describe('updateTodoCompletion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo completion status to true', async () => {
    // Create a todo first using direct database insert
    const createInput: CreateTodoInput = {
      title: 'Test Todo',
      description: 'A test todo'
    };
    
    const createdTodos = await db.insert(todosTable)
      .values({
        title: createInput.title,
        description: createInput.description
      })
      .returning()
      .execute();
    
    const createdTodo = createdTodos[0];

    const updateInput: UpdateTodoCompletionInput = {
      id: createdTodo.id,
      completed: true
    };

    const result = await updateTodoCompletion(updateInput);

    // Verify the completion status was updated
    expect(result.id).toEqual(createdTodo.id);
    expect(result.title).toEqual('Test Todo');
    expect(result.description).toEqual('A test todo');
    expect(result.completed).toBe(true);
    expect(result.created_at).toEqual(createdTodo.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdTodo.updated_at.getTime());
  });

  it('should update todo completion status to false', async () => {
    // Create a todo first using direct database insert
    const createdTodos = await db.insert(todosTable)
      .values({
        title: 'Completed Todo',
        description: null
      })
      .returning()
      .execute();
    
    const createdTodo = createdTodos[0];

    // Mark as completed first
    await updateTodoCompletion({
      id: createdTodo.id,
      completed: true
    });

    // Now mark as incomplete
    const updateInput: UpdateTodoCompletionInput = {
      id: createdTodo.id,
      completed: false
    };

    const result = await updateTodoCompletion(updateInput);

    expect(result.id).toEqual(createdTodo.id);
    expect(result.title).toEqual('Completed Todo');
    expect(result.description).toBeNull();
    expect(result.completed).toBe(false);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save completion status to database', async () => {
    // Create a todo first using direct database insert
    const createdTodos = await db.insert(todosTable)
      .values({
        title: 'Database Test Todo',
        description: 'Testing database persistence'
      })
      .returning()
      .execute();
    
    const createdTodo = createdTodos[0];

    const updateInput: UpdateTodoCompletionInput = {
      id: createdTodo.id,
      completed: true
    };

    await updateTodoCompletion(updateInput);

    // Query the database directly to verify the update
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, createdTodo.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].completed).toBe(true);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
    expect(todos[0].updated_at.getTime()).toBeGreaterThan(createdTodo.updated_at.getTime());
  });

  it('should throw error for non-existent todo', async () => {
    const updateInput: UpdateTodoCompletionInput = {
      id: 999,
      completed: true
    };

    await expect(updateTodoCompletion(updateInput)).rejects.toThrow(/not found/i);
  });
});
