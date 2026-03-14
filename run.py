from app import create_app
import os

app = create_app()
port = os.getenv('HTTP_PORT') or 8080

if __name__ == '__main__':
    app.run(debug=False, host='127.0.0.1', port=port)
