
from flask import Flask, request, render_template, redirect, url_for, session
import sqlite3

app = Flask(__name__)
app.secret_key = 'your_secret_key'

ADMIN_USERNAME = 'halok'
ADMIN_PASSWORD = 'halok'
ADMIN_EMAIL = '0132552023654@gmail.com'

def get_db_connection():
    conn = sqlite3.connect('gym_management.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def home():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        email = request.form['email']
        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD and email == ADMIN_EMAIL:
            session['user_id'] = username
            return redirect(url_for('dashboard'))
        else:
            return "اسم المستخدم أو كلمة المرور غير صحيحة."
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('admin_dashboard.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('home'))

if __name__ == '__main__':
    app.run(debug=True)
