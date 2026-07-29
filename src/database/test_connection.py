import asyncio
from sqlalchemy import text
from src.database.connection import engine
async def test_db_connection():
    print("Testing connection to PostgreSQL...")
    try:
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT 1;"))
            row = result.fetchone()
            
            if row and row[0] == 1:
                print("✅ Connection Successful! The database is up and running.")
            else:
                print("⚠️ Connected, but received an unexpected result.")
                
    except Exception as e:
        print("❌ Connection Failed!")
        print(f"Error details: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_db_connection())