"""
GDC 审计任务工时管理系统 — 本地后端服务器
SQLite + Flask REST API，数据100%存储在本地
仅局域网内可访问，不经过任何第三方服务器
"""
import sqlite3
import os
import json
from datetime import datetime
from flask import Flask, request, jsonify, g
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gdc_data.db')

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA journal_mode=WAL")
        g.db.execute("PRAGMA foreign_keys=ON")
    return g.db

@app.teardown_appcontext
def close_db(exception):
    db = g.pop('db', None)
    if db: db.close()

def init_db():
    db = sqlite3.connect(DB_PATH)
    db.executescript("""
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
            client TEXT DEFAULT '', created_at TEXT DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL,
            account TEXT DEFAULT '', unique_code TEXT NOT NULL UNIQUE,
            project_id TEXT, FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS time_entries (
            id TEXT PRIMARY KEY, task_id TEXT NOT NULL, member TEXT NOT NULL,
            date TEXT NOT NULL, hours REAL NOT NULL, notes TEXT DEFAULT '',
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS allocation_rules (
            id TEXT PRIMARY KEY, task_id TEXT NOT NULL, project_id TEXT NOT NULL,
            percent REAL NOT NULL,
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );
    """)
    db.commit()
    db.close()

# ========== Projects API ==========
@app.route('/api/projects', methods=['GET'])
def get_projects():
    rows = get_db().execute("SELECT * FROM projects ORDER BY created_at DESC").fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/projects', methods=['POST'])
def add_project():
    data = request.json
    db = get_db()
    try:
        db.execute("INSERT INTO projects (id,code,name,client,created_at) VALUES (?,?,?,?,?)",
                   [data['id'], data['code'], data['name'], data.get('client',''), data.get('createdAt','')])
        db.commit()
        return jsonify({"ok": True}), 201
    except sqlite3.IntegrityError as e:
        return jsonify({"error": "项目编号重复" if "UNIQUE" in str(e) else str(e)}), 400

@app.route('/api/projects/<pid>', methods=['DELETE'])
def delete_project(pid):
    db = get_db()
    db.execute("DELETE FROM projects WHERE id=?", [pid])
    db.commit()
    return jsonify({"ok": True})

# ========== Tasks API ==========
@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    rows = get_db().execute("SELECT * FROM tasks ORDER BY unique_code").fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/tasks', methods=['POST'])
def add_task():
    data = request.json
    db = get_db()
    try:
        db.execute("INSERT INTO tasks (id,name,type,account,unique_code,project_id) VALUES (?,?,?,?,?,?)",
                   [data['id'], data['name'], data['type'], data.get('account',''),
                    data['uniqueCode'], data.get('projectId','')])
        db.commit()
        return jsonify({"ok": True}), 201
    except sqlite3.IntegrityError as e:
        return jsonify({"error": "唯一识别码重复" if "UNIQUE" in str(e) else str(e)}), 400

@app.route('/api/tasks/<tid>', methods=['DELETE'])
def delete_task(tid):
    db = get_db()
    db.execute("DELETE FROM tasks WHERE id=?", [tid])
    db.commit()
    return jsonify({"ok": True})

# ========== Time Entries API ==========
@app.route('/api/time-entries', methods=['GET'])
def get_time_entries():
    rows = get_db().execute("SELECT * FROM time_entries ORDER BY date DESC, id DESC").fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/time-entries', methods=['POST'])
def add_time_entry():
    data = request.json
    db = get_db()
    db.execute("INSERT INTO time_entries (id,task_id,member,date,hours,notes) VALUES (?,?,?,?,?,?)",
               [data['id'], data['taskId'], data['member'], data['date'],
                data['hours'], data.get('notes','')])
    db.commit()
    return jsonify({"ok": True}), 201

@app.route('/api/time-entries/<eid>', methods=['DELETE'])
def delete_time_entry(eid):
    db = get_db()
    db.execute("DELETE FROM time_entries WHERE id=?", [eid])
    db.commit()
    return jsonify({"ok": True})

# ========== Allocation Rules API ==========
@app.route('/api/allocation-rules', methods=['GET'])
def get_allocation_rules():
    rows = get_db().execute("SELECT * FROM allocation_rules").fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/allocation-rules', methods=['POST'])
def add_allocation_rule():
    data = request.json
    db = get_db()
    existing = db.execute("SELECT id FROM allocation_rules WHERE task_id=? AND project_id=?",
                          [data['taskId'], data['projectId']]).fetchone()
    if existing:
        db.execute("UPDATE allocation_rules SET percent=? WHERE id=?",
                   [data['percent'], existing['id']])
    else:
        db.execute("INSERT INTO allocation_rules (id,task_id,project_id,percent) VALUES (?,?,?,?)",
                   [data['id'], data['taskId'], data['projectId'], data['percent']])
    db.commit()
    return jsonify({"ok": True})

@app.route('/api/allocation-rules/<rid>', methods=['DELETE'])
def delete_allocation_rule(rid):
    db = get_db()
    db.execute("DELETE FROM allocation_rules WHERE id=?", [rid])
    db.commit()
    return jsonify({"ok": True})

# ========== Health ==========
@app.route('/api/health', methods=['GET'])
def health():
    db = get_db()
    p = db.execute("SELECT COUNT(*) as n FROM projects").fetchone()['n']
    t = db.execute("SELECT COUNT(*) as n FROM tasks").fetchone()['n']
    e = db.execute("SELECT COUNT(*) as n FROM time_entries").fetchone()['n']
    return jsonify({"status":"ok", "projects":p, "tasks":t, "timeEntries":e, "dbPath": DB_PATH})

if __name__ == '__main__':
    init_db()
    print("=" * 55)
    print("  GDC 审计工时系统 — 本地服务器已启动")
    print(f"  数据库: {DB_PATH}")
    print(f"  本机访问: http://127.0.0.1:5000")
    print(f"  团队访问: http://<你的IP>:5000")
    print("  按 Ctrl+C 停止服务器")
    print("=" * 55)
    app.run(host='0.0.0.0', port=5000, debug=False)
