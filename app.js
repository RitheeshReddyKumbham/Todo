const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const format = require('date-fns/format')
const isValid = require('date-fns/isValid')
const isMatch = require('date-fns/isMatch')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const haspriorityandStatus = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}
const hasPriority = requestQuery => {
  return requestQuery.priority !== undefined
}
const hasStatus = requestQuery => {
  return requestQuery.status !== undefined
}
const hasCategoryandStatus = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}
const hasCategoryandPriority = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}
const hasCategory = requestQuery => {
  return requestQuery.category !== undefined
}
const hasSearch = requestQuery => {
  return requestQuery.search_q !== undefined
}
const outputResult = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  }
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodos = ''
  const {search_q = ' ', priority, status, category} = request.query
  switch (true) {
    case haspriorityandStatus(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodos = `
        SELECT * FROM todo 
        WHERE
        status='${status}' AND priority='${priority}';`
          data = await db.all(getTodos)
          response.send(data.map(eachItem => outputResult(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasCategoryandStatus(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodos = `
        SELECT * FROM todo 
        WHERE
        status='${status}' AND category='${category}';`
          data = await db.all(getTodos)
          response.send(data.map(eachItem => outputResult(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasCategoryandPriority(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          priority === 'HIGH' ||
          priority === 'MEDIUM' ||
          priority === 'LOW'
        ) {
          getTodos = `
        SELECT * FROM todo 
        WHERE
        priority='${priority}' AND category='${category}';`
          data = await db.all(getTodos)
          response.send(data.map(eachItem => outputResult(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasPriority(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        getTodos = `SELECT * FROM todo 
        WHERE
        priority='${priority}';`
        data = await db.all(getTodos)
        response.send(data.map(eachItem => outputResult(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasCategory(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        getTodos = `SELECT * FROM todo 
        WHERE
        category='${category}';`
        data = await db.all(getTodos)
        response.send(data.map(eachItem => outputResult(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasStatus(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getTodos = `SELECT * FROM todo 
        WHERE
        status='${status}';`
        data = await db.all(getTodos)
        response.send(data.map(eachItem => outputResult(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case hasSearch(request.query):
      getTodos = `SELECT * FROM todo 
        WHERE
        todo LIKE '%${search_q}%';`
      data = await db.all(getTodos)
      response.send(data.map(eachItem => outputResult(eachItem)))
      break
    default:
      getTodos = `SELECT * FROM todo;`
      data = await db.all(getTodos)
      response.send(data.map(eachItem => outputResult(eachItem)))
  }
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `
  SELECT * FROM todo 
  WHERE 
  id='${todoId}';`
  const todo = await db.get(getTodoQuery)
  response.send(outputResult(todo))
})
app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  if (isMatch(date, 'yyyy-MM-dd')) {
    const newDate = format(new Date(date), 'yyyy-MM-dd')
    const dateQuery = `SELECT * FROM todo WHERE due_date='${newDate}';`
    const dateresult = await db.all(dateQuery)
    response.send(dateresult.map(eachItem => outputResult(eachItem)))
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (isMatch(dueDate, 'yyyy-MM-dd')) {
          const postNewDate = format(new Date(dueDate), 'yyyy-MM-dd')
          const postQuery = `
          INSERT INTO 
          todo (id,todo,category,priority,status,due_date)
          VALUES ('${id}','${todo}','${category}','${priority}','${status}','${postNewDate}');`
          await db.run(postQuery)
          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
})
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const requestBody = request.body
  const previousTodoQuery = `
  SELECT 
  * 
  FROM 
  todo 
  WHERE 
  id='${todoId}';`
  const previousTodo = await db.get(previousTodoQuery)
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body
  let updateTodoQuery = ''
  switch (true) {
    case requestBody.status !== undefined:
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        updateTodoQuery = `
      UPDATE todo SET todo='${todo}',priority='${priority}',category='${category}',due_date='${dueDate}'
      WHERE 
      id='${todoId}';`
        await db.run(updateTodoQuery)
        response.send('Status Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case requestBody.priority !== undefined:
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        updateTodoQuery = `
      UPDATE todo SET todo='${todo}',priority='${priority}',category='${category}',due_date='${dueDate}'
      WHERE 
      id='${todoId}';`
        await db.run(updateTodoQuery)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case requestBody.category !== undefined:
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        updateTodoQuery = `
      UPDATE todo SET todo='${todo}',priority='${priority}',category='${category}',due_date='${dueDate}'
      WHERE 
      id='${todoId}';`
        await db.run(updateTodoQuery)
        response.send('Category Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case requestBody.todo !== undefined:
      updateTodoQuery = `
      UPDATE todo SET todo='${todo}',priority='${priority}',category='${category}',due_date='${dueDate}'
      WHERE 
      id='${todoId}';`
      await db.run(updateTodoQuery)
      response.send('Todo Updated')
      break
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, 'yyyy-MM-dd')) {
        const newDueDate = format(new Date(dueDate), 'yyyy-MM-dd')
        updateTodoQuery = `
      UPDATE todo SET todo='${todo}',priority='${priority}',category='${category}',due_date='${newDueDate}'
      WHERE 
      id='${todoId}';`
        await db.run(updateTodoQuery)
        response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
  }
})
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `
  DELETE FROM todo 
  WHERE
  id='${todoId}';`
  await db.run(deleteQuery)
  response.send('Todo Deleted')
})
module.exports = app
