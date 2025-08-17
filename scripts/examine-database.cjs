#!/usr/bin/env node

async function main() {
    const { SimpleGraph } = await import('../src/SimpleGraph.js');

    async function examineDatabase() {
        const dbPath = process.argv[2] || 'cda-import-test.db';
        const graph = await SimpleGraph.connect({ path: dbPath });

        try {
            console.log(`📊 Connected to database: ${dbPath}`);

            const tables = await graph.query.raw("SELECT name FROM sqlite_master WHERE type='table'");
            console.log('\n📋 Tables found:', tables.map(t => t.name));

            if (tables.length === 0) {
                console.log('❌ No tables found in database');
                return;
            }

            if (tables.some(t => t.name === 'nodes')) {
                const nodes = await graph.query.raw("SELECT json_extract(body, '$.id') as id, json_extract(body, '$.node_type') as node_type, json_extract(body, '$.category') as category FROM nodes LIMIT 10");
                console.log('\n📄 Sample nodes:');
                nodes.forEach((row, i) => {
                    console.log(`   ${i + 1}. ID: ${row.id}, Type: ${row.node_type}, Category: ${row.category}`);
                });
            }

            if (tables.some(t => t.name === 'edges')) {
                const edges = await graph.query.raw("SELECT source, target, json_extract(properties, '$.type') as edge_type FROM edges LIMIT 10");
                console.log('\n🔗 Sample edges:');
                edges.forEach((edge, i) => {
                    console.log(`   ${i + 1}. ${edge.source} → ${edge.target} (${edge.edge_type})`);
                });

                const danglingNodes = await graph.query.raw(`
                    SELECT DISTINCT e.source as missing_node, 'source' as type
                    FROM edges e
                    LEFT JOIN nodes n ON json_extract(n.body, '$.id') = e.source
                    WHERE n.id IS NULL
                    UNION
                    SELECT DISTINCT e.target as missing_node, 'target' as type
                    FROM edges e
                    LEFT JOIN nodes n ON json_extract(n.body, '$.id') = e.target
                    WHERE n.id IS NULL
                `);

                if (danglingNodes.length > 0) {
                    console.log('\n⚠️  Dangling edge references:');
                    danglingNodes.forEach(node => {
                        console.log(`   Missing ${node.type}: ${node.missing_node}`);
                    });
                } else {
                    console.log('\n✅ No dangling edges found');
                }
            }

        } finally {
            await graph.close();
        }
    }

    examineDatabase().catch(console.error);
}

main();