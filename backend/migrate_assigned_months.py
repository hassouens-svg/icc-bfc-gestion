"""
Script de migration pour simplifier les mois assignés
Transforme "Janvier 2024", "Janvier 2025" etc. en simplement "Janvier"
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime

async def migrate_assigned_months():
    # Connexion MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client['shepherd_tracker']
    
    print("🔄 Début de la migration des mois assignés...")
    print(f"📅 Date: {datetime.now()}")
    
    # Récupérer tous les utilisateurs avec assigned_month
    users = await db.users.find({
        'assigned_month': {'$exists': True, '$ne': None}
    }).to_list(1000)
    
    print(f"\n📊 {len(users)} utilisateurs trouvés avec assigned_month")
    
    month_mapping = {
        'Janvier': ['Janvier 2024', 'Janvier 2025', 'Janvier 2023', '2024-01', '2025-01'],
        'Février': ['Février 2024', 'Février 2025', 'Février 2023', '2024-02', '2025-02'],
        'Mars': ['Mars 2024', 'Mars 2025', 'Mars 2023', '2024-03', '2025-03'],
        'Avril': ['Avril 2024', 'Avril 2025', 'Avril 2023', '2024-04', '2025-04'],
        'Mai': ['Mai 2024', 'Mai 2025', 'Mai 2023', '2024-05', '2025-05'],
        'Juin': ['Juin 2024', 'Juin 2025', 'Juin 2023', '2024-06', '2025-06'],
        'Juillet': ['Juillet 2024', 'Juillet 2025', 'Juillet 2023', '2024-07', '2025-07'],
        'Août': ['Août 2024', 'Août 2025', 'Août 2023', '2024-08', '2025-08'],
        'Septembre': ['Septembre 2024', 'Septembre 2025', 'Septembre 2023', '2024-09', '2025-09'],
        'Octobre': ['Octobre 2024', 'Octobre 2025', 'Octobre 2023', '2024-10', '2025-10'],
        'Novembre': ['Novembre 2024', 'Novembre 2025', 'Novembre 2023', '2024-11', '2025-11'],
        'Décembre': ['Décembre 2024', 'Décembre 2025', 'Décembre 2023', '2024-12', '2025-12'],
    }
    
    updated_count = 0
    errors = []
    
    for user in users:
        try:
            current_month = user.get('assigned_month')
            username = user.get('username', user.get('id', 'unknown'))
            role = user.get('role', 'unknown')
            
            # Si c'est déjà un simple mois, on skip
            if current_month in ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                                 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']:
                print(f"  ✓ {username} ({role}): déjà au bon format → {current_month}")
                continue
            
            # Si c'est un array, on prend le premier élément et on le convertit
            if isinstance(current_month, list):
                if not current_month:  # Array vide
                    print(f"  ⚠️  {username} ({role}): array vide, suppression")
                    await db.users.update_one(
                        {'_id': user['_id']},
                        {'$unset': {'assigned_month': ''}}
                    )
                    updated_count += 1
                    continue
                
                current_month = current_month[0]  # Prendre le premier
            
            # Trouver le mois simple correspondant
            new_month = None
            for simple_month, variants in month_mapping.items():
                if current_month in variants or simple_month in current_month:
                    new_month = simple_month
                    break
            
            if new_month:
                await db.users.update_one(
                    {'_id': user['_id']},
                    {'$set': {'assigned_month': new_month}}
                )
                print(f"  ✅ {username} ({role}): {current_month} → {new_month}")
                updated_count += 1
            else:
                error_msg = f"Impossible de mapper: {username} ({role}) - {current_month}"
                print(f"  ❌ {error_msg}")
                errors.append(error_msg)
                
        except Exception as e:
            error_msg = f"Erreur pour {user.get('username', 'unknown')}: {str(e)}"
            print(f"  ❌ {error_msg}")
            errors.append(error_msg)
    
    print(f"\n✅ Migration terminée!")
    print(f"   • {updated_count} utilisateurs mis à jour")
    print(f"   • {len(errors)} erreurs")
    
    if errors:
        print("\n❌ Erreurs rencontrées:")
        for error in errors:
            print(f"   - {error}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(migrate_assigned_months())
