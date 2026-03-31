from app import create_app
from models import db, init_system_settings

app = create_app()

with app.app_context():
    db.create_all()
    init_system_settings()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)