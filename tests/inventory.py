import sqlite3,pathlib
c=sqlite3.connect(':memory:');c.execute('PRAGMA foreign_keys=ON');c.executescript(pathlib.Path('drizzle/0000_famous_donald_blake.sql').read_text())
c.execute("INSERT INTO products VALUES('a','{}',3,1200)");c.execute("INSERT INTO products VALUES('b','{}',1,1200)");c.commit()
def order(id,lines):
 try:
  with c:
   c.execute("INSERT INTO orders(id,user_id,email,status,total,shipping,created_at,request_key) VALUES(?,?,?,'pending',2400,0,1,?)",(id,'u','u@example.test',id))
   for bid,qty in lines:c.execute('INSERT INTO order_items VALUES(?,?,?,?,?,?)',(id+bid,id,bid,bid,qty,1200))
 except sqlite3.IntegrityError:return False
 return True
assert order('first',[('a',2)])
assert c.execute("SELECT stock FROM products WHERE id='a'").fetchone()[0]==1
assert not order('over',[('a',2)])
assert c.execute("SELECT COUNT(*) FROM orders WHERE id='over'").fetchone()[0]==0
assert not order('rollback',[('a',1),('b',2)])
assert c.execute("SELECT stock FROM products WHERE id='a'").fetchone()[0]==1
for _ in range(2):
 with c:
  c.execute("UPDATE products SET stock=stock+COALESCE((SELECT quantity FROM order_items WHERE order_id=? AND book_id=products.id),0) WHERE id IN(SELECT book_id FROM order_items WHERE order_id=?) AND EXISTS(SELECT 1 FROM orders WHERE id=? AND status='pending')",('first','first','first'))
  c.execute("UPDATE orders SET status='expired' WHERE id=? AND status='pending'",('first',))
assert c.execute("SELECT stock FROM products WHERE id='a'").fetchone()[0]==3
print('PASS: atomic stock reservation, oversell rejection, multi-item rollback, idempotent stock release')
