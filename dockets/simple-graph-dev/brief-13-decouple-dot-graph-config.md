# **Brief: Decouple DOT Graph Configuration**

## **1\. Objective**

Refactor the DotGraphGenerator to decouple its default configuration from the core class logic, making it a more generic and reusable visualization tool.

## **2\. Memory Shard (MSM)**

* **Context**: We have identified that the DotGraphGenerator is not generic. Its default settings for node types, colors, and shapes are hard-coded to our specific "Persona Engineering" use case.  
* **Reasoning**: To make simple-graph a truly general-purpose library, its features must be agnostic to the data they are operating on. A user with a different graph schema (e.g., the e-commerce example) should be able to use the DotGraphGenerator without being confused by irrelevant defaults.  
* **Decision**: We will move the CDA-specific configuration out of the core library and into the test suite, where it is used. The DotGraphGenerator itself will be updated to have a more generic, minimal default configuration.

## **3\. Technical Implementation Plan**

1. **Create New Config File**: In the tests/configs/ directory, create a new file named cda-visualization.config.ts.  
2. **Move CDA-Specific Config**: Cut the DEFAULT\_DOT\_CONFIG object from src/visualization/dot-generator.ts and paste it into the new cda-visualization.config.ts file. Export it as CDA\_DOT\_CONFIG.  
3. **Create Generic Default Config**: In src/visualization/dot-generator.ts, create a new, minimal DEFAULT\_DOT\_CONFIG object. It should contain only generic settings (e.g., layout: 'dot', rankdir: 'TB') and have empty arrays/objects for type-specific settings like includeNodeTypes and nodeColors.  
4. **Update Test Suite**: Modify the visualization tests in tests/integration/dot-graph-visualization.test.ts to import CDA\_DOT\_CONFIG and pass it as an argument to the generateDot method. This ensures the tests continue to function as before.

## **4\. Verification**

* The agent **must** run bun tsc \--noEmit to confirm there are no type errors.  
* The agent **must** run bun test to confirm that all tests, especially the updated visualization tests, pass successfully.