#!/usr/bin/env node

/**
 * Quick test to validate the transaction management system
 */

import { createKnowledgeGraph } from './src/database/index.js'
import { batchInsertNodes, batchInsertEdges } from './src/database/operations.js'

async function testTransactionSystem() {
  console.log('🧪 Testing Transaction Management System...')
  
  try {
    // Create in-memory database for testing
    const kg = await createKnowledgeGraph(':memory:')
    
    // Test data
    const testNodes = [
      { id: 'node1', type: 'test', name: 'Test Node 1' },
      { id: 'node2', type: 'test', name: 'Test Node 2' },
      { id: 'node3', type: 'test', name: 'Test Node 3' }
    ]
    
    const testEdges = [
      { source: 'node1', target: 'node2', properties: { type: 'connects' } },
      { source: 'node2', target: 'node3', properties: { type: 'connects' } }
    ]
    
    console.log('✅ Database created successfully')
    
    // Test batch insert nodes with transaction
    console.log('🔄 Testing batch insert nodes with transactions...')
    const nodeResult = await kg.getConnection().then(conn => 
      require('./src/database/operations.ts').batchInsertNodes(conn, testNodes, {
        chunkSize: 2,
        useTransaction: true,
        continueOnError: false
      })
    )
    
    console.log('✅ Batch insert nodes completed:', {
      successful: nodeResult.successful,
      failed: nodeResult.failed,
      duration: nodeResult.duration + 'ms'
    })
    
    // Test batch insert edges with transaction
    console.log('🔄 Testing batch insert edges with transactions...')
    const edgeResult = await kg.getConnection().then(conn => 
      require('./src/database/operations.ts').batchInsertEdges(conn, testEdges, {
        chunkSize: 1,
        useTransaction: true,
        continueOnError: false
      })
    )
    
    console.log('✅ Batch insert edges completed:', {
      successful: edgeResult.successful,
      failed: edgeResult.failed,
      duration: edgeResult.duration + 'ms'
    })
    
    // Verify data was inserted
    const stats = await kg.getStats()
    console.log('📊 Final database stats:', stats)
    
    await kg.close()
    console.log('🎉 Transaction system test completed successfully!')
    
  } catch (error) {
    console.error('❌ Transaction system test failed:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

// Run the test
testTransactionSystem()

