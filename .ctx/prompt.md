- the following test errors and then a whole bunch of dependent tests fail

=== begins ===

tests\integration\cda-comprehensive-analysis.test.ts:
16 |     })
17 |     graph = await SimpleGraph.connect({ path: testDbFile })
18 |
19 |     // Import CDA data into the test database
20 |     const { importCda } = await import('../../src/parsers/cda-parser')
21 |     await importCda(graph, 'data/source/core-directive-array.md')
               ^
TypeError: importCda is not a function. (In 'importCda(graph, "data/source/core-directive-array.md")', 'importCda' is undefined)
      at <anonymous> (D:\dev\simple-graph\tests\integration\cda-comprehensive-analysis.test.ts:21:11)       
✗ Core Directive Array Comprehensive Analysis > 1. Directive Patterns and Relationships Analysis > should analyze directive patterns and relationship structures [204.00ms]

# Unhandled error between tests
-------------------------------
19 |   if (custom)
20 |     return validateFunction(custom, "custom"), def

=== ends ===
