import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { deleteTodo,  } from '../../helpers/todos'
//import { getUserId } from '../utils'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    // TODO: Remove a TODO item by id
    try {
      await deleteTodo(todoId);
      return {
        statusCode: 204,
        body: JSON.stringify({
        })
      }
    } 
    catch(err) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          msg: (err as Error).message
        })
      }
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )