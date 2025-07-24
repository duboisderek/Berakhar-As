# 🔐 GUIDE COMPLET DES ACCÈS PAR RÔLES
## Système de Loterie Crypto - ברכה והצלחה

---

## 📋 HIÉRARCHIE DES RÔLES

### 1. **CLIENT** (Utilisateur standard)
### 2. **ADMIN** (Administrateur)
### 3. **ROOT** (Super administrateur)

---

## 👤 RÔLE CLIENT

### **Pages Accessibles :**
- ✅ `/` - Page d'accueil
- ✅ `/home` - Tableau de bord principal
- ✅ `/profile` - Profil personnel
- ✅ `/deposit` - Dépôts crypto
- ✅ `/withdraw` - Retraits crypto
- ✅ `/tickets` - Historique des tickets

### **Pages Interdites :**
- ❌ `/admin/*` - Toutes les pages admin (redirection vers `/home`)

### **Fonctionnalités Disponibles :**

#### **🏠 Page d'Accueil (`/home`)**
- ✅ Voir sa balance personnelle
- ✅ Acheter des tickets de loterie (₪50)
- ✅ Sélectionner 6 numéros (1-37)
- ✅ Voir le countdown du prochain tirage
- ✅ Voir ses tickets récents
- ✅ Accès rapide dépôt/retrait

#### **👤 Profil (`/profile`)**
- ✅ Modifier ses informations personnelles
- ✅ Changer son mot de passe
- ✅ Voir l'historique de connexion
- ❌ Ne peut pas changer son email
- ❌ Ne peut pas changer son rôle

#### **💰 Dépôts (`/deposit`)**
- ✅ Déposer BTC, ETH, USDT-ERC20, USDT-TRC20
- ✅ Voir les taux de change en temps réel
- ✅ Voir l'historique de ses dépôts
- ✅ Suivre le statut des dépôts (pending/confirmed/rejected)

#### **💸 Retraits (`/withdraw`)**
- ✅ Retirer vers BTC, ETH, USDT-ERC20, USDT-TRC20
- ✅ Minimum ₪200 par retrait
- ✅ Voir l'historique de ses retraits
- ✅ Suivre le statut des retraits

#### **🎫 Tickets (`/tickets`)**
- ✅ Voir tous ses tickets achetés
- ✅ Filtrer par statut (actifs/terminés/gagnants)
- ✅ Voir les numéros sélectionnés
- ✅ Voir les gains éventuels

### **Restrictions de Données :**
- ✅ Accès uniquement à ses propres données
- ❌ Ne peut pas voir les données d'autres utilisateurs
- ❌ Ne peut pas voir les statistiques globales

---

## 🛡️ RÔLE ADMIN

### **Pages Accessibles :**
- ✅ Toutes les pages CLIENT +
- ✅ `/admin` - Dashboard administrateur
- ✅ `/admin/users` - Gestion des utilisateurs
- ✅ `/admin/deposits` - Gestion des dépôts
- ✅ `/admin/withdrawals` - Gestion des retraits
- ✅ `/admin/draws` - Gestion des tirages
- ✅ `/admin/system` - État du système

### **Fonctionnalités Supplémentaires :**

#### **📊 Dashboard Admin (`/admin`)**
- ✅ Statistiques globales du système
- ✅ Nombre total d'utilisateurs
- ✅ Dépôts/retraits en attente
- ✅ Balance totale du système
- ✅ Tickets vendus aujourd'hui
- ✅ Tirages actifs
- ✅ Transactions récentes
- ✅ Actions rapides d'approbation

#### **👥 Gestion Utilisateurs (`/admin/users`)**
- ✅ Voir tous les utilisateurs
- ✅ Rechercher par nom/email
- ✅ Voir détails complets des utilisateurs
- ✅ Ajuster les balances (ajouter/retirer)
- ✅ Suspendre/activer des comptes
- ✅ Débloquer les comptes verrouillés
- ✅ Réinitialiser les mots de passe
- ✅ Supprimer des utilisateurs (clients seulement)
- ❌ Ne peut pas changer les rôles
- ❌ Ne peut pas supprimer d'autres admins

#### **💰 Gestion Dépôts (`/admin/deposits`)**
- ✅ Voir tous les dépôts
- ✅ Filtrer par statut (pending/confirmed/rejected)
- ✅ Approuver les dépôts
- ✅ Rejeter les dépôts avec raison
- ✅ Ajouter des notes
- ✅ Voir les détails des transactions crypto

#### **💸 Gestion Retraits (`/admin/withdrawals`)**
- ✅ Voir tous les retraits
- ✅ Filtrer par statut
- ✅ Approuver les retraits
- ✅ Rejeter les retraits avec raison
- ✅ Ajouter hash de transaction
- ✅ Gérer les adresses de destination

#### **🎲 Gestion Tirages (`/admin/draws`)**
- ✅ Créer de nouveaux tirages
- ✅ Définir date/heure des tirages
- ✅ Définir le montant du jackpot
- ✅ Exécuter les tirages
- ✅ Sélectionner les numéros gagnants
- ✅ Calculer automatiquement les gains
- ✅ Distribuer les prix aux gagnants

#### **🔧 État Système (`/admin/system`)**
- ✅ Vérification de santé du système
- ✅ Métriques de performance
- ✅ État de la base de données
- ✅ Connexions API externes
- ✅ Logs d'audit

### **Restrictions Admin :**
- ❌ Ne peut pas promouvoir d'autres utilisateurs admin
- ❌ Ne peut pas supprimer des comptes admin/root
- ❌ Ne peut pas modifier les paramètres système critiques

---

## 👑 RÔLE ROOT

### **Pages Accessibles :**
- ✅ Toutes les pages ADMIN +
- ✅ Accès complet à toutes les fonctionnalités

### **Privilèges Supplémentaires :**

#### **👥 Gestion Utilisateurs Avancée**
- ✅ Changer les rôles (client ↔ admin)
- ✅ Supprimer des comptes admin
- ✅ Créer des comptes admin
- ✅ Accès à tous les logs d'audit
- ✅ Réinitialiser les permissions

#### **🔧 Administration Système**
- ✅ Modifier les paramètres système
- ✅ Gérer les portefeuilles crypto
- ✅ Configurer les taux de change
- ✅ Accès aux logs serveur
- ✅ Maintenance de la base de données

#### **💼 Gestion Financière**
- ✅ Voir toutes les transactions
- ✅ Générer des rapports financiers
- ✅ Ajuster les frais système
- ✅ Gérer les réserves crypto

### **Aucune Restriction :**
- ✅ Accès complet à toutes les fonctionnalités
- ✅ Peut modifier tous les paramètres
- ✅ Peut gérer tous les utilisateurs

---

## 🔒 SÉCURITÉ ET CONTRÔLES

### **Authentification :**
- ✅ Mot de passe bcrypt (12 rounds)
- ✅ Verrouillage après échecs de connexion
- ✅ Validation de force du mot de passe
- ✅ Sessions sécurisées avec JWT

### **Contrôle d'Accès :**
- ✅ Row Level Security (RLS) sur toutes les tables
- ✅ Vérification des rôles côté serveur
- ✅ Protection des routes côté client
- ✅ Validation des permissions sur chaque action

### **Audit et Logs :**
- ✅ Toutes les actions admin sont loggées
- ✅ Historique des modifications
- ✅ Traçabilité complète
- ✅ Alertes de sécurité

---

## 📱 INTERFACE UTILISATEUR PAR RÔLE

### **Navigation CLIENT :**
```
Header: [Profil] [Tickets] [Déconnexion]
Sidebar: Accueil | Dépôt | Retrait | Tickets | Profil
```

### **Navigation ADMIN :**
```
Header: [Profil] [Tickets] [Panel Admin] [Déconnexion]
Admin Menu: Dashboard | Utilisateurs | Dépôts | Retraits | Tirages | Système
```

### **Navigation ROOT :**
```
Header: [Profil] [Tickets] [Panel Admin] [Déconnexion]
Admin Menu: Dashboard | Utilisateurs | Dépôts | Retraits | Tirages | Système
+ Fonctionnalités avancées dans chaque section
```

---

## 🎯 RÉSUMÉ DES PERMISSIONS

| Fonctionnalité | CLIENT | ADMIN | ROOT |
|----------------|--------|-------|------|
| Acheter tickets | ✅ | ✅ | ✅ |
| Dépôts/Retraits | ✅ | ✅ | ✅ |
| Voir ses données | ✅ | ✅ | ✅ |
| Voir toutes les données | ❌ | ✅ | ✅ |
| Gérer utilisateurs | ❌ | ✅ | ✅ |
| Approuver transactions | ❌ | ✅ | ✅ |
| Créer tirages | ❌ | ✅ | ✅ |
| Changer rôles | ❌ | ❌ | ✅ |
| Config système | ❌ | ❌ | ✅ |

---

**🔐 Système de rôles 100% fonctionnel et sécurisé !**