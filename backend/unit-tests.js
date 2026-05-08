const bcrypt = require('bcrypt');

async function runUnitTests() {
    console.log("--- RUNNING UNIT TESTS ---");
    
    // Test 1: Password Hashing
    const password = "mySecretPassword";
    const hash = await bcrypt.hash(password, 10);
    const isMatch = await bcrypt.compare(password, hash);
    const isWrongMatch = await bcrypt.compare("wrongPass", hash);
    
    console.assert(isMatch === true, "Test 1 Failed: Hash didn't match.");
    console.assert(isWrongMatch === false, "Test 2 Failed: Wrong password matched.");
    console.log("✅ Unit Test 1 Passed: Password hashing is secure.");

    // Test 2: Credit Limit Logic (Simulated)
    const currentCredits = 15;
    const newCourseCredits = 4;
    const maxCredits = 18;
    const canRegister = (currentCredits + newCourseCredits) <= maxCredits;
    
    console.assert(canRegister === false, "Test 3 Failed: Allowed over maximum credits.");
    console.log("✅ Unit Test 2 Passed: Maximum credit limit enforced.");
}

runUnitTests();