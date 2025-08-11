import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createDatabase, cleanupDatabase, type Database } from './helpers/database'

// Import our SQL generation functions
import { createSchema } from '../ts/schema'
import { insertNodeFromObject, getInsertNodeParams } from '../ts/insert-node'
import { insertEdgeFromObject, getInsertEdgeParams } from '../ts/insert-edge'
import { updateNodeFromObject, getUpdateNodeParams } from '../ts/update-node'
import { traverseAll } from '../ts/traverse'
import type { Node, Edge } from '../ts/types'

const DB_FILE = 'test-graph-inspection.db'

describe('File Database Tests (for DB Manager Inspection)', () => {
  let db: Database

  beforeAll(async () => {
    // Clean up any existing file
    await cleanupDatabase(DB_FILE)

    // Create file database (no cleanup so we can inspect it)
    db = createDatabase({
      type: 'file',
      filename: DB_FILE,
      cleanup: false // Keep the file for inspection
    })

    // Create the schema
    await db.exec(createSchema())
  })

  afterAll(async () => {
    await db.close()
    console.log(`\n📁 Database file created: ${DB_FILE}`)
    console.log('You can now open this file with a DB manager to inspect the data!')
  })

  it('should create a comprehensive test dataset', async () => {
    // Create a realistic social network graph
    const users: Node[] = [
      { 
        id: 'alice', 
        name: 'Alice Johnson', 
        email: 'alice@example.com',
        profile: {
          age: 28,
          location: 'New York',
          interests: ['technology', 'reading', 'hiking'],
          joinDate: '2023-01-15'
        }
      },
      { 
        id: 'bob', 
        name: 'Bob Smith', 
        email: 'bob@example.com',
        profile: {
          age: 32,
          location: 'San Francisco',
          interests: ['programming', 'gaming', 'music'],
          joinDate: '2023-02-20'
        }
      },
      { 
        id: 'charlie', 
        name: 'Charlie Brown', 
        email: 'charlie@example.com',
        profile: {
          age: 25,
          location: 'Austin',
          interests: ['art', 'photography', 'travel'],
          joinDate: '2023-03-10'
        }
      },
      { 
        id: 'diana', 
        name: 'Diana Prince', 
        email: 'diana@example.com',
        profile: {
          age: 30,
          location: 'Seattle',
          interests: ['science', 'research', 'running'],
          joinDate: '2023-01-05'
        }
      },
      { 
        id: 'eve', 
        name: 'Eve Wilson', 
        email: 'eve@example.com',
        profile: {
          age: 27,
          location: 'Chicago',
          interests: ['cooking', 'yoga', 'books'],
          joinDate: '2023-04-12'
        }
      }
    ]

    const relationships: Edge[] = [
      { 
        source: 'alice', 
        target: 'bob', 
        properties: { 
          type: 'friendship', 
          strength: 0.8, 
          since: '2023-02-01',
          interactions: 45,
          commonInterests: ['technology']
        } 
      },
      { 
        source: 'alice', 
        target: 'diana', 
        properties: { 
          type: 'friendship', 
          strength: 0.9, 
          since: '2023-01-20',
          interactions: 67,
          commonInterests: ['reading', 'hiking']
        } 
      },
      { 
        source: 'bob', 
        target: 'charlie', 
        properties: { 
          type: 'collaboration', 
          strength: 0.7, 
          since: '2023-03-15',
          project: 'web-app-development',
          interactions: 23
        } 
      },
      { 
        source: 'charlie', 
        target: 'eve', 
        properties: { 
          type: 'friendship', 
          strength: 0.6, 
          since: '2023-04-20',
          interactions: 12,
          commonInterests: ['art', 'travel']
        } 
      },
      { 
        source: 'diana', 
        target: 'eve', 
        properties: { 
          type: 'mentorship', 
          strength: 0.85, 
          since: '2023-04-15',
          role: 'diana-mentor',
          interactions: 34
        } 
      },
      { 
        source: 'alice', 
        target: 'charlie', 
        properties: { 
          type: 'acquaintance', 
          strength: 0.4, 
          since: '2023-05-01',
          interactions: 8,
          mutualFriend: 'bob'
        } 
      }
    ]

    // Clear existing data first
    await db.run('DELETE FROM edges')
    await db.run('DELETE FROM nodes')

    // Insert all users
    for (const user of users) {
      await db.run(insertNodeFromObject(user), getInsertNodeParams(user))
    }

    // Insert all relationships
    for (const relationship of relationships) {
      await db.run(insertEdgeFromObject(relationship), getInsertEdgeParams(relationship))
    }

    // Verify data was inserted
    const nodeCount = await db.get('SELECT COUNT(*) as count FROM nodes')
    const edgeCount = await db.get('SELECT COUNT(*) as count FROM edges')
    
    expect(nodeCount.count).toBe(5)
    expect(edgeCount.count).toBe(6)

    console.log(`\n✅ Inserted ${nodeCount.count} nodes and ${edgeCount.count} edges`)
  })

  it('should demonstrate node updates', async () => {
    // Update Alice's profile
    const updatedAlice: Node = {
      id: 'alice',
      name: 'Alice Johnson',
      email: 'alice.johnson@newcompany.com', // Changed email
      profile: {
        age: 29, // Birthday!
        location: 'New York',
        interests: ['technology', 'reading', 'hiking', 'machine-learning'], // Added new interest
        joinDate: '2023-01-15',
        lastActive: '2023-12-01',
        premium: true // New field
      }
    }

    await db.run(updateNodeFromObject(updatedAlice), getUpdateNodeParams(updatedAlice))

    // Verify the update
    const retrievedAlice = await db.get('SELECT * FROM nodes WHERE id = ?', ['alice'])
    const parsedAlice = JSON.parse(retrievedAlice.body)
    
    expect(parsedAlice.profile.age).toBe(29)
    expect(parsedAlice.email).toBe('alice.johnson@newcompany.com')
    expect(parsedAlice.profile.premium).toBe(true)
    expect(parsedAlice.profile.interests).toContain('machine-learning')

    console.log('✅ Updated Alice\'s profile with new data')
  })

  it('should demonstrate graph traversal queries', async () => {
    // Test traversal from Alice
    const traversalSql = traverseAll(true)
    const results = await db.all(traversalSql, ['alice'])
    
    // Should find all connected nodes (in this case, all nodes since the graph is connected)
    const nodeResults = results.filter(r => r.y === '()')
    const edgeResults = results.filter(r => r.y === '<-' || r.y === '->')
    
    expect(nodeResults.length).toBeGreaterThan(0)
    expect(edgeResults.length).toBeGreaterThan(0)

    console.log(`✅ Traversal from Alice found ${nodeResults.length} nodes and ${edgeResults.length} edges`)
    
    // Log some sample data for inspection
    console.log('\n📊 Sample traversal results:')
    console.log('Nodes found:', nodeResults.slice(0, 3).map(r => {
      const data = JSON.parse(r.obj)
      return `${data.id} (${data.name})`
    }))
    console.log('Edges found:', edgeResults.slice(0, 3).map(r => {
      const data = JSON.parse(r.obj)
      return `${data.type} (strength: ${data.strength})`
    }))
  })

  it('should create additional test data for complex queries', async () => {
    // Add some organizations
    const organizations: Node[] = [
      {
        id: 'tech-corp',
        name: 'TechCorp Inc.',
        type: 'organization',
        details: {
          industry: 'technology',
          size: 'large',
          founded: 2010,
          headquarters: 'San Francisco'
        }
      },
      {
        id: 'design-studio',
        name: 'Creative Design Studio',
        type: 'organization',
        details: {
          industry: 'design',
          size: 'small',
          founded: 2018,
          headquarters: 'Austin'
        }
      }
    ]

    // Add employment relationships
    const employments: Edge[] = [
      {
        source: 'alice',
        target: 'tech-corp',
        properties: {
          type: 'employment',
          role: 'Senior Developer',
          startDate: '2023-01-01',
          salary: 120000,
          department: 'Engineering'
        }
      },
      {
        source: 'bob',
        target: 'tech-corp',
        properties: {
          type: 'employment',
          role: 'Lead Engineer',
          startDate: '2022-06-15',
          salary: 140000,
          department: 'Engineering'
        }
      },
      {
        source: 'charlie',
        target: 'design-studio',
        properties: {
          type: 'employment',
          role: 'Creative Director',
          startDate: '2023-03-01',
          salary: 95000,
          department: 'Creative'
        }
      }
    ]

    // Insert organizations
    for (const org of organizations) {
      await db.run(insertNodeFromObject(org), getInsertNodeParams(org))
    }

    // Insert employment relationships
    for (const employment of employments) {
      await db.run(insertEdgeFromObject(employment), getInsertEdgeParams(employment))
    }

    // Verify final counts
    const finalNodeCount = await db.get('SELECT COUNT(*) as count FROM nodes')
    const finalEdgeCount = await db.get('SELECT COUNT(*) as count FROM edges')
    
    console.log(`\n✅ Final database contains ${finalNodeCount.count} nodes and ${finalEdgeCount.count} edges`)
    
    // Show some statistics
    const nodeTypes = await db.all(`
      SELECT 
        COALESCE(json_extract(body, '$.type'), 'user') as node_type,
        COUNT(*) as count
      FROM nodes 
      GROUP BY node_type
    `)
    
    const edgeTypes = await db.all(`
      SELECT 
        json_extract(properties, '$.type') as edge_type,
        COUNT(*) as count
      FROM edges 
      GROUP BY edge_type
    `)

    console.log('\n📈 Node types:', nodeTypes)
    console.log('📈 Edge types:', edgeTypes)

    expect(finalNodeCount.count).toBe(7) // 5 users + 2 organizations
    expect(finalEdgeCount.count).toBe(9) // 6 relationships + 3 employments
  })
})
