// Script pour corriger le validateur MongoDB existant
// Exécuter avec: docker exec -it valthera-mongo mongosh valthera --file /docker-entrypoint-initdb.d/fix-validator.js

db.runCommand({
  collMod: 'characters',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'name', 'race', 'class'],
      properties: {
        userId: { bsonType: 'string' },
        guildId: { bsonType: ['string', 'null'] },
        name: { bsonType: 'string', minLength: 2, maxLength: 32 },
        level: { bsonType: 'int', minimum: 1, maximum: 20 }
      }
    }
  },
  validationLevel: 'moderate'
});

// Supprimer l'ancien index composite et créer le nouveau
try {
  db.characters.dropIndex({ userId: 1, guildId: 1 });
  print('✅ Ancien index userId+guildId supprimé');
} catch (e) {
  print('ℹ️ Index userId+guildId non trouvé (déjà supprimé ou inexistant)');
}

// Créer le nouvel index unique sur userId seul
try {
  db.characters.createIndex({ userId: 1 }, { unique: true });
  print('✅ Nouvel index unique sur userId créé');
} catch (e) {
  print('ℹ️ Index userId existe déjà: ' + e.message);
}

print('✅ Validateur MongoDB mis à jour - guildId est maintenant optionnel');
