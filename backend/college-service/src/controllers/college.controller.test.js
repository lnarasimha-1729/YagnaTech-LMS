import { jest } from '@jest/globals';

// Mock the model + helper modules the controller imports BEFORE importing it
// (ESM hoisting requires unstable_mockModule + dynamic import). College is a
// default export; the util modules are named exports.
const mockCollege = {
  findOne: jest.fn(),
  findByPk: jest.fn(),
  create: jest.fn(),
};

jest.unstable_mockModule('../db/models/College.js', () => ({
  default: mockCollege,
}));
jest.unstable_mockModule('../db/models/Branch.js', () => ({
  default: { findAll: jest.fn() },
}));
jest.unstable_mockModule('../utils/uidGeneration.js', () => ({
  generateCollegeId: () => 'clg_generated',
  generateAccessKey: () => 'accesskey_generated',
}));

const { getCollegeByCode, addCollege } = await import('./college.controller.js');
const { generateCollegeCode } = await import('../utils/collegeCode.js');

// Minimal Express res double capturing status + json.
function makeRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getCollegeByCode (signup using collegeCode)', () => {
  test('resolves a college from a valid code', async () => {
    const college = {
      clgId: 'clg_abc',
      yagId: 'AB12',
      clgName: 'Test College',
    };
    mockCollege.findOne.mockResolvedValue(college);

    const req = { params: { code: 'ab12' } }; // lowercase → normalized
    const res = makeRes();
    await getCollegeByCode(req, res);

    // Looked up by the normalized (uppercased) code.
    expect(mockCollege.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { yagId: 'AB12' } })
    );
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(college);
  });

  test('returns 400 for an invalid code (without touching the DB)', async () => {
    const req = { params: { code: 'BAD-CODE' } };
    const res = makeRes();
    await getCollegeByCode(req, res);

    expect(res.statusCode).toBe(400);
    expect(mockCollege.findOne).not.toHaveBeenCalled();
  });

  test('returns 404 when no college owns a well-formed code', async () => {
    mockCollege.findOne.mockResolvedValue(null);
    const req = { params: { code: 'ZZZZ' } };
    const res = makeRes();
    await getCollegeByCode(req, res);

    expect(res.statusCode).toBe(404);
  });
});

describe('addCollege (collegeCode generation on create)', () => {
  test('generates the deterministic code and persists it', async () => {
    mockCollege.findByPk.mockResolvedValue(null); // clgId not taken
    mockCollege.findOne.mockResolvedValue(null); // code not taken
    mockCollege.create.mockImplementation(async (row) => row);

    const req = { body: { clgName: 'New College', clgId: 'clg_fixed' } };
    const res = makeRes();
    await addCollege(req, res);

    expect(res.statusCode).toBe(201);
    expect(mockCollege.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clgId: 'clg_fixed',
        yagId: generateCollegeCode('clg_fixed'),
      })
    );
  });

  test('resolves a collision by advancing past an already-taken code', async () => {
    const base = generateCollegeCode('clg_fixed');
    mockCollege.findByPk.mockResolvedValue(null);
    // First candidate (base) is taken, second is free.
    mockCollege.findOne
      .mockResolvedValueOnce({ clgId: 'other', yagId: base })
      .mockResolvedValueOnce(null);
    mockCollege.create.mockImplementation(async (row) => row);

    const req = { body: { clgName: 'New College', clgId: 'clg_fixed' } };
    const res = makeRes();
    await addCollege(req, res);

    expect(res.statusCode).toBe(201);
    const created = mockCollege.create.mock.calls[0][0];
    expect(created.yagId).not.toBe(base);
    expect(/^[A-Z0-9]{4}$/.test(created.yagId)).toBe(true);
  });
});
