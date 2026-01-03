// Script d'initialisation MongoDB
db = db.getSiblingDB('valthera');

// Création des collections avec validation
db.createCollection('characters', {
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
  }
});

db.createCollection('combats');
db.createCollection('monsters');
db.createCollection('items');
db.createCollection('quests');
db.createCollection('zones');

// Index pour les recherches fréquentes - userId unique (personnage partagé entre serveurs)
db.characters.createIndex({ userId: 1 }, { unique: true });
db.characters.createIndex({ level: -1 });
db.characters.createIndex({ 'stats.monstersKilled': -1 });

db.combats.createIndex({ guildId: 1, status: 1 });
db.combats.createIndex({ channelId: 1 });
db.combats.createIndex({ 'players.discordId': 1 });

db.monsters.createIndex({ id: 1 }, { unique: true });
db.monsters.createIndex({ cr: 1 });
db.monsters.createIndex({ zones: 1 });

db.items.createIndex({ id: 1 }, { unique: true });
db.items.createIndex({ type: 1 });
db.items.createIndex({ rarity: 1 });

db.quests.createIndex({ id: 1 }, { unique: true });
db.quests.createIndex({ type: 1 });
db.quests.createIndex({ zones: 1 });

db.zones.createIndex({ id: 1 }, { unique: true });
db.zones.createIndex({ type: 1 });

print('✅ Base de données Valthera initialisée!');
