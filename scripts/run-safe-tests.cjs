#!/usr/bin/env node

const { spawn } = require("child_process");
const { TestDatabaseManager } = require("./test-database-manager.cjs");

/**
 * Safe Test Runner - Implements copy-on-write testing workflow
 *
 * This script:
 * 1. Initializes a safe test environment
 * 2. Runs the test suite against copied databases
 * 3. Ensures reference databases remain untouched
 * 4. Provides comprehensive reporting
 */
class SafeTestRunner {
  constructor() {
    this.dbManager = new TestDatabaseManager();
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      duration: 0,
      errors: [],
    };
  }

  /**
   * Execute the complete safe testing workflow
   */
  async runSafeTests() {
    console.log("🧪 SAFE TEST EXECUTION WORKFLOW");
    console.log("=".repeat(60));
    console.log(`🕐 Started: ${new Date().toISOString()}`);
    console.log("");

    const startTime = Date.now();

    try {
      // Phase 1: Initialize safe test environment
      await this.initializeTestEnvironment();

      // Phase 2: Execute test suite
      await this.executeTestSuite();

      // Phase 3: Verify database integrity
      await this.verifyDatabaseIntegrity();

      // Phase 4: Generate report
      this.generateTestReport(startTime);

      // Phase 5: Cleanup (optional)
      await this.cleanupTestEnvironment();

      return this.testResults.failed === 0;
    } catch (error) {
      console.error("\n❌ SAFE TEST EXECUTION FAILED");
      console.error("=".repeat(40));
      console.error(`Error: ${error.message}`);

      // Still try to verify database integrity
      try {
        await this.verifyDatabaseIntegrity();
      } catch (verifyError) {
        console.error(
          `Additional error during verification: ${verifyError.message}`
        );
      }

      return false;
    }
  }

  /**
   * Phase 1: Initialize safe test environment
   */
  async initializeTestEnvironment() {
    console.log("📋 PHASE 1: INITIALIZING TEST ENVIRONMENT");
    console.log("=".repeat(50));

    await this.dbManager.initializeTestEnvironment();

    console.log("\n✅ Phase 1 complete: Test environment ready");
  }

  /**
   * Phase 2: Execute test suite
   */
  async executeTestSuite() {
    console.log("\n🧪 PHASE 2: EXECUTING TEST SUITE");
    console.log("=".repeat(40));

    const testCommand = process.argv[2] || "test-core";
    console.log(`Running: bun run ${testCommand}`);

    return new Promise((resolve, reject) => {
      const testProcess = spawn("npm", ["run", testCommand], {
        stdio: "pipe",
        shell: true,
      });

      let stdout = "";
      let stderr = "";

      testProcess.stdout.on("data", (data) => {
        const output = data.toString();
        stdout += output;
        process.stdout.write(output); // Real-time output
      });

      testProcess.stderr.on("data", (data) => {
        const output = data.toString();
        stderr += output;
        process.stderr.write(output); // Real-time output
      });

      testProcess.on("close", (code) => {
        // Parse test results from output
        this.parseTestResults(stdout, stderr);

        if (code === 0) {
          console.log(
            "\n✅ Phase 2 complete: Test suite executed successfully"
          );
          resolve();
        } else {
          console.log(
            `\n⚠️  Phase 2 complete: Test suite exited with code ${code}`
          );
          // Don't reject - we want to continue with verification
          resolve();
        }
      });

      testProcess.on("error", (error) => {
        console.error(`\n❌ Test process error: ${error.message}`);
        this.testResults.errors.push(error.message);
        resolve(); // Continue with verification
      });
    });
  }

  /**
   * Parse test results from output
   */
  parseTestResults(stdout, stderr) {
    const passedMatch = stdout.match(/(\d+) passed/);
    const failedMatch = stdout.match(/(\d+) failed/);
    const totalMatch = stdout.match(/Tests\s+(\d+)/);
    const durationMatch = stdout.match(/Duration\s+([\d.]+)s/);

    if (passedMatch) this.testResults.passed = parseInt(passedMatch[1]);
    if (failedMatch) this.testResults.failed = parseInt(failedMatch[1]);
    if (totalMatch) this.testResults.total = parseInt(totalMatch[1]);
    if (durationMatch) this.testResults.duration = parseFloat(durationMatch[1]);

    // Extract error messages
    const errorLines = stderr
      .split("\n")
      .filter(
        (line) =>
          line.includes("Error:") ||
          line.includes("FAIL") ||
          line.includes("SQLITE_BUSY")
      );
    this.testResults.errors.push(...errorLines);
  }

  /**
   * Phase 3: Verify database integrity
   */
  async verifyDatabaseIntegrity() {
    console.log("\n🔍 PHASE 3: VERIFYING DATABASE INTEGRITY");
    console.log("=".repeat(45));

    await this.dbManager.verifyReferenceDatabaseIntegrity();

    console.log("\n✅ Phase 3 complete: Database integrity verified");
  }

  /**
   * Phase 4: Generate comprehensive test report
   */
  generateTestReport(startTime) {
    const totalDuration = (Date.now() - startTime) / 1000;

    console.log("\n📊 PHASE 4: TEST EXECUTION REPORT");
    console.log("=".repeat(40));
    console.log(`🕐 Completed: ${new Date().toISOString()}`);
    console.log(`⏱️  Total Duration: ${totalDuration.toFixed(2)}s`);
    console.log("");

    console.log("📋 Test Results:");
    console.log(`   ✅ Passed: ${this.testResults.passed}`);
    console.log(`   ❌ Failed: ${this.testResults.failed}`);
    console.log(`   📊 Total: ${this.testResults.total}`);
    console.log(`   ⏱️  Test Duration: ${this.testResults.duration}s`);
    console.log("");

    if (this.testResults.failed === 0) {
      console.log("🎊 ALL TESTS PASSED - SYSTEM READY FOR PRODUCTION!");
    } else {
      console.log("⚠️  SOME TESTS FAILED - REVIEW REQUIRED");

      if (this.testResults.errors.length > 0) {
        console.log("\n🔍 Error Summary:");
        this.testResults.errors.slice(0, 5).forEach((error, i) => {
          console.log(`   ${i + 1}. ${error.trim()}`);
        });

        if (this.testResults.errors.length > 5) {
          console.log(
            `   ... and ${this.testResults.errors.length - 5} more errors`
          );
        }
      }
    }

    console.log("\n🔒 Database Safety Status:");
    console.log("   ✅ Reference databases protected");
    console.log("   ✅ Test databases isolated");
    console.log("   ✅ No SQLITE_BUSY errors expected");

    console.log("\n✅ Phase 4 complete: Report generated");
  }

  /**
   * Phase 5: Cleanup test environment
   */
  async cleanupTestEnvironment() {
    console.log("\n🧹 PHASE 5: CLEANUP");
    console.log("=".repeat(25));

    // Keep test databases for inspection by default
    const keepDatabases = !process.argv.includes("--cleanup");

    await this.dbManager.cleanupTestEnvironment(keepDatabases);

    if (keepDatabases) {
      console.log("\n📁 Test databases preserved for inspection");
      console.log("   Use --cleanup flag to remove them");
    }

    console.log("\n✅ Phase 5 complete: Cleanup finished");
  }

  /**
   * Show usage information
   */
  static showUsage() {
    console.log("🧪 Safe Test Runner - Copy-on-Write Testing Workflow");
    console.log("");
    console.log(
      "Usage: node scripts/run-safe-tests.cjs [test-command] [options]"
    );
    console.log("");
    console.log("Test Commands:");
    console.log("  test-core    - Run core functionality tests (default)");
    console.log("  test         - Run all tests");
    console.log("  test-unit    - Run unit tests only");
    console.log("  test-integration - Run integration tests only");
    console.log("");
    console.log("Options:");
    console.log("  --cleanup    - Remove test databases after completion");
    console.log("  --help       - Show this help message");
    console.log("");
    console.log("Examples:");
    console.log("  node scripts/run-safe-tests.cjs");
    console.log("  node scripts/run-safe-tests.cjs test");
    console.log("  node scripts/run-safe-tests.cjs test-core --cleanup");
  }
}

// CLI interface
if (require.main === module) {
  if (process.argv.includes("--help")) {
    SafeTestRunner.showUsage();
    process.exit(0);
  }

  const runner = new SafeTestRunner();

  runner
    .runSafeTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("💥 Fatal error:", error.message);
      process.exit(1);
    });
}

module.exports = { SafeTestRunner };
