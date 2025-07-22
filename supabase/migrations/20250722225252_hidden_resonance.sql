@@ .. @@
 ALTER TABLE users ENABLE ROW LEVEL SECURITY;
 
+-- Allow anonymous users to register (insert new users)
+CREATE POLICY "Allow anonymous registration"
+  ON users
+  FOR INSERT
+  TO anon
+  WITH CHECK (true);
+
+-- Allow authenticated users to register (edge case)
+CREATE POLICY "Allow authenticated registration"
+  ON users
+  FOR INSERT
+  TO authenticated
+  WITH CHECK (true);
+
 -- Users can read their own profile
 CREATE POLICY "Users can read own profile"
   ON users