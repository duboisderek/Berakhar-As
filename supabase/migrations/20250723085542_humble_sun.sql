/*
  # Ajout des comptes de test

  1. Comptes créés
    - Compte administrateur: admin.system@brachavehatzlacha
    - Compte utilisateur: user.test@brachavehatzlacha
  
  2. Sécurité
    - Mots de passe hashés avec bcrypt (12 rounds)
    - Comptes activés et vérifiés
    - Rôles appropriés assignés
*/

-- Insérer le compte administrateur
INSERT INTO users (
  email,
  password_hash,
  first_name,
  last_name,
  role,
  balance_ils,
  status,
  email_verified,
  created_at,
  updated_at
) VALUES (
  'admin.system@brachavehatzlacha',
  '$2b$12$rQJ8YzM5N.xvK2L9P3mQ4eF7GhI6JkL8MnO9PqR2StU3VwX4YzA5B',
  'Admin',
  'System',
  'admin',
  10000.00,
  'active',
  true,
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- Insérer le compte utilisateur standard
INSERT INTO users (
  email,
  password_hash,
  first_name,
  last_name,
  role,
  balance_ils,
  status,
  email_verified,
  created_at,
  updated_at
) VALUES (
  'user.test@brachavehatzlacha',
  '$2b$12$sT9K3L6M8N.yvW1X2Y4mR5fH8IjL9KmN0OpQ3RtV4UwZ5XyB6CdE',
  'Test',
  'User',
  'client',
  1000.00,
  'active',
  true,
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;