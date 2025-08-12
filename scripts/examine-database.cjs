#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose()

/**
 * Examine database structure and content
 */
async function examineDatabase() {
  const dbPath = process.argv[2] || 'cda-import-test.db'
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(new Error(`Failed to connect to database: ${err.message}`))
        return
      }
      
      console.log('📊 Connected to database:', dbPath)
      
      // Get table info
      db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
        if (err) {
          reject(err)
          return
        }
        
        console.log('\n📋 Tables found:', tables.map(t => t.name))
        
        if (tables.length === 0) {
          console.log('❌ No tables found in database')
          db.close()
          resolve()
          return
        }
        
        // Check nodes table
        if (tables.some(t => t.name === 'nodes')) {
          db.all("SELECT json_extract(body, '$.id') as id, json_extract(body, '$.node_type') as node_type, json_extract(body, '$.category') as category FROM nodes LIMIT 10", [], (err, rows) => {
            if (err) {
              console.log('❌ Error querying nodes:', err.message)
            } else {
              console.log('\n📄 Sample nodes:')
              rows.forEach((row, i) => {
                console.log(`   ${i+1}. ID: ${row.id}, Type: ${row.node_type}, Category: ${row.category}`)
              })
            }
            
            // Check edges table
            if (tables.some(t => t.name === 'edges')) {
              db.all("SELECT source, target, json_extract(properties, '$.type') as edge_type FROM edges LIMIT 10", [], (err, edges) => {
                if (err) {
                  console.log('❌ Error querying edges:', err.message)
                } else {
                  console.log('\n🔗 Sample edges:')
                  edges.forEach((edge, i) => {
                    console.log(`   ${i+1}. ${edge.source} → ${edge.target} (${edge.edge_type})`)
                  })
                }

                // Check for dangling edges
                db.all(`
                  SELECT DISTINCT e.source as missing_node, 'source' as type
                  FROM edges e
                  LEFT JOIN nodes n ON json_extract(n.body, '$.id') = e.source
                  WHERE n.id IS NULL
                  UNION
                  SELECT DISTINCT e.target as missing_node, 'target' as type
                  FROM edges e
                  LEFT JOIN nodes n ON json_extract(n.body, '$.id') = e.target
                  WHERE n.id IS NULL
                `, [], (err, danglingNodes) => {
                  if (err) {
                    console.log('❌ Error checking dangling edges:', err.message)
                  } else if (danglingNodes.length > 0) {
                    console.log('\n⚠️  Dangling edge references:')
                    danglingNodes.forEach(node => {
                      console.log(`   Missing ${node.type}: ${node.missing_node}`)
                    })
                  } else {
                    console.log('\n✅ No dangling edges found')
                  }

                  db.close()
                  resolve()
                })
              })
            } else {
              db.close()
              resolve()
            }
          })
        } else {
          console.log('❌ No nodes table found')
          db.close()
          resolve()
        }
      })
    })
  })
}

// Run the examination
examineDatabase().catch(console.error)
