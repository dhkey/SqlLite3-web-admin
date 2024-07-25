from flask import Flask, render_template, request, jsonify
import sqlite3

#full name of database with format
name_of_database = "database.db"

app = Flask(__name__)

app.debug=True

@app.route('/admin')
def index():
    with sqlite3.connect(name_of_database) as conn:
        cursor = conn.cursor()
        pm = cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = pm.fetchall()
        table_names = [table[0] for table in tables]
        cursor.execute(f'SELECT * FROM {table_names[0]}')
        data = cursor.fetchall()
        return render_template('index.html', data=data)

@app.route("/get_tables_names", methods=["POST"])
def get_names():
    with sqlite3.connect(name_of_database) as db:
        cursor =  db.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        table_names = [table[0] for table in tables]
        return jsonify({"table_names": table_names})

@app.route('/get_data', methods=['POST'])
def get_data():

    data = request.json
    table_name = data.get('table_name')
    offset = data.get('offset')
    limit = data.get('limit')
    filters = data.get('filters')

    #connecttion with database
    conn = sqlite3.connect(name_of_database)
    cursor = conn.cursor()

    #get info about columns
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns_info = cursor.fetchall()
    column_names = [info[1] for info in columns_info]
    column_names.insert(0, "rowid")
    
    #base request
    base_query = f"SELECT rowid, * FROM {table_name}"
    filter_clauses = []
    params = []
    for column, value in filters.items():
        if value:
            filter_clauses.append(f"{column} = ?")
            params.append(value)

    #adding filters to reuquest if exists
    if filter_clauses:
        base_query += " WHERE " + " AND ".join(filter_clauses)

    base_query += " LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cursor.execute(base_query, params)
    rows = cursor.fetchall()
    #closing the connection
    conn.close()

    return jsonify({"columns": column_names, "data": rows})

@app.route('/get_by_rowid', methods=['POST'])
def get_data_rowid():

    data = request.json    
    table_name = data.get('table_name')
    rowid = data.get('rowid')

    conn = sqlite3.connect(name_of_database)
    cursor = conn.cursor()
    
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns_info = cursor.fetchall()
    column_names = [info[1] for info in columns_info]
    column_names.insert(0, "rowid")

    cursor.execute(f"SELECT * FROM {table_name} WHERE _rowid_ = {rowid}")
    rows = cursor.fetchall()

    conn.close()

    return jsonify({"columns": column_names, "data": rows})

#edit data handler
@app.route('/edit', methods=['POST'])
def edit_tovar():

    data = request.json
    table_name = data.get('table_name')
    row = data.get('row')

    #connection
    conn = sqlite3.connect(name_of_database)
    cursor = conn.cursor()

    cursor.execute(f"PRAGMA table_info({table_name})")
    columns_info = cursor.fetchall()
    column_names = [info[1] for info in columns_info]
    rowid = row[0]
    row = row[1:]
    for i in range(len(column_names)):
        cursor.execute(f"UPDATE {table_name} SET {column_names[i]} = ? WHERE rowid = {rowid}", (row[i], ))
    conn.commit()
    return {"status": 200}


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8000, debug=True)
