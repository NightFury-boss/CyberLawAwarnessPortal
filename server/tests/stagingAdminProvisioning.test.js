/**
 * Cyber Law Awareness Portal — Staging Admin Provisioning Test Suite
 *
 * Strictly offline test suite (mocks + isolated Mongoose User schema validation,
 * zero connections to Atlas staging or development databases, zero .env loading).
 *
 * Covers:
 * 1. Offline isolation, singleton contract, and zero dotenv usage.
 * 2. Strict staging guard, host/DB matching, and credential validation rejections.
 * 3. Runtime connected DB/host mismatch rejection before queries.
 * 4. Existing administrator rejection (zero writes).
 * 5. Duplicate email collision rejection (case-insensitive, zero writes).
 * 6. Successful single-admin provisioning, bcrypt hash compatibility, schema check,
 *    and complete preservation of existing learner User & UserProgress records.
 * 7. Post-insert verification failures and UserProgress boundary violation detection.
 * 8. Full CLI execution lifecycle (masked logs, zero secret leakage, error-before-disconnect).
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const bcrypt = require('bcryptjs');

const {
  mongoose: engineMongoose,
  ALL_MODELS
} = require('../config/stagingInitializerEngine');
const {
  REQUIRED_STAGING_DB_NAME,
  REQUIRED_STAGING_HOST,
  BCRYPT_WORK_FACTOR,
  maskEmail,
  validateStagingAdminCredentials,
  validateStagingAdminEnvironment,
  verifyConnectedStagingTarget,
  provisionStagingAdmin
} = require('../config/stagingAdminProvisioner');
const adminCli = require('../../scripts/createStagingAdmin');

const VALID_STAGING_ENV = Object.freeze({
  ASSERT_STAGING_DB: 'true',
  EXPECTED_STAGING_DB_NAME: 'cyber_law_staging',
  EXPECTED_STAGING_HOST: 'cluster0.xxeclfp.mongodb.net',
  MONGODB_URI: 'mongodb+srv://mock_admin:MockSecretPass!@cluster0.xxeclfp.mongodb.net/cyber_law_staging?retryWrites=true&w=majority',
  ADMIN_EMAIL: 'Staging.Admin@CyberLawExample.org',
  ADMIN_PASSWORD: 'StrongStagingAdminPassword#2026!'
});

function createMockAdminUserStore({
  initialUsers = [],
  initialUserProgress = [],
  postInsertOverride = null
} = {}) {
  const userDocs = initialUsers.map((u) => ({ ...u }));
  const userProgressDocs = initialUserProgress.map((p) => ({ ...p }));
  let createCalls = 0;
  let hasInserted = false;
  let idSeq = userDocs.length + 1;

  return {
    userDocs,
    userProgressDocs,
    getCreateCalls: () => createCalls,

    async findAdmins() {
      if (hasInserted && typeof postInsertOverride?.findAdmins === 'function') {
        return postInsertOverride.findAdmins(userDocs);
      }
      return userDocs
        .filter((u) => u.role === 'admin')
        .map((u) => ({
          _id: u._id,
          email: u.email,
          role: u.role,
          isActive: u.isActive,
          createdAt: u.createdAt
        }));
    },

    async findByEmailCaseInsensitive(normalizedEmail) {
      const target = String(normalizedEmail).toLowerCase();
      return userDocs
        .filter((u) => String(u.email || '').toLowerCase() === target)
        .map((u) => ({
          _id: u._id,
          email: u.email,
          role: u.role,
          isActive: u.isActive
        }));
    },

    async countUsers() {
      if (hasInserted && typeof postInsertOverride?.countUsers === 'function') {
        return postInsertOverride.countUsers(userDocs);
      }
      return userDocs.length;
    },

    async countLearners() {
      if (hasInserted && typeof postInsertOverride?.countLearners === 'function') {
        return postInsertOverride.countLearners(userDocs);
      }
      return userDocs.filter((u) => u.role === 'user').length;
    },

    async countUserProgress() {
      if (hasInserted && typeof postInsertOverride?.countUserProgress === 'function') {
        return postInsertOverride.countUserProgress(userProgressDocs);
      }
      return userProgressDocs.length;
    },

    async createAdminUser(payload) {
      createCalls += 1;
      hasInserted = true;

      // Validate against real Mongoose User schema without hitting any DB socket
      const docInstance = new ALL_MODELS.User(payload);
      const syncErr = docInstance.validateSync();
      if (syncErr) {
        throw new Error(`Schema validation failed: ${syncErr.message}`);
      }

      const persisted = {
        _id: new engineMongoose.Types.ObjectId().toString(),
        fullName: docInstance.fullName,
        email: docInstance.email,
        passwordHash: docInstance.passwordHash,
        role: docInstance.role,
        isActive: docInstance.isActive,
        createdAt: new Date(),
        seq: idSeq++
      };
      userDocs.push(persisted);
      return {
        _id: persisted._id,
        fullName: persisted.fullName,
        email: persisted.email,
        role: persisted.role,
        isActive: persisted.isActive
      };
    }
  };
}

describe('Dedicated Staging Administrator Provisioning Suite (Offline / Isolated)', () => {
  it('1. Strictly avoids live DB sockets, preserves Mongoose singleton, and uses zero dotenv', () => {
    assert.equal(engineMongoose.connection.readyState, 0);
    assert.strictEqual(adminCli.mongoose, engineMongoose);

    const cliSource = fs.readFileSync(path.join(__dirname, '../../scripts/createStagingAdmin.js'), 'utf8');
    const engineSource = fs.readFileSync(path.join(__dirname, '../config/stagingAdminProvisioner.js'), 'utf8');

    assert.equal(/require\(['"]mongoose['"]\)/.test(cliSource), false, 'CLI must reuse engine mongoose singleton');
    assert.equal(/dotenv/.test(cliSource), false, 'CLI must never import dotenv');
    assert.equal(/dotenv/.test(engineSource), false, 'Provisioner must never import dotenv');
  });

  it('2. Staging guard rejects unsafe environments, wrong host/DB, missing/weak credentials', () => {
    // Missing ASSERT_STAGING_DB
    assert.throws(
      () => validateStagingAdminEnvironment({ ...VALID_STAGING_ENV, ASSERT_STAGING_DB: 'false' }),
      /ASSERT_STAGING_DB/
    );

    // Wrong database name
    assert.throws(
      () => validateStagingAdminEnvironment({
        ...VALID_STAGING_ENV,
        EXPECTED_STAGING_DB_NAME: 'cyber_law_portal',
        MONGODB_URI: 'mongodb+srv://u:p@cluster0.xxeclfp.mongodb.net/cyber_law_portal'
      }),
      /EXPECTED_STAGING_DB_NAME/
    );

    // Wrong Atlas host (must match cluster0.xxeclfp.mongodb.net)
    assert.throws(
      () => validateStagingAdminEnvironment({
        ...VALID_STAGING_ENV,
        EXPECTED_STAGING_HOST: 'othercluster.xxeclfp.mongodb.net',
        MONGODB_URI: 'mongodb+srv://u:p@othercluster.xxeclfp.mongodb.net/cyber_law_staging'
      }),
      /does not match required Atlas host/
    );

    // Localhost URI rejection
    assert.throws(
      () => validateStagingAdminEnvironment({
        ...VALID_STAGING_ENV,
        EXPECTED_STAGING_HOST: 'localhost',
        MONGODB_URI: 'mongodb://127.0.0.1:27017/cyber_law_staging'
      }),
      /local host/
    );

    // Missing or invalid admin credentials
    assert.throws(
      () => validateStagingAdminCredentials({ ...VALID_STAGING_ENV, ADMIN_EMAIL: '' }),
      /ADMIN_EMAIL.*required/
    );
    assert.throws(
      () => validateStagingAdminCredentials({ ...VALID_STAGING_ENV, ADMIN_EMAIL: 'not-an-email' }),
      /valid email address/
    );
    assert.throws(
      () => validateStagingAdminCredentials({ ...VALID_STAGING_ENV, ADMIN_PASSWORD: 'short' }),
      /at least 8 characters/
    );
    assert.throws(
      () => validateStagingAdminCredentials({
        ...VALID_STAGING_ENV,
        ADMIN_PASSWORD: 'change_this_to_a_strong_staging_admin_password_123!'
      }),
      /known insecure placeholder/
    );

    // Passing env passes cleanly
    const approved = validateStagingAdminEnvironment(VALID_STAGING_ENV);
    assert.equal(approved.dbName, REQUIRED_STAGING_DB_NAME);
    assert.equal(approved.host, REQUIRED_STAGING_HOST);
  });

  it('3. Runtime connection target verifier fails closed on wrong connected DB or host', () => {
    assert.throws(
      () => verifyConnectedStagingTarget(
        { connection: { name: 'cyber_law_portal', host: 'cluster0-shard.xxeclfp.mongodb.net' } },
        REQUIRED_STAGING_DB_NAME,
        REQUIRED_STAGING_HOST
      ),
      /Connected database "cyber_law_portal" does not match/
    );

    assert.throws(
      () => verifyConnectedStagingTarget(
        {
          connection: {
            name: 'cyber_law_staging',
            host: 'ac-other-shard.yyyyy.mongodb.net',
            client: { options: { srvHost: 'wrong.cluster.mongodb.net' } }
          }
        },
        REQUIRED_STAGING_DB_NAME,
        REQUIRED_STAGING_HOST
      ),
      /Connected cluster SRV host/
    );

    const ok = verifyConnectedStagingTarget(
      {
        connection: {
          name: 'cyber_law_staging',
          host: 'ac-abc-shard-00-00.xxeclfp.mongodb.net',
          client: { options: { srvHost: 'cluster0.xxeclfp.mongodb.net' } }
        }
      },
      REQUIRED_STAGING_DB_NAME,
      REQUIRED_STAGING_HOST
    );
    assert.equal(ok.connectedDbName, 'cyber_law_staging');
    assert.equal(ok.srvHost, 'cluster0.xxeclfp.mongodb.net');
  });

  it('4. Aborts with zero writes when an existing administrator account already exists', async () => {
    const existingLearner = {
      _id: 'learner-1',
      fullName: 'Existing Learner',
      email: 'learner@example.org',
      passwordHash: '$2a$10$existinghash',
      role: 'user',
      isActive: true
    };
    const existingAdmin = {
      _id: 'admin-1',
      fullName: 'Existing Admin',
      email: 'prior.admin@example.org',
      passwordHash: '$2a$10$existingadminhash',
      role: 'admin',
      isActive: true
    };
    const existingProgress = { _id: 'prog-1', userId: 'learner-1', completedModules: ['mod-1'] };

    const store = createMockAdminUserStore({
      initialUsers: [existingLearner, existingAdmin],
      initialUserProgress: [existingProgress]
    });

    await assert.rejects(
      () => provisionStagingAdmin({ env: VALID_STAGING_ENV, store }),
      /existing administrator account\(s\) detected/
    );

    assert.equal(store.getCreateCalls(), 0);
    assert.equal(store.userDocs.length, 2);
    assert.equal(store.userProgressDocs.length, 1);
  });

  it('5. Aborts with zero writes on duplicate email (case-insensitive) and never echoes secrets', async () => {
    const existingLearner = {
      _id: 'learner-1',
      fullName: 'Staging Learner',
      email: 'staging.admin@cyberlawexample.org',
      passwordHash: '$2a$10$learnerhash',
      role: 'user',
      isActive: true
    };
    const existingProgress = { _id: 'prog-1', userId: 'learner-1', completedModules: [] };

    const store = createMockAdminUserStore({
      initialUsers: [existingLearner],
      initialUserProgress: [existingProgress]
    });

    let caughtErr;
    try {
      await provisionStagingAdmin({ env: VALID_STAGING_ENV, store });
    } catch (err) {
      caughtErr = err;
    }

    assert.ok(caughtErr, 'Expected duplicate email error');
    assert.match(caughtErr.message, /already belongs to an existing account/);
    assert.equal(caughtErr.message.includes('Staging.Admin@CyberLawExample.org'), false, 'Must mask email in error');
    assert.equal(caughtErr.message.includes(VALID_STAGING_ENV.ADMIN_PASSWORD), false, 'Must never expose password');
    assert.equal(store.getCreateCalls(), 0);
    assert.equal(store.userDocs.length, 1);
    assert.equal(store.userDocs[0].role, 'user');
    assert.equal(store.userProgressDocs.length, 1);
  });

  it('6. Provisions strictly one active admin matching User schema & bcrypt cost 10 while leaving learner intact', async () => {
    const existingLearner = {
      _id: 'learner-1',
      fullName: 'Active Staging Learner',
      email: 'learner@cyberlawexample.org',
      passwordHash: '$2a$10$learnerhashkeptuntouched',
      role: 'user',
      isActive: true
    };
    const learnerSnapshot = JSON.stringify(existingLearner);
    const existingProgress = {
      _id: 'prog-1',
      userId: 'learner-1',
      completedModules: ['it-act-overview'],
      badgesEarned: ['First Step'],
      currentStreak: 1
    };
    const progressSnapshot = JSON.stringify(existingProgress);

    const store = createMockAdminUserStore({
      initialUsers: [existingLearner],
      initialUserProgress: [existingProgress]
    });

    const result = await provisionStagingAdmin({ env: VALID_STAGING_ENV, store });

    assert.equal(result.status, 'PROVISIONED_AND_VERIFIED');
    assert.equal(result.verification, 'PASSED');
    assert.equal(result.database, 'cyber_law_staging');
    assert.equal(result.role, 'admin');
    assert.equal(result.isActive, true);
    assert.equal(result.adminCount, 1);
    assert.equal(result.existingLearnersPreserved, 1);
    assert.equal(result.userProgressPreserved, 1);
    assert.equal(result.maskedEmail, maskEmail(VALID_STAGING_ENV.ADMIN_EMAIL));

    // Assert strictly 1 created document and 0 touches to learner or UserProgress
    assert.equal(store.getCreateCalls(), 1);
    assert.equal(store.userDocs.length, 2);
    assert.equal(store.userProgressDocs.length, 1);
    assert.equal(JSON.stringify(store.userDocs[0]), learnerSnapshot, 'Existing learner must remain byte-for-byte untouched');
    assert.equal(JSON.stringify(store.userProgressDocs[0]), progressSnapshot, 'Existing UserProgress must remain untouched');

    // Verify new admin document shape & password hash compatibility with authController
    const newAdmin = store.userDocs[1];
    assert.equal(newAdmin.email, 'staging.admin@cyberlawexample.org');
    assert.equal(newAdmin.role, 'admin');
    assert.equal(newAdmin.isActive, true);
    assert.equal(newAdmin.fullName, 'Staging Administrator');
    assert.ok(newAdmin.passwordHash.startsWith(`$2a$${BCRYPT_WORK_FACTOR}$`) || newAdmin.passwordHash.startsWith(`$2b$${BCRYPT_WORK_FACTOR}$`));
    assert.equal(await bcrypt.compare(VALID_STAGING_ENV.ADMIN_PASSWORD, newAdmin.passwordHash), true);
  });

  it('7. Fails verification cleanly when post-insert query reports unexpected role, inactive status, count, or UserProgress mutation', async () => {
    const baseLearner = {
      _id: 'learner-1',
      fullName: 'Active Learner',
      email: 'learner@cyberlawexample.org',
      passwordHash: '$2a$10$hash',
      role: 'user',
      isActive: true
    };
    const baseProgress = { _id: 'prog-1', userId: 'learner-1', completedModules: [] };

    // A. Post-insert query returns wrong role
    const badRoleStore = createMockAdminUserStore({
      initialUsers: [baseLearner],
      initialUserProgress: [baseProgress],
      postInsertOverride: {
        findAdmins: async (docs) => docs
          .filter((d) => d.role === 'admin')
          .map((d) => ({ ...d, role: 'user' }))
      }
    });
    await assert.rejects(
      () => provisionStagingAdmin({ env: VALID_STAGING_ENV, store: badRoleStore }),
      /\[VERIFICATION ERROR\].*role mismatch/
    );

    // B. Post-insert query returns inactive admin
    const inactiveStore = createMockAdminUserStore({
      initialUsers: [baseLearner],
      initialUserProgress: [baseProgress],
      postInsertOverride: {
        findAdmins: async (docs) => docs
          .filter((d) => d.role === 'admin')
          .map((d) => ({ ...d, isActive: false }))
      }
    });
    await assert.rejects(
      () => provisionStagingAdmin({ env: VALID_STAGING_ENV, store: inactiveStore }),
      /\[VERIFICATION ERROR\].*isActive mismatch/
    );

    // C. Post-insert query finds 0 or >1 admin records
    const wrongAdminCountStore = createMockAdminUserStore({
      initialUsers: [baseLearner],
      initialUserProgress: [baseProgress],
      postInsertOverride: {
        findAdmins: async () => []
      }
    });
    await assert.rejects(
      () => provisionStagingAdmin({ env: VALID_STAGING_ENV, store: wrongAdminCountStore }),
      /\[VERIFICATION ERROR\].*Expected exactly 1 administrator account/
    );

    // D. UserProgress count changed unexpectedly
    const progressMutatedStore = createMockAdminUserStore({
      initialUsers: [baseLearner],
      initialUserProgress: [baseProgress],
      postInsertOverride: {
        countUserProgress: async () => 2
      }
    });
    await assert.rejects(
      () => provisionStagingAdmin({ env: VALID_STAGING_ENV, store: progressMutatedStore }),
      /\[DATA BOUNDARY VIOLATION\]/
    );
  });

  it('8. CLI isolates execution, masks all sensitive outputs, and disconnects cleanly on success & failure', () => {
    // Direct CLI invocation from repo root without staging env vars must fail closed immediately
    let noEnvExit = 0;
    let noEnvErr = '';
    try {
      execFileSync(process.execPath, ['scripts/createStagingAdmin.js'], {
        cwd: path.resolve(__dirname, '../..'),
        env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot },
        encoding: 'utf8',
        stdio: 'pipe'
      });
    } catch (err) {
      noEnvExit = err.status;
      noEnvErr = `${err.stdout || ''}\n${err.stderr || ''}`;
    }
    assert.equal(noEnvExit, 1);
    assert.match(noEnvErr, /\[STAGING INIT GUARD\] ASSERT_STAGING_DB/);

    const runChild = (simulateVerificationFailure) => {
      const childCode = `
        const emittedOrder = [];
        const origErr = console.error;
        const origLog = console.log;
        console.error = (...args) => {
          emittedOrder.push(args.join(' '));
          origErr.apply(console, args);
        };
        console.log = (...args) => {
          emittedOrder.push(args.join(' '));
          origLog.apply(console, args);
        };

        const cli = require('./scripts/createStagingAdmin');
        const eng = require('./server/config/stagingInitializerEngine');

        cli.mongoose.connect = async () => {
          Object.defineProperty(eng.mongoose.connection, 'readyState', { value: 1, configurable: true });
          Object.defineProperty(eng.mongoose.connection, 'name', { value: 'cyber_law_staging', configurable: true });
          Object.defineProperty(eng.mongoose.connection, 'host', { value: 'ac-mock-shard-00-00.xxeclfp.mongodb.net', configurable: true });
          Object.defineProperty(eng.mongoose.connection, 'client', {
            value: { options: { srvHost: 'cluster0.xxeclfp.mongodb.net' } },
            configurable: true
          });
          for (const Model of Object.values(eng.ALL_MODELS)) {
            Object.defineProperty(Model.collection, 'buffer', { value: false, configurable: true });
          }
          return eng.mongoose;
        };
        cli.mongoose.disconnect = async () => {
          for (const Model of Object.values(eng.ALL_MODELS)) {
            Object.defineProperty(Model.collection, 'buffer', { value: true, configurable: true });
          }
          Object.defineProperty(eng.mongoose.connection, 'readyState', { value: 0, configurable: true });
        };

        const mockStore = {
          docs: [{ _id: 'l1', fullName: 'Learner', email: 'learner@test.org', passwordHash: '$2a$10$old', role: 'user', isActive: true }],
          async findAdmins() {
            const admins = this.docs.filter((d) => d.role === 'admin');
            if (${simulateVerificationFailure ? 'true' : 'false'} && admins.length > 0) {
              return admins.map((a) => ({ ...a, isActive: false }));
            }
            return admins;
          },
          async findByEmailCaseInsensitive(em) {
            return this.docs.filter((d) => d.email === em);
          },
          async countUsers() { return this.docs.length; },
          async countLearners() { return this.docs.filter((d) => d.role === 'user').length; },
          async countUserProgress() { return 1; },
          async createAdminUser(payload) {
            const created = { _id: 'a1', ...payload };
            this.docs.push(created);
            return created;
          }
        };

        cli.runCli([], { store: mockStore })
          .then(() => {
            const dotenvLoaded = Object.keys(require.cache).some((k) => k.toLowerCase().includes('dotenv'));
            origLog('__DOTENV__:' + dotenvLoaded + '__READYSTATE__:' + eng.mongoose.connection.readyState);
            process.exit(0);
          })
          .catch(() => {
            origLog('__EMITTED_ORDER__:' + JSON.stringify(emittedOrder));
            origErr('__READYSTATE_ERR__:' + eng.mongoose.connection.readyState);
            process.exit(2);
          });
      `;

      let stdout = '';
      let stderr = '';
      let status = 0;
      try {
        stdout = execFileSync(process.execPath, ['-e', childCode], {
          cwd: path.resolve(__dirname, '../..'),
          env: {
            PATH: process.env.PATH,
            SystemRoot: process.env.SystemRoot,
            ...VALID_STAGING_ENV
          },
          encoding: 'utf8',
          stdio: 'pipe'
        });
      } catch (err) {
        status = err.status;
        stdout = err.stdout || '';
        stderr = err.stderr || '';
      }
      return { status, stdout, stderr };
    };

    // Success lifecycle check
    const okRun = runChild(false);
    assert.equal(okRun.status, 0, `Expected exit 0, got stderr:\n${okRun.stderr}`);
    assert.match(okRun.stdout, /Masked Email\s*:\s*st\*\*\*@cyberlawexample\.org/);
    assert.match(okRun.stdout, /Role\s*:\s*admin/);
    assert.match(okRun.stdout, /Active Status\s*:\s*true/);
    assert.match(okRun.stdout, /Database\s*:\s*cyber_law_staging/);
    assert.match(okRun.stdout, /Verification\s*:\s*PASSED/);
    assert.match(okRun.stdout, /\[Database\] Disconnected cleanly\./);
    assert.match(okRun.stdout, /__DOTENV__:false__READYSTATE__:0/);

    // Verify zero credential / full email leakage
    assert.equal(okRun.stdout.includes(VALID_STAGING_ENV.ADMIN_PASSWORD), false, 'Must never print raw password');
    assert.equal(okRun.stdout.includes('MockSecretPass!'), false, 'Must never print raw DB password');
    assert.equal(okRun.stdout.toLowerCase().includes('staging.admin@cyberlawexample.org'), false, 'Must never print unmasked email');

    // Failure lifecycle check: error must be logged chronologically BEFORE disconnect
    const failRun = runChild(true);
    assert.equal(failRun.status, 2);
    const markerLine = failRun.stdout.split(/\r?\n/).find((l) => l.startsWith('__EMITTED_ORDER__:'));
    assert.ok(markerLine, `Missing __EMITTED_ORDER__ trace in failure stdout:\n${failRun.stdout}`);
    const emitted = JSON.parse(markerLine.slice('__EMITTED_ORDER__:'.length));
    const errIdx = emitted.findIndex((line) => line.includes('[ADMIN PROVISION ERROR]'));
    const discIdx = emitted.findIndex((line) => line.includes('[Database] Disconnected cleanly.'));
    assert.ok(errIdx !== -1, `Expected [ADMIN PROVISION ERROR] in emitted events:\n${emitted.join('\n')}`);
    assert.ok(discIdx !== -1, `Expected [Database] Disconnected cleanly. in emitted events:\n${emitted.join('\n')}`);
    assert.ok(errIdx < discIdx, `Error must be emitted BEFORE disconnect! Events:\n${emitted.join('\n')}`);
    assert.match(failRun.stderr, /__READYSTATE_ERR__:0/);
  });
});
