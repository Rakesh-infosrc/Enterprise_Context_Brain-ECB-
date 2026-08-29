import sqlite3
conn = sqlite3.connect('ecb_database.db')
c = conn.cursor()
# Set source_type based on project ID patterns
updates = [
    ('prj-kan', 'jira'),
    ('prj-sam1', 'jira'),
    ('prj-databricks', 'databricks'),
]
for pid, src in updates:
    c.execute("UPDATE projects SET source_type=? WHERE id=?", (src, pid))
    if c.rowcount > 0:
        print(f'Set {pid} source_type={src}')
# Set remaining unknown projects to github (they were synced from GitHub)
c.execute("UPDATE projects SET source_type='github' WHERE source_type IS NULL OR source_type='unknown'")
print(f'Set {c.rowcount} remaining projects to github')
conn.commit()
conn.close()
print('Done')
