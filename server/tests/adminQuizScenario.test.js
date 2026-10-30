const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('../server');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const QuizQuestion = require('../models/QuizQuestion');
const QuizAttempt = require('../models/QuizAttempt');
const AdminAuditLog = require('../models/AdminAuditLog');
const Scenario = require('../models/Scenario');

const PORT = 5997;
const BASE_URL = `http://localhost:${PORT}/api`;

let server;
let adminToken = '';
let userToken = '';
let adminUser = null;
let standardUser = null;

async function runQuizAndScenarioAdminTests() {
  console.log('====================================================');
  console.log('STARTING: ADMIN QUIZ & SCENARIO ENGINE VERIFICATION');
  console.log('====================================================\n');

  try {
    // 1. Boot Isolated Test Server
    await new Promise((resolve) => {
      server = app.listen(PORT, () => {
        console.log(`[Test Server] Running on port ${PORT}`);
        resolve();
      });
    });

    // 2. Setup Test Users
    console.log('- Setting up test users (Admin & Standard)...');
    await User.deleteMany({ email: { $in: ['quiz_admin_test@portal.test', 'quiz_user_test@portal.test'] } });

    const passwordHash = await bcrypt.hash('TestSecurePass123!', 10);

    adminUser = await User.create({
      fullName: 'Quiz Admin Officer',
      email: 'quiz_admin_test@portal.test',
      passwordHash,
      role: 'admin'
    });

    standardUser = await User.create({
      fullName: 'Quiz Standard User',
      email: 'quiz_user_test@portal.test',
      passwordHash,
      role: 'user'
    });

    // Login Admin
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'quiz_admin_test@portal.test', password: 'TestSecurePass123!' })
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.token;

    // Login User
    const userLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'quiz_user_test@portal.test', password: 'TestSecurePass123!' })
    });
    const userLoginData = await userLoginRes.json();
    userToken = userLoginData.token;

    console.log('  * PASS: Test sessions established\n');

    // Clean up previous test quizzes
    await Quiz.deleteMany({ title: { $regex: /^\[TEST\]/ } });

    // -------------------------------------------------------------------------
    // TEST 1: Admin can retrieve full quiz list with question & attempt counts
    // -------------------------------------------------------------------------
    console.log('TEST 1: Admin can retrieve full quiz list with question & attempt counts...');
    const listRes = await fetch(`${BASE_URL}/admin/quizzes`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const listData = await listRes.json();
    const quizzes = Array.isArray(listData) ? listData : (listData.quizzes || []);

    if (listRes.status !== 200 || !Array.isArray(quizzes)) {
      throw new Error(`Failed to retrieve admin quizzes. Status: ${listRes.status}`);
    }
    if (quizzes.length > 0) {
      const qSample = quizzes[0];
      if (typeof qSample.questionCount !== 'number' || typeof qSample.attemptCount !== 'number') {
        throw new Error(`Quiz missing questionCount or attemptCount: ${JSON.stringify(qSample)}`);
      }
    }
    console.log(`  * PASS: Retrieved ${quizzes.length} quizzes with question and attempt counts\n`);

    // -------------------------------------------------------------------------
    // TEST 2: Admin can create a new Quiz container with audit logging
    // -------------------------------------------------------------------------
    console.log('TEST 2: Admin can create a new Quiz container with schema validation & audit logging...');
    
    // Test validation failure
    const invalidCreateRes = await fetch(`${BASE_URL}/admin/quizzes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ category: 'cyber-law' }) // Missing required title
    });
    if (invalidCreateRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request for missing title, got ${invalidCreateRes.status}`);
    }

    // Valid create
    const validCreateRes = await fetch(`${BASE_URL}/admin/quizzes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: '[TEST] Digital Personal Data Protection Quiz',
        category: 'privacy',
        difficulty: 'intermediate',
        description: 'Comprehensive test of DPDP Act 2023 principles and administrative penalties.',
        relatedModule: 'it-act',
        published: true
      })
    });
    const validCreateData = await validCreateRes.json();
    const createdQuizId = validCreateData._id || validCreateData.quiz?._id;
    if (validCreateRes.status !== 201 || !createdQuizId) {
      throw new Error(`Failed to create quiz: ${JSON.stringify(validCreateData)}`);
    }

    // Verify Audit Log was generated
    const auditLogCreate = await AdminAuditLog.findOne({
      actionType: 'CREATE',
      entityType: 'Quiz',
      entityId: createdQuizId.toString()
    });
    if (!auditLogCreate) {
      throw new Error(`Expected audit log for Quiz creation, none found.`);
    }
    console.log(`  * PASS: Quiz created (${createdQuizId}) and audit log persisted\n`);

    // -------------------------------------------------------------------------
    // TEST 3: Admin can update Quiz container metadata with audit logging
    // -------------------------------------------------------------------------
    console.log('TEST 3: Admin can update Quiz metadata...');
    const updateRes = await fetch(`${BASE_URL}/admin/quizzes/${createdQuizId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: '[TEST] Digital Personal Data Protection Quiz (Updated)',
        difficulty: 'advanced'
      })
    });
    const updateData = await updateRes.json();
    const updatedDifficulty = updateData.difficulty || updateData.quiz?.difficulty;
    if (updateRes.status !== 200 || updatedDifficulty !== 'advanced') {
      throw new Error(`Failed to update quiz: ${JSON.stringify(updateData)}`);
    }

    const auditLogUpdate = await AdminAuditLog.findOne({
      actionType: 'UPDATE',
      entityType: 'Quiz',
      entityId: createdQuizId.toString()
    });
    if (!auditLogUpdate) {
      throw new Error(`Expected audit log for Quiz update, none found.`);
    }
    console.log(`  * PASS: Quiz updated and audit log verified\n`);

    // -------------------------------------------------------------------------
    // TEST 4: Admin can add questions to a quiz with options and explanations
    // -------------------------------------------------------------------------
    console.log('TEST 4: Admin can add questions to a quiz...');
    const addQuestionRes = await fetch(`${BASE_URL}/admin/quizzes/${createdQuizId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        questionText: 'Under DPDP Act 2023, what is the maximum penalty for failing to take reasonable security safeguards?',
        options: [
          'Up to Rs. 50 Crore',
          'Up to Rs. 150 Crore',
          'Up to Rs. 250 Crore',
          'Up to Rs. 500 Crore'
        ],
        correctOptionIndex: 2,
        explanation: 'Section 33 of the DPDP Act 2023 specifies a penalty up to Rs. 250 Crore for breach in observing obligation to take reasonable security safeguards.',
        difficulty: 'Advanced',
        cognitiveLevel: 'Level 4',
        legalBasis: 'DPDP Act 2023 Section 33',
        topicTags: ['DPDP Act', 'Penalties', 'Compliance']
      })
    });
    const addQuestionData = await addQuestionRes.json();
    const createdQuestionId = addQuestionData._id || addQuestionData.question?._id;
    if (addQuestionRes.status !== 201 || !createdQuestionId) {
      throw new Error(`Failed to add question: ${JSON.stringify(addQuestionData)}`);
    }

    // Verify QuizQuestion references the Quiz container
    const verifiedQuestion = await QuizQuestion.findById(createdQuestionId);
    if (!verifiedQuestion || verifiedQuestion.quizId.toString() !== createdQuizId.toString()) {
      throw new Error(`Question ID ${createdQuestionId} does not reference quiz ${createdQuizId}`);
    }

    // Verify Audit Log
    const auditLogQuestion = await AdminAuditLog.findOne({
      actionType: 'CREATE',
      entityType: 'QuizQuestion',
      entityId: createdQuestionId.toString()
    });
    if (!auditLogQuestion) {
      throw new Error(`Expected audit log for QuizQuestion creation, none found.`);
    }
    console.log(`  * PASS: Question created (${createdQuestionId}), linked to Quiz, and audit logged\n`);

    // -------------------------------------------------------------------------
    // TEST 5: Admin can inspect an individual quiz and see full question detail
    // -------------------------------------------------------------------------
    console.log('TEST 5: Admin can view quiz with full question details including correct answer...');
    const getQuizRes = await fetch(`${BASE_URL}/admin/quizzes/${createdQuizId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const getQuizData = await getQuizRes.json();
    const quizDetail = getQuizData.quiz || getQuizData;
    const questions = getQuizData.questions || quizDetail.questions || [];
    if (getQuizRes.status !== 200 || questions.length !== 1) {
      throw new Error(`Expected 1 question in quiz detail, got ${questions.length}`);
    }
    const questionDetail = questions[0];
    if (questionDetail.correctOptionIndex !== 2) {
      throw new Error(`Expected correctOptionIndex = 2 in admin detail view, got ${questionDetail.correctOptionIndex}`);
    }
    console.log(`  * PASS: Admin can see correct answers and explanations for administrative verification\n`);

    // -------------------------------------------------------------------------
    // TEST 6: Student quiz retrieval endpoint strips correct answers before submission
    // -------------------------------------------------------------------------
    console.log('TEST 6: Learner-facing quiz retrieval strips answers and explanations...');
    const studentQuizRes = await fetch(`${BASE_URL}/quizzes/${createdQuizId}/questions`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const studentQuestions = await studentQuizRes.json();
    if (studentQuizRes.status !== 200 || !Array.isArray(studentQuestions)) {
      throw new Error(`Failed to get learner quiz: ${JSON.stringify(studentQuestions)}`);
    }
    if (studentQuestions.length === 0) {
      throw new Error(`Expected at least 1 question for learner quiz`);
    }
    const studentQuestion = studentQuestions[0];
    if (studentQuestion.correctOptionIndex !== undefined) {
      throw new Error(`CRITICAL SECURITY FAILURE: Learner received correctOptionIndex before submission!`);
    }
    if (studentQuestion.explanation !== undefined) {
      throw new Error(`CRITICAL SECURITY FAILURE: Learner received explanation before submission!`);
    }
    console.log(`  * PASS: Learner-facing security verified: correctOptionIndex and explanation are strictly stripped\n`);

    // -------------------------------------------------------------------------
    // TEST 7: Admin can edit an existing quiz question
    // -------------------------------------------------------------------------
    console.log('TEST 7: Admin can edit a quiz question...');
    const updateQuestionRes = await fetch(`${BASE_URL}/admin/quizzes/${createdQuizId}/questions/${createdQuestionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        cognitiveLevel: 'Level 5',
        difficulty: 'Intermediate'
      })
    });
    const updateQuestionData = await updateQuestionRes.json();
    const updatedCog = updateQuestionData.cognitiveLevel || updateQuestionData.question?.cognitiveLevel;
    if (updateQuestionRes.status !== 200 || updatedCog !== 'Level 5') {
      throw new Error(`Failed to update question: ${JSON.stringify(updateQuestionData)}`);
    }
    console.log(`  * PASS: Quiz question updated successfully\n`);

    // -------------------------------------------------------------------------
    // TEST 8: Safe deletion protection when Quiz has learner attempts
    // -------------------------------------------------------------------------
    console.log('TEST 8: Attempt protection prevents deleting quizzes with learner history...');
    
    // Simulate a learner attempt on this quiz
    const simulatedAttempt = await QuizAttempt.create({
      userId: standardUser._id,
      quizId: createdQuizId,
      answers: [{
        questionId: createdQuestionId,
        selectedOptionIndex: 2
      }],
      score: 1,
      percentage: 100
    });

    // Try deleting quiz - must be REJECTED to preserve learner portfolio and score history
    const deleteAttemptProtectedRes = await fetch(`${BASE_URL}/admin/quizzes/${createdQuizId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (deleteAttemptProtectedRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request when deleting quiz with attempts, got ${deleteAttemptProtectedRes.status}`);
    }
    const deleteErrData = await deleteAttemptProtectedRes.json();
    if (!deleteErrData.message.toLowerCase().includes('attempt')) {
      throw new Error(`Unexpected error message on blocked delete: ${deleteErrData.message}`);
    }
    console.log(`  * PASS: Deletion blocked to protect learner trajectory: "${deleteErrData.message}"\n`);

    // -------------------------------------------------------------------------
    // TEST 9: Safe question removal with learner history soft-unpublishes
    // -------------------------------------------------------------------------
    console.log('TEST 9: Question removal with learner history soft-unpublishes rather than corrupting attempts...');
    const deleteQuestionRes = await fetch(`${BASE_URL}/admin/quizzes/${createdQuizId}/questions/${createdQuestionId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const deleteQuestionData = await deleteQuestionRes.json();
    if (deleteQuestionRes.status !== 200 || !deleteQuestionData.success) {
      throw new Error(`Failed to process question deletion: ${JSON.stringify(deleteQuestionData)}`);
    }
    if (!deleteQuestionData.softUnpublished) {
      throw new Error(`Expected question to be soft-unpublished due to existing attempts!`);
    }
    const checkQuestionInDb = await QuizQuestion.findById(createdQuestionId);
    if (!checkQuestionInDb || checkQuestionInDb.published !== false) {
      throw new Error(`Expected question in DB to remain but have published: false`);
    }
    console.log(`  * PASS: Question safely unpublished (${deleteQuestionData.message})\n`);

    // Clean up simulated attempt
    await QuizAttempt.findByIdAndDelete(simulatedAttempt._id);

    // Now deleting the question with 0 attempts should permanently delete it
    const permDeleteQuestionRes = await fetch(`${BASE_URL}/admin/quizzes/${createdQuizId}/questions/${createdQuestionId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const permDeleteData = await permDeleteQuestionRes.json();
    if (permDeleteQuestionRes.status !== 200 || permDeleteData.softUnpublished) {
      throw new Error(`Expected permanent deletion when no attempts exist`);
    }
    console.log(`  * PASS: Question permanently removed when zero learner attempts exist\n`);

    // Delete quiz now that attempts are cleared
    const cleanDeleteQuizRes = await fetch(`${BASE_URL}/admin/quizzes/${createdQuizId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (cleanDeleteQuizRes.status !== 200) {
      throw new Error(`Failed to clean up quiz after attempt was removed: ${cleanDeleteQuizRes.status}`);
    }
    console.log(`  * PASS: Quiz cleanly deleted once attempts cleared\n`);

    // -------------------------------------------------------------------------
    // TEST 10: Non-admin users are rejected from quiz management mutations
    // -------------------------------------------------------------------------
    console.log('TEST 10: Non-admin users receive 403 Forbidden on quiz admin endpoints...');
    const forbiddenCreateRes = await fetch(`${BASE_URL}/admin/quizzes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
      body: JSON.stringify({ title: 'Hack Quiz', category: 'phishing' })
    });
    if (forbiddenCreateRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for non-admin quiz creation, got ${forbiddenCreateRes.status}`);
    }

    const forbiddenListRes = await fetch(`${BASE_URL}/admin/quizzes`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    if (forbiddenListRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for non-admin quiz list, got ${forbiddenListRes.status}`);
    }
    console.log(`  * PASS: Non-admin strictly forbidden (403) from quiz management\n`);

    // -------------------------------------------------------------------------
    // TEST 11: Admin can retrieve versioned scenario list
    // -------------------------------------------------------------------------
    console.log('TEST 11: Admin can retrieve versioned scenario engine list...');
    const scenarioListRes = await fetch(`${BASE_URL}/admin/scenarios`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const scenarioListData = await scenarioListRes.json();
    const scenarios = Array.isArray(scenarioListData) ? scenarioListData : (scenarioListData.scenarios || []);
    if (scenarioListRes.status !== 200 || !Array.isArray(scenarios)) {
      throw new Error(`Failed to get scenarios: ${JSON.stringify(scenarioListData)}`);
    }
    if (scenarios.length === 0) {
      throw new Error(`Expected database to have scenarios, got 0`);
    }
    console.log(`  * PASS: Found ${scenarios.length} versioned scenarios in database\n`);

    // -------------------------------------------------------------------------
    // TEST 12: Admin can inspect an individual scenario with stages and decisions
    // -------------------------------------------------------------------------
    console.log('TEST 12: Admin can inspect scenario stages and decision matrices...');
    const targetScenarioId = scenarios[0]._id;
    const scenarioDetailRes = await fetch(`${BASE_URL}/admin/scenarios/${targetScenarioId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const scenarioDetailData = await scenarioDetailRes.json();
    if (scenarioDetailRes.status !== 200 || !scenarioDetailData.scenario || !Array.isArray(scenarioDetailData.stages)) {
      throw new Error(`Failed to get scenario detail: ${JSON.stringify(scenarioDetailData)}`);
    }
    const sc = scenarioDetailData.scenario;
    const stages = scenarioDetailData.stages;
    if (stages.length === 0) {
      throw new Error(`Scenario ${targetScenarioId} has no stages`);
    }
    const stage0 = stages[0];
    if (!Array.isArray(stage0.decisions)) {
      throw new Error(`Stage 0 has no decisions array`);
    }
    console.log(`  * PASS: Scenario "${sc.title}" (v${sc.version}) has ${stages.length} stages loaded\n`);

    // -------------------------------------------------------------------------
    // TEST 13: Scenario Graph Integrity Audit endpoint
    // -------------------------------------------------------------------------
    console.log('TEST 13: Admin can run Scenario Graph Integrity Audit...');
    const auditScenarioRes = await fetch(`${BASE_URL}/admin/scenarios/${targetScenarioId}/audit`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const auditResult = await auditScenarioRes.json();
    if (auditScenarioRes.status !== 200 || typeof auditResult.valid !== 'boolean' || !Array.isArray(auditResult.errors) || !Array.isArray(auditResult.warnings)) {
      throw new Error(`Invalid audit report shape: ${JSON.stringify(auditResult)}`);
    }
    console.log(`  * PASS: Scenario graph audit executed: valid: ${auditResult.valid}, errors: ${auditResult.errors.length}, warnings: ${auditResult.warnings.length}\n`);

    // -------------------------------------------------------------------------
    // TEST 14: Non-admin users are rejected from scenario administration
    // -------------------------------------------------------------------------
    console.log('TEST 14: Non-admin users are rejected from scenario administration...');
    const userScenarioRes = await fetch(`${BASE_URL}/admin/scenarios`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    if (userScenarioRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for non-admin scenario access, got ${userScenarioRes.status}`);
    }
    console.log(`  * PASS: Non-admin strictly forbidden (403) from scenario inspection\n`);

    console.log('====================================================');
    console.log('✅ ALL 14 QUIZ & SCENARIO ENGINE VERIFICATIONS PASSED!');
    console.log('====================================================\n');

  } catch (err) {
    console.error('❌ TEST FAILURE:', err);
    process.exitCode = 1;
  } finally {
    // Cleanup test data
    try {
      const testQuizzes = await Quiz.find({ title: { $regex: /^\[TEST\]/ } });
      const testQuizIds = testQuizzes.map(q => q._id);
      await QuizQuestion.deleteMany({ $or: [{ quizId: { $in: testQuizIds } }, { questionText: { $regex: /DPDP Act 2023/i } }] });
      await Quiz.deleteMany({ _id: { $in: testQuizIds } });
      await User.deleteMany({ email: { $in: ['quiz_admin_test@portal.test', 'quiz_user_test@portal.test'] } });
    } catch (cleanupErr) {
      console.warn('Test cleanup error:', cleanupErr.message);
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log('Test server shut down.');
    }
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

runQuizAndScenarioAdminTests();
