#!/bin/bash

RESULTS_FILE="genesis_migration_results.log"
echo "Genesis Node Migration Report" > $RESULTS_FILE
echo "=============================" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# Using globstar if available in the bash version
shopt -s globstar
for DB_FILE in **/*.db; do
    # Skip files in node_modules
    if [[ "$DB_FILE" == *"node_modules"* ]]; then
        continue
    fi

    echo "Processing: $DB_FILE"
    
    # Check if the file is a valid sqlite3 database, and capture any error
    ERROR_OUTPUT=$(sqlite3 "$DB_FILE" ".tables" 2>&1)
    if [ $? -eq 0 ]; then
        # The file is a valid sqlite3 database, try to insert the genesis node
        SQL_COMMAND="INSERT INTO nodes (body) SELECT json_object('id', '0', 'label', 'System', 'body', 'This is the genesis node, the root of the graph.', 'createdAt', strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) WHERE NOT EXISTS (SELECT 1 FROM nodes WHERE id = '0');"
        
        if sqlite3 "$DB_FILE" "$SQL_COMMAND" 2>/dev/null; then
            echo "  - SUCCESS: Genesis node added (or already exists)."
            echo "$DB_FILE: SUCCESS" >> $RESULTS_FILE
        else
            echo "  - ERROR: Failed to execute INSERT command. The table 'nodes' might be missing or the schema is incompatible."
            echo "$DB_FILE: ERROR (INSERT failed)" >> $RESULTS_FILE
        fi
    else
        echo "  - SKIPPED: Not a valid SQLite3 database file or permission error."
        echo "    Error: $ERROR_OUTPUT"
        echo "$DB_FILE: SKIPPED (Error: $ERROR_OUTPUT)" >> $RESULTS_FILE
    fi
done

echo ""
echo "Migration process complete. Results logged to $RESULTS_FILE"
echo ""
cat $RESULTS_FILE