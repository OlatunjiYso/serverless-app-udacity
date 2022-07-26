import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoPayload } from '../requests/CreateTodoRequest'
import { TodoUpdate } from '../models/TodoUpdate';

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic

export class TodosAccess {

    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly todosTable = process.env.TODOS_TABLE) {
      }

      async  getTodoById(todoId: string): Promise<TodoItem> {
        logger.info(`Getting a specified todo with ID: ${todoId}`)
        const result = await this.docClient.query({
          TableName: this.todosTable,
          KeyConditionExpression: 'todoId = :todoId',
          ExpressionAttributeValues: {
            ':todoId': todoId
          },
          ScanIndexForward: false
        }).promise()
        const item = result.Items[0]
        return item as TodoItem
      }

      async getUserTodos(userId: string): Promise<TodoItem[]> {
        logger.info(`Getting a User's todo with USERID: ${userId}`)
        const result = await this.docClient.query({
          TableName: this.todosTable,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': userId
          },
          ScanIndexForward: false
        }).promise()
        const items = result.Items
        return items as TodoItem[]
      }
    
      async createTodo(todo: CreateTodoPayload): Promise<CreateTodoPayload> {
        await this.docClient.put({
          TableName: this.todosTable,
          Item: todo
        }).promise()
        return todo
      }

      async deleteTodo(todoId: string, userId: string): Promise<string> {
        await this.docClient.delete({
          TableName: this.todosTable,
          Key: {
              todoId, userId
          }
        }).promise()
        return 'deleted'
      }

      async updateTodo(todoUpdate: TodoUpdate, todoId: string, userId: string): Promise<TodoUpdate> {
          const { name, dueDate, done } = todoUpdate;
        await this.docClient.update({
          TableName: this.todosTable,
          Key: {
             todoId, userId
        },
        UpdateExpression : "SET name = :name, dueDate = :dueDate, done = :done ",
          ExpressionAttributeValues: {
            ":name": name,
            ":dueDate": dueDate,
            ":done": done
        },
        ReturnValues: "UPDATED_NEW"

        }).promise()
        return todoUpdate
      }
}



function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
      console.log('Creating a local DynamoDB instance')
      return new XAWS.DynamoDB.DocumentClient({
        region: 'localhost',
        endpoint: 'http://localhost:8000'
      })
    }
  
    return new XAWS.DynamoDB.DocumentClient()
  }