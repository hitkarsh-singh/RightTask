# Neo4j Setup Guide

This guide will help you set up Neo4j Aura for the RightTask graph database features.

## What is Neo4j?

Neo4j is a graph database that stores data as nodes and relationships. RightTask uses it to:
- Track task dependencies (DEPENDS_ON relationships)
- Detect circular dependencies
- Visualize tasks as a connected graph
- Enable future features like critical path analysis

## Neo4j Aura Free Tier

Neo4j Aura offers a free tier perfect for development and small projects:
- **Storage:** 200,000 nodes & relationships
- **RAM:** Shared
- **Backup:** Automatic daily backups
- **Cost:** Free forever

## Setup Instructions

### 1. Create a Neo4j Aura Account

1. Go to [https://console.neo4j.io/](https://console.neo4j.io/)
2. Click "Start Free" or "Sign Up"
3. Create an account using:
   - Email and password, OR
   - Google/GitHub/LinkedIn account

### 2. Create a New Database Instance

1. Once logged in, click "New Instance"
2. Select **"AuraDB Free"**
3. Choose a name for your database (e.g., "righttask-dev")
4. Select your preferred region (choose closest to your location)
5. Click "Create Instance"

### 3. Save Your Credentials

**IMPORTANT:** After creation, a dialog will appear with your credentials. This is the ONLY time you'll see the password!

Copy and save:
- **Connection URI:** `neo4j+s://xxxxx.databases.neo4j.io`
- **Username:** `neo4j`
- **Password:** `<your-generated-password>`

Download the `.txt` file with these credentials for safekeeping.

### 4. Configure Backend Environment

Add these variables to your `backend/.env` file:

```env
# Neo4j Database Configuration
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-generated-password
```

Replace the placeholders with your actual credentials from step 3.

### 5. Verify Connection

Start your backend server:

```bash
cd backend
npm run start:dev
```

Look for this log message:
```
✓ Connected to Neo4j
Neo4j schema initialized
```

If you see these messages, you're all set! If not, check:
- Credentials are correct in `.env`
- No typos in the connection URI
- Your IP is not blocked (Aura Free allows all IPs by default)

## Using Neo4j Browser

Neo4j Aura includes a web-based query interface called **Neo4j Browser**.

### Access Neo4j Browser

1. Go to [https://console.neo4j.io/](https://console.neo4j.io/)
2. Click on your database instance
3. Click "Open" or "Query" button
4. Enter your username (`neo4j`) and password

### Useful Cypher Queries

**View all tasks:**
```cypher
MATCH (t:Task)
RETURN t
LIMIT 25
```

**View all users and their tasks:**
```cypher
MATCH (u:User)-[:OWNS]->(t:Task)
RETURN u, t
LIMIT 25
```

**View task dependencies:**
```cypher
MATCH (t1:Task)-[r:DEPENDS_ON]->(t2:Task)
RETURN t1, r, t2
```

**Find tasks with no dependencies (leaf nodes):**
```cypher
MATCH (t:Task)
WHERE NOT (t)-[:DEPENDS_ON]->()
RETURN t
```

**Find circular dependencies (should return 0):**
```cypher
MATCH path = (t:Task)-[:DEPENDS_ON*]->(t)
RETURN path
```

**Delete all data (use with caution!):**
```cypher
MATCH (n)
DETACH DELETE n
```

## Troubleshooting

### "Neo4j driver not initialized" warnings

This is normal if you haven't set up Neo4j yet. The app will still work, but graph features will be disabled. To enable them, follow the setup instructions above.

### Connection timeout errors

- **Check your internet connection**
- **Verify the URI** - should start with `neo4j+s://` (with the 's' for SSL)
- **Check Aura console** - instance might be paused (free tier pauses after inactivity)
- **Whitelist your IP** (if you restricted it in Aura settings)

### Wrong credentials

If you lost your password:
1. Go to [https://console.neo4j.io/](https://console.neo4j.io/)
2. Click on your database
3. Go to "Settings" → "Reset Password"
4. Update your `.env` file with the new password

### Database is paused

Free tier databases pause after 3 days of inactivity:
1. Go to Aura console
2. Click "Resume" on your database
3. Wait 1-2 minutes for it to start
4. Restart your backend server

## Production Deployment

For production (Railway, etc.):

1. **Add environment variables** to your hosting platform:
   ```
   NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
   NEO4J_USERNAME=neo4j
   NEO4J_PASSWORD=your-password
   ```

2. **Consider upgrading** to AuraDB Professional if you need:
   - More storage (beyond 200k nodes)
   - Dedicated resources
   - Better performance
   - SLA guarantees

3. **Monitor usage** in Aura console:
   - Storage usage
   - Query performance
   - Connection metrics

## Optional: Local Neo4j (Advanced)

For local development without internet, you can run Neo4j locally:

**Using Docker:**
```bash
docker run \
  --name neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password \
  neo4j:latest
```

Then use:
```env
NEO4J_URI=neo4j://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
```

## Next Steps

Once Neo4j is set up:
1. Create some tasks in RightTask
2. Add dependencies between tasks
3. Watch the graph visualization update in real-time!
4. Try adding a circular dependency (it should be prevented)

## Support

- **Neo4j Documentation:** [https://neo4j.com/docs/](https://neo4j.com/docs/)
- **Aura Support:** [https://neo4j.com/cloud/aura-free/](https://neo4j.com/cloud/aura-free/)
- **RightTask Issues:** [Create an issue on GitHub]

---

**Note:** Neo4j is optional for basic task management. The app works without it, but graph visualization features will be disabled.
