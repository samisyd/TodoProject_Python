# To-Do List REST API

A simple REST API built with Python Flask and Pydantic v1.x for request/response validation, featuring a modern web-based GUI.

## Features

- Beautiful, responsive HTML/CSS/JavaScript interface
- Create, Read, Update, and Delete todos
- Request/response validation using Pydantic v1.x
- In-memory storage (data is lost on server restart)
- RESTful API design
- Filter todos by status (All, Active, Completed)
- Real-time updates and notifications

## Installation

1. Create a virtual environment (recommended):
```bash
python -m venv venv
```

2. Activate the virtual environment:
   - On Windows: `venv\Scripts\activate`
   - On macOS/Linux: `source venv/bin/activate`

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Application

```bash
python app.py
```

The application will be available at `http://localhost:5000`

### Web Interface

Simply open your browser and navigate to `http://localhost:5000` to access the web-based To-Do List interface.

**GUI Features:**
- Add new todos with title, description, and completion status
- Edit existing todos
- Delete individual todos or clear all todos at once
- Filter todos by status (All, Active, Completed)
- Toggle completion status with a single click
- View creation and update timestamps
- Responsive design that works on desktop and mobile devices

## API Endpoints

### Health Check
- **GET** `/health` - Check if the API is running

### Get All Todos
- **GET** `/todos` - Retrieve all todos

### Get Todo by ID
- **GET** `/todos/<todo_id>` - Retrieve a specific todo

### Create Todo
- **POST** `/todos` - Create a new todo
  - Request body:
    ```json
    {
      "title": "Buy groceries",
      "description": "Milk, eggs, bread",
      "completed": false
    }
    ```
  - Required fields: `title` (min 1, max 200 characters)
  - Optional fields: `description` (max 1000 characters), `completed` (default: false)

### Update Todo
- **PUT** `/todos/<todo_id>` - Update an existing todo
  - Request body (all fields optional):
    ```json
    {
      "title": "Buy groceries",
      "description": "Milk, eggs, bread, butter",
      "completed": true
    }
    ```

### Delete Todo
- **DELETE** `/todos/<todo_id>` - Delete a specific todo

### Delete All Todos
- **DELETE** `/todos` - Delete all todos

## Example Usage

### Create a todo
```bash
curl -X POST http://localhost:5000/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Learn Flask", "description": "Build a REST API", "completed": false}'
```

### Get all todos
```bash
curl http://localhost:5000/todos
```

### Update a todo
```bash
curl -X PUT http://localhost:5000/todos/<todo_id> \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

### Delete a todo
```bash
curl -X DELETE http://localhost:5000/todos/<todo_id>
```

## Error Responses

The API returns appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

Validation errors include detailed information about what went wrong.

## Technologies Used

### Backend
- **Flask** - Web framework
- **Pydantic v1.x** - Data validation using Python type annotations
- **Python** - Programming language

### Frontend
- **HTML5** - Structure
- **CSS3** - Modern styling with gradients and animations
- **JavaScript (ES6+)** - Interactive functionality and API communication
