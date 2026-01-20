from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from pydantic import BaseModel, ValidationError, Field, validator
from typing import Optional, List
from datetime import datetime
import uuid
import os

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)  # Enable CORS for all routes

# In-memory storage for todos
todos = {}


# Pydantic models for request/response validation
class TodoCreate(BaseModel):
    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Todo title (required, 1-200 characters)",
        example="Buy groceries"
    )
    description: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="Todo description (optional, max 1000 characters)",
        example="Milk, eggs, bread"
    )
    completed: bool = Field(
        default=False,
        description="Completion status (default: false)"
    )
    
    @validator('title', pre=True)
    def validate_and_strip_title(cls, v_title):
        if isinstance(v_title, str):
            v_title = v_title.strip()
            if len(v_title) == 0:
                raise ValueError('Title cannot be empty or only whitespace')
        return v_title
    
    @validator('description', pre=True)
    def validate_and_strip_description(cls, v_desc):
        if v_desc is not None and isinstance(v_desc, str):
            v_desc = v_desc.strip() if v_desc.strip() else None  # Convert empty strings to None
        return v_desc


class TodoUpdate(BaseModel):
    title: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=200,
        description="Todo title (optional, 1-200 characters if provided)",
        example="Buy groceries"
    )
    description: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="Todo description (optional, max 1000 characters)",
        example="Milk, eggs, bread"
    )
    completed: Optional[bool] = Field(
        default=None,
        description="Completion status (optional)"
    )
    
    @validator('title', pre=True)
    def validate_and_strip_title(cls, v):
        if v is not None and isinstance(v, str):
            v = v.strip()
            if len(v) == 0:
                raise ValueError('Title cannot be empty or only whitespace')
        return v
    
    @validator('description', pre=True)
    def validate_and_strip_description(cls, v):
        if v is not None and isinstance(v, str):
            v = v.strip() if v.strip() else None  # Convert empty strings to None
        return v


class TodoResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    completed: bool
    created_at: str
    updated_at: str

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


@app.route('/')
def index():
    """Serve the main HTML page"""
    return send_from_directory('static', 'index.html')


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy"}), 200


@app.route('/todos', methods=['GET'])
def get_all_todos():
    """Get all todos"""
    todo_list = [todo for todo in todos.values()]
    return jsonify([todo for todo in todo_list]), 200


@app.route('/todos/<todo_id>', methods=['GET'])
def get_todo(todo_id):
    """Get a specific todo by ID"""
    if todo_id not in todos:
        return jsonify({"error": "Todo not found"}), 404
    
    return jsonify(todos[todo_id]), 200


@app.route('/todos', methods=['POST'])
def create_todo():
    """Create a new todo"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400
        
        # Pydantic will apply Field defaults and validators automatically
        todo_data = TodoCreate(**data)
        todo_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        new_todo = {
            "id": todo_id,
            "title": todo_data.title,  # Already validated and stripped by validator
            "description": todo_data.description,  # Already validated and stripped by validator
            "completed": todo_data.completed,  # Default applied by Field(default=False)
            "created_at": now,
            "updated_at": now
        }
        
        todos[todo_id] = new_todo
        return jsonify(new_todo), 201
    
    except ValidationError as e:
        return jsonify({"error": "Validation error", "details": e.errors()}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/todos/<todo_id>', methods=['PUT'])
def update_todo(todo_id):
    """Update an existing todo"""
    if todo_id not in todos:
        return jsonify({"error": "Todo not found"}), 404
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400
        
        todo_update = TodoUpdate(**data)
        existing_todo = todos[todo_id]
        
        # Update fields if provided (validators have already processed and stripped values)
        if todo_update.title is not None:
            existing_todo["title"] = todo_update.title  # Already validated and stripped
        if todo_update.description is not None:
            existing_todo["description"] = todo_update.description  # Already validated and stripped
        if todo_update.completed is not None:
            existing_todo["completed"] = todo_update.completed
        
        existing_todo["updated_at"] = datetime.now().isoformat()
        todos[todo_id] = existing_todo
        
        return jsonify(existing_todo), 200
    
    except ValidationError as e:
        return jsonify({"error": "Validation error", "details": e.errors()}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/todos/<todo_id>', methods=['DELETE'])
def delete_todo(todo_id):
    """Delete a todo"""
    if todo_id not in todos:
        return jsonify({"error": "Todo not found"}), 404
    
    del todos[todo_id]
    return jsonify({"message": "Todo deleted successfully"}), 200


@app.route('/todos', methods=['DELETE'])
def delete_all_todos():
    """Delete all todos"""
    todos.clear()
    return jsonify({"message": "All todos deleted successfully"}), 200


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

