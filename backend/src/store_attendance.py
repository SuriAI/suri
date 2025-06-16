import sqlite3

connect = sqlite3.connect("connection.db")
c = connect.cursor()
c.execute("CREATE TABLE IF NOT EXISTS attendance(id INTEGER PRIMARY KEY, name TEXT, timestamp TEXT)")

def mark_attendance(name):
    c.execute("INSERT INTO attendance(name, timestamp) VALUES(?, datetime('now'))", (name,))

def mark_multiple_attendance(names):
    c.execute("INSERT INTO attendance(name, timestamp) VALUES(?, datetime('now'))", [(name,) for name in names])

# mark_attendance("Raiven")
# mark_multiple_attendance(["John Doe", "Jane Smith", "Mike Reyes"])

# c.execute("SELECT * FROM attendance")
# rows = c.fetchall()
# for row in rows:
#     print(row)

# c.execute("DELETE FROM attendance")

