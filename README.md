# OrgaFlow

A project management tool built with Django (GraphQL) and React. It handles multi-tenancy, so you can manage multiple organizations, projects, and tasks in one place.

## Tech Stack

*   **Backend**: Django, Graphene (GraphQL), SQLite
*   **Frontend**: React, Apollo Client, Tailwind CSS

## Getting Started

### Backend

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Run migrations:
    ```bash
    python manage.py migrate
    ```
4.  Start the server:
    ```bash
    python manage.py runserver 0.0.0.0:4320
    ```

### Frontend

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev 
    ```

## Demo Credentials

*   **Owner**: `owner@example.com` / `password123`
*   **Member**: `member@example.com` / `password123`
