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

// Supprimer les anciens index obsolètes
const oldIndexes = ['userId_1_guildId_1', 'odiscordUserId_1', 'discordUserId_1'];
for (const indexName of oldIndexes) {
  try {
    db.characters.dropIndex(indexName);
    print(`✅ Ancien index "${indexName}" supprimé`);
  } catch (e) {
    print(`ℹ️ Index "${indexName}" non trouvé (déjà supprimé ou inexistant)`);
  }
}

// Créer le nouvel index unique sur userId seul
try {
  db.characters.createIndex({ userId: 1 }, { unique: true });
  print('✅ Nouvel index unique sur userId créé');
} catch (e) {
  if (e.code === 85 || e.code === 86) {
    print('ℹ️ Index userId existe déjà');
  } else {
    print('⚠️ Erreur création index: ' + e.message);
  }
}

print('✅ Validateur MongoDB mis à jour - guildId est maintenant optionnel');
